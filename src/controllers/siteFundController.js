const { Op } = require("sequelize");
const {
  SiteFundDisbursement,
  Expense,
  ExpenseCategory,
  Payment,
  ProjectStorekeeper,
  User,
  Project,
} = require("../models/index");
const { Technician } = require("../models/technician.model");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPagination,
} = require("../utils/response");
const { audit } = require("../utils/audit");

const STOREKEEPER_ATTRS = ["id", "firstName", "lastName", "email"];

function dateRangeWhere(query) {
  const { dateFrom, dateTo } = query;
  if (!dateFrom && !dateTo) return {};
  const where = {};
  if (dateFrom) where[Op.gte] = dateFrom;
  if (dateTo) where[Op.lte] = dateTo;
  return { date: where };
}

const isLabour = (categoryName) => (categoryName || "").trim().toLowerCase() === "labour";

// Split a flat expense list into { materials, labour } — Labour (casual site
// workers paid in cash) is tracked separately from other Materials categories
// per the user's request, even though both come out of the same site fund.
function splitByLabour(expenses) {
  const materials = [];
  const labour = [];
  for (const e of expenses) {
    if (isLabour(e.category?.name)) labour.push(e);
    else materials.push(e);
  }
  return { materials, labour };
}

function summarizeExpenses(expenses) {
  const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const byCategory = Object.values(
    expenses.reduce((acc, e) => {
      const key = e.category?.name || "Uncategorized";
      if (!acc[key]) acc[key] = { category: key, amount: 0 };
      acc[key].amount += parseFloat(e.amount);
      return acc;
    }, {}),
  )
    .map((r) => ({ ...r, amount: +r.amount.toFixed(2) }))
    .sort((a, b) => b.amount - a.amount);
  return { total: +total.toFixed(2), byCategory, items: expenses };
}

// Build the {received, spent, balance, expenseBreakdown, transactions} summary
// for ONE storekeeper on ONE project, over an optional date range.
async function buildStorekeeperSummary(projectId, storekeeperUserId, query) {
  const dateWhere = dateRangeWhere(query);

  const disbursements = await SiteFundDisbursement.findAll({
    where: { projectId, storekeeperUserId, ...dateWhere },
    include: [{ model: User, as: "disbursedBy", attributes: STOREKEEPER_ATTRS }],
    order: [["date", "DESC"]],
  });
  const expenses = await Expense.findAll({
    where: { projectId, createdById: storekeeperUserId, ...dateWhere },
    include: [{ model: ExpenseCategory, as: "category", attributes: ["id", "name"] }],
    order: [["date", "DESC"]],
  });

  const received = disbursements.reduce((s, d) => s + parseFloat(d.amount), 0);
  const spent = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

  const breakdownMap = {};
  expenses.forEach((e) => {
    const name = e.category?.name || "Uncategorized";
    breakdownMap[name] = (breakdownMap[name] || 0) + parseFloat(e.amount);
  });
  const expenseBreakdown = Object.entries(breakdownMap)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({ category, amount: +amount.toFixed(2) }));

  const { materials, labour } = splitByLabour(expenses);

  return {
    received: +received.toFixed(2),
    spent: +spent.toFixed(2),
    balance: +(received - spent).toFixed(2),
    expenseBreakdown,
    disbursements,
    expenses,
    materials: summarizeExpenses(materials),
    labour: summarizeExpenses(labour),
  };
}

// POST /api/projects/:projectId/site-fund/disbursements
exports.createDisbursement = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { storekeeperUserId, amount, date, method, referenceNo, notes } = req.body;

    if (!storekeeperUserId) return errorResponse(res, "Please choose a storekeeper", 400);
    if (!amount || parseFloat(amount) <= 0) return errorResponse(res, "A valid amount is required", 400);
    if (!date) return errorResponse(res, "Date is required", 400);

    const assignment = await ProjectStorekeeper.findOne({
      where: { projectId, userId: storekeeperUserId, isActive: true },
    });
    if (!assignment) return errorResponse(res, "This user is not an active storekeeper on this project", 400);

    const disbursement = await SiteFundDisbursement.create({
      projectId,
      storekeeperUserId,
      amount,
      date,
      method: method || "cash",
      referenceNo: referenceNo || null,
      notes: notes || null,
      disbursedById: req.userId,
    });

    await audit({
      userId: req.userId,
      action: "create",
      resource: "site_fund_disbursement",
      resourceId: disbursement.id,
      newValues: { storekeeperUserId, amount, date },
      req,
      projectId,
    });

    return successResponse(res, { disbursement }, "Funds recorded successfully", 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/site-fund/disbursements
exports.listDisbursements = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page, limit, offset } = getPagination(req.query);
    const { storekeeperUserId } = req.query;

    const where = { projectId, ...dateRangeWhere(req.query) };
    if (storekeeperUserId) where.storekeeperUserId = storekeeperUserId;

    const { count, rows } = await SiteFundDisbursement.findAndCountAll({
      where,
      include: [
        { model: User, as: "storekeeper", attributes: STOREKEEPER_ATTRS },
        { model: User, as: "disbursedBy", attributes: STOREKEEPER_ATTRS },
      ],
      order: [["date", "DESC"]],
      limit,
      offset,
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/site-fund/disbursements/:id
exports.deleteDisbursement = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const disbursement = await SiteFundDisbursement.findOne({ where: { id, projectId } });
    if (!disbursement) return errorResponse(res, "Disbursement not found", 404);

    await disbursement.destroy();
    await audit({
      userId: req.userId,
      action: "delete",
      resource: "site_fund_disbursement",
      resourceId: id,
      req,
      projectId,
    });

    return successResponse(res, null, "Disbursement deleted");
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/site-fund/balance
// Admin/Finance view — summary for every active storekeeper on the project,
// or just one if ?storekeeperUserId= is passed.
exports.getBalance = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { storekeeperUserId } = req.query;

    const where = { projectId, isActive: true };
    if (storekeeperUserId) where.userId = storekeeperUserId;

    const assignments = await ProjectStorekeeper.findAll({
      where,
      include: [{ model: User, as: "user", attributes: STOREKEEPER_ATTRS }],
    });

    const summaries = await Promise.all(
      assignments.map(async (a) => {
        const s = await buildStorekeeperSummary(projectId, a.userId, req.query);
        return { storekeeper: a.user, ...s };
      }),
    );

    return successResponse(res, { storekeepers: summaries }, "Site fund balance retrieved");
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/site-fund/my-balance
// The logged-in storekeeper's own balance — used by both admin (self-view) and
// mobile. Only requires the requester to actually BE an active storekeeper on
// this project; no finance permission needed.
exports.getMyBalance = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const assignment = await ProjectStorekeeper.findOne({
      where: { projectId, userId: req.userId, isActive: true },
    });
    if (!assignment) return errorResponse(res, "You are not an active storekeeper on this project", 403);

    const summary = await buildStorekeeperSummary(projectId, req.userId, req.query);
    return successResponse(res, summary, "Your site fund balance retrieved");
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/site-fund/summary?dateFrom&dateTo
// Whole-project financial summary: money received (all storekeepers) → materials
// (expenses, by category) → payments (to contractors/suppliers). Printable/exportable.
exports.getSummaryReport = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findByPk(projectId, { attributes: ["id", "name", "projectCode"] });
    if (!project) return errorResponse(res, "Project not found", 404);

    const dateWhere = dateRangeWhere(req.query);

    const [disbursements, expenses, payments] = await Promise.all([
      SiteFundDisbursement.findAll({
        where: { projectId, ...dateWhere },
        include: [
          { model: User, as: "storekeeper", attributes: STOREKEEPER_ATTRS },
          { model: User, as: "disbursedBy", attributes: STOREKEEPER_ATTRS },
        ],
        order: [["date", "ASC"]],
      }),
      Expense.findAll({
        where: { projectId, ...dateWhere },
        include: [
          { model: ExpenseCategory, as: "category", attributes: ["id", "name"] },
          { model: User, as: "createdBy", attributes: STOREKEEPER_ATTRS },
        ],
        order: [["date", "ASC"]],
      }),
      Payment.findAll({
        where: { projectId, ...dateWhere },
        include: [{ model: Technician, as: "paidTo", attributes: ["id", "name", "phone"] }],
        order: [["date", "ASC"]],
      }),
    ]);

    const receivedTotal = disbursements.reduce((s, d) => s + parseFloat(d.amount), 0);
    const receivedByStorekeeper = Object.values(
      disbursements.reduce((acc, d) => {
        const key = d.storekeeperUserId;
        if (!acc[key]) acc[key] = { storekeeper: d.storekeeper, amount: 0 };
        acc[key].amount += parseFloat(d.amount);
        return acc;
      }, {}),
    ).map((r) => ({ ...r, amount: +r.amount.toFixed(2) }));

    const { materials, labour } = splitByLabour(expenses);
    const paymentsTotal = payments.reduce((s, p) => s + parseFloat(p.amount), 0);

    return successResponse(res, {
      project,
      period: { from: req.query.dateFrom || null, to: req.query.dateTo || null },
      received: { total: +receivedTotal.toFixed(2), byStorekeeper: receivedByStorekeeper, items: disbursements },
      materials: summarizeExpenses(materials),
      labour: summarizeExpenses(labour),
      payments: { total: +paymentsTotal.toFixed(2), items: payments },
    }, "Site fund summary report retrieved");
  } catch (err) {
    next(err);
  }
};

// GET /api/site-fund/my-projects
// Projects where the logged-in user is an active storekeeper — for mobile's
// project picker.
exports.getMyProjects = async (req, res, next) => {
  try {
    const assignments = await ProjectStorekeeper.findAll({
      where: { userId: req.userId, isActive: true },
      include: [{ model: Project, as: "project", attributes: ["id", "name", "projectCode"] }],
    });
    return successResponse(res, assignments.map((a) => a.project).filter(Boolean), "Your assigned projects");
  } catch (err) {
    next(err);
  }
};
