const { Op } = require('sequelize');
const { Invoice, Payment, Expense, BudgetItem, Project, User, Supplier, Contract } = require('../models/index');
const { successResponse, errorResponse, paginatedResponse, getPagination } = require('../utils/response');
const { audit } = require('../utils/audit');

// ─── BUDGET ───────────────────────────────────────────────────────────────────

const getBudget = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const items = await BudgetItem.findAll({ where: { projectId }, order: [['category', 'ASC']] });

    const summary = {
      totalBudget:    items.reduce((s, i) => s + parseFloat(i.budget    || 0), 0),
      totalCommitted: items.reduce((s, i) => s + parseFloat(i.committed || 0), 0),
      totalPaid:      items.reduce((s, i) => s + parseFloat(i.paid      || 0), 0),
    };
    summary.balance = summary.totalBudget - summary.totalPaid;

    return successResponse(res, { budgetItems: items, summary });
  } catch (err) {
    next(err);
  }
};

const upsertBudgetItem = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { category, budget, committed, paid, description } = req.body;

    const [item, created] = await BudgetItem.findOrCreate({
      where: { projectId, category },
      defaults: { budget, committed, paid, description, currency: req.body.currency || 'TZS' },
    });

    if (!created) {
      await item.update({ budget, committed, paid, description });
    }

    await audit({ userId: req.userId, action: created ? 'create_budget_item' : 'update_budget_item', resource: 'budget', resourceId: item.id, req, projectId });
    return successResponse(res, { item }, created ? 'Budget item created' : 'Budget item updated', created ? 201 : 200);
  } catch (err) {
    next(err);
  }
};

// ─── INVOICES ─────────────────────────────────────────────────────────────────

const listInvoices = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page, limit, offset } = getPagination(req.query);
    const { status } = req.query;

    const where = { projectId };
    if (status) where.status = status;

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
      limit, offset,
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const data = { ...req.body, projectId, createdById: req.userId };
    data.totalAmount = (parseFloat(data.amount || 0) + parseFloat(data.tax || 0));

    const invoice = await Invoice.create(data);
    await audit({ userId: req.userId, action: 'create_invoice', resource: 'invoice', resourceId: invoice.id, req, projectId });
    return successResponse(res, { invoice }, 'Invoice created', 201);
  } catch (err) {
    next(err);
  }
};

const approveInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ where: { id: req.params.invoiceId, projectId: req.params.projectId } });
    if (!invoice) return errorResponse(res, 'Invoice not found', 404);
    if (!['draft', 'pending'].includes(invoice.status)) return errorResponse(res, 'Invoice cannot be approved in current state', 400);

    await invoice.update({ status: 'approved', approvedById: req.userId });
    await audit({ userId: req.userId, action: 'approve_invoice', resource: 'invoice', resourceId: invoice.id, req, projectId: req.params.projectId });
    return successResponse(res, { invoice }, 'Invoice approved');
  } catch (err) {
    next(err);
  }
};

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

const listPayments = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page, limit, offset } = getPagination(req.query);
    const { status } = req.query;

    const where = { projectId };
    if (status) where.status = status;

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Invoice, as: 'invoice', attributes: ['id', 'invoiceNo', 'amount'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['paymentDate', 'DESC']],
      limit, offset,
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const payment = await Payment.create({ ...req.body, projectId, createdById: req.userId });
    await audit({ userId: req.userId, action: 'create_payment', resource: 'payment', resourceId: payment.id, req, projectId });
    return successResponse(res, { payment }, 'Payment created', 201);
  } catch (err) {
    next(err);
  }
};

const approvePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ where: { id: req.params.paymentId, projectId: req.params.projectId } });
    if (!payment) return errorResponse(res, 'Payment not found', 404);
    if (payment.status !== 'pending_approval') return errorResponse(res, 'Payment is not awaiting approval', 400);

    await payment.update({ status: 'paid', approvedById: req.userId });
    await audit({ userId: req.userId, action: 'approve_payment', resource: 'payment', resourceId: payment.id, req, projectId: req.params.projectId });
    return successResponse(res, { payment }, 'Payment approved');
  } catch (err) {
    next(err);
  }
};

// ─── EXPENSES ─────────────────────────────────────────────────────────────────

const listExpenses = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page, limit, offset } = getPagination(req.query);

    const { count, rows } = await Expense.findAndCountAll({
      where: { projectId },
      order: [['expenseDate', 'DESC']],
      limit, offset,
    });
    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const expense = await Expense.create({ ...req.body, projectId, createdById: req.userId });
    await audit({ userId: req.userId, action: 'create_expense', resource: 'expense', resourceId: expense.id, req, projectId });
    return successResponse(res, { expense }, 'Expense created', 201);
  } catch (err) {
    next(err);
  }
};

// ─── FINANCE OVERVIEW ─────────────────────────────────────────────────────────

const getFinanceOverview = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const [budgetItems, invoices, payments] = await Promise.all([
      BudgetItem.findAll({ where: { projectId } }),
      Invoice.findAll({ where: { projectId } }),
      Payment.findAll({ where: { projectId } }),
    ]);

    const totalBudget    = budgetItems.reduce((s, i) => s + parseFloat(i.budget    || 0), 0);
    const totalCommitted = budgetItems.reduce((s, i) => s + parseFloat(i.committed || 0), 0);
    const totalPaid      = budgetItems.reduce((s, i) => s + parseFloat(i.paid      || 0), 0);

    const overdue = invoices.filter(i => i.status === 'overdue').length;
    const pendingApproval = payments.filter(p => p.status === 'pending_approval').reduce((s, p) => s + parseFloat(p.amount || 0), 0);

    return successResponse(res, {
      totalBudget, totalCommitted, totalPaid,
      balance: totalBudget - totalPaid,
      retentionHeld: totalPaid * 0.0875, // 8.75% retention example
      overdue,
      pendingApproval,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBudget, upsertBudgetItem,
  listInvoices, createInvoice, approveInvoice,
  listPayments, createPayment, approvePayment,
  listExpenses, createExpense,
  getFinanceOverview,
};
