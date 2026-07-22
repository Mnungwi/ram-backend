const {
  Project,
  User,
  Client,
  TeamMember,
  BudgetItem,
  Activity,
} = require("../models/index");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPagination,
} = require("../utils/response");
const { audit } = require("../utils/audit");
const { Op } = require("sequelize");
const { raw } = require("express");

// Common includes for project queries
const PROJECT_INCLUDES = [
  {
    model: User,
    as: "projectManager",
    attributes: ["id", "firstName", "lastName", "email", "avatar", "jobTitle"],
  },
  {
    model: Client,
    as: "clientInfo",
    attributes: ["id", "name", "contactPerson", "email", "phone", "company"],
  },

];

// GET /api/projects
exports.listProjects = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { projectCode: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Project.findAndCountAll({
      where,
      include: PROJECT_INCLUDES,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
console.log("Poroject ",raw)
    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.projectId, {
      include: PROJECT_INCLUDES,
    });
    if (!project) return errorResponse(res, "Project not found", 404);
    return successResponse(res, { project });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/overview
exports.getProjectOverview = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.projectId, {
      include: [...PROJECT_INCLUDES, { model: BudgetItem, as: "budgetItems" }],
    });
    if (!project) return errorResponse(res, "Project not found", 404);

    // Activity stats
    const [activityStats] = await Activity.findAll({
      where: { projectId: project.id },
      attributes: [
        [Activity.sequelize.fn("COUNT", Activity.sequelize.col("id")), "total"],
        [
          Activity.sequelize.fn(
            "SUM",
            Activity.sequelize.literal(
              "CASE WHEN status='completed' THEN 1 ELSE 0 END",
            ),
          ),
          "completed",
        ],
        [
          Activity.sequelize.fn(
            "SUM",
            Activity.sequelize.literal(
              "CASE WHEN status='in_progress' THEN 1 ELSE 0 END",
            ),
          ),
          "inProgress",
        ],
        [
          Activity.sequelize.fn(
            "SUM",
            Activity.sequelize.literal(
              "CASE WHEN status='pending' THEN 1 ELSE 0 END",
            ),
          ),
          "pending",
        ],
      ],
      raw: true,
    });

    // Budget stats from real finance models
    const { Budget, Payment, Expense, Invoice, InvoicePayment } = require("../models/finance.model");
    const { LocalPurchaseOrder } = require("../models/index");

    const budgets = await Budget.findAll({ where: { projectId: project.id } });
    const totalBudgetVal = budgets.reduce((s, b) => s + parseFloat(b.budgetAmount || 0), 0);

    const payments = await Payment.findAll({ where: { projectId: project.id } });
    const totalPaidVal = payments
      .filter(p => p.status === "Paid" || p.status === "Approved" || p.status === "Open")
      .reduce((s, p) => s + parseFloat(p.amount || 0), 0);

    const expenses = await Expense.findAll({ where: { projectId: project.id } });
    const totalExpensesVal = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

    const invoices = await Invoice.findAll({ where: { projectId: project.id } });
    const invoiceIds = invoices.map((i) => i.id);
    const paidInvoicesTotal = invoiceIds.length
      ? (await InvoicePayment.sum("amount", {
          where: { invoiceId: { [Op.in]: invoiceIds } },
        })) || 0
      : 0;

    const lpos = await LocalPurchaseOrder.findAll({ where: { projectId: project.id } });
    const totalLpoCommitted = lpos
      .filter(l => l.status !== "cancelled")
      .reduce((s, l) => s + parseFloat(l.total || l.subtotal || 0), 0);

    const actualPaid = totalPaidVal + totalExpensesVal + parseFloat(paidInvoicesTotal);
    const materialSpent = totalExpensesVal + parseFloat(paidInvoicesTotal);
    const finalBudget = totalBudgetVal > 0 ? totalBudgetVal : parseFloat(project.totalBudget || project.budget || 0);

    const budgetStats = {
      totalBudget: finalBudget,
      totalCommitted: totalLpoCommitted,
      totalPaid: actualPaid,
      materialSpent: materialSpent
    };

    // Days remaining
    const today = new Date();
    const endDate = new Date(project.endDate);
    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)),
    );

    return successResponse(res, {
      project,
      stats: {
        totalActivities: parseInt(activityStats?.total || 0),
        completed: parseInt(activityStats?.completed || 0),
        inProgress: parseInt(activityStats?.inProgress || 0),
        pending: parseInt(activityStats?.pending || 0),
        daysRemaining,
        ...budgetStats,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects
exports.createProject = async (req, res, next) => {
  try {
    const project = await Project.create({
      ...req.body,
      createdById: req.userId,
    });
    const full = await Project.findByPk(project.id, {
      include: PROJECT_INCLUDES,
    });
    await audit({
      userId: req.userId,
      action: "create_project",
      resource: "project",
      resourceId: project.id,
      req,
    });
    return successResponse(res, { project: full }, "Project created", 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:projectId
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.projectId);
    if (!project) return errorResponse(res, "Project not found", 404);
    await project.update(req.body);
    const full = await Project.findByPk(project.id, {
      include: PROJECT_INCLUDES,
    });
    await audit({
      userId: req.userId,
      action: "update_project",
      resource: "project",
      resourceId: project.id,
      req,
    });
    return successResponse(res, { project: full }, "Project updated");
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.projectId);
    if (!project) return errorResponse(res, "Project not found", 404);
    await project.destroy();
    await audit({
      userId: req.userId,
      action: "delete_project",
      resource: "project",
      resourceId: req.params.projectId,
      req,
    });
    return successResponse(res, null, "Project deleted");
  } catch (err) {
    next(err);
  }
};

// const { Project, ProjectPhase, User, Client, TeamMember, BudgetItem, Activity } = require('../models/index');
// const { successResponse, errorResponse, paginatedResponse, getPagination } = require('../utils/response');
// const { audit } = require('../utils/audit');
// const { Op } = require('sequelize');

// // Common includes for project queries
// const PROJECT_INCLUDES = [
//   {
//     model: User,
//     as: 'projectManager',
//     attributes: ['id', 'firstName', 'lastName', 'email', 'avatar', 'jobTitle'],
//   },
//   {
//     model: Client,
//     as: 'clientInfo',
//     attributes: ['id', 'name', 'contactPerson', 'email', 'phone', 'company'],
//   },
// ];

// // GET /api/projects
// exports.listProjects = async (req, res, next) => {
//   try {
//     const { page, limit, offset } = getPagination(req.query);
//     const { status, search } = req.query;
//     const where = {};

//     if (status) where.status = status;
//     if (search) {
//       where[Op.or] = [
//         { name:        { [Op.like]: `%${search}%` } },
//         { projectCode: { [Op.like]: `%${search}%` } },
//         { location:    { [Op.like]: `%${search}%` } },
//       ];
//     }

//     const { count, rows } = await Project.findAndCountAll({
//       where,
//       include: PROJECT_INCLUDES,
//       order: [['createdAt', 'DESC']],
//       limit,
//       offset,
//     });

//     return paginatedResponse(res, rows, count, page, limit);
//   } catch (err) { next(err); }
// };

// // GET /api/projects/:projectId
// exports.getProject = async (req, res, next) => {
//   try {
//     const project = await Project.findByPk(req.params.projectId, {
//       include: [
//         ...PROJECT_INCLUDES,
//         {
//           model: ProjectPhase,
//           as: 'phases',
//           separate: true,
//           order: [['order', 'ASC']],
//         },
//       ],
//     });
//     if (!project) return errorResponse(res, 'Project not found', 404);
//     return successResponse(res, { project });
//   } catch (err) { next(err); }
// };

// // GET /api/projects/:projectId/overview
// exports.getProjectOverview = async (req, res, next) => {
//   try {
//     const project = await Project.findByPk(req.params.projectId, {
//       include: [
//         ...PROJECT_INCLUDES,
//         { model: ProjectPhase, as: 'phases', separate: true, order: [['order', 'ASC']] },
//         { model: BudgetItem,   as: 'budgetItems' },
//       ],
//     });
//     if (!project) return errorResponse(res, 'Project not found', 404);

//     // Activity stats
//     const [activityStats] = await Activity.findAll({
//       where: { projectId: project.id },
//       attributes: [
//         [Activity.sequelize.fn('COUNT', Activity.sequelize.col('id')), 'total'],
//         [Activity.sequelize.fn('SUM', Activity.sequelize.literal("CASE WHEN status='completed' THEN 1 ELSE 0 END")), 'completed'],
//         [Activity.sequelize.fn('SUM', Activity.sequelize.literal("CASE WHEN status='in_progress' THEN 1 ELSE 0 END")), 'inProgress'],
//         [Activity.sequelize.fn('SUM', Activity.sequelize.literal("CASE WHEN status='pending' THEN 1 ELSE 0 END")), 'pending'],
//       ],
//       raw: true,
//     });

//     // Budget stats
//     const budgetStats = (project.budgetItems || []).reduce((acc, b) => ({
//       totalBudget:    acc.totalBudget    + parseFloat(b.budget    || 0),
//       totalCommitted: acc.totalCommitted + parseFloat(b.committed || 0),
//       totalPaid:      acc.totalPaid      + parseFloat(b.paid      || 0),
//     }), { totalBudget: 0, totalCommitted: 0, totalPaid: 0 });

//     // Days remaining
//     const today = new Date();
//     const endDate = new Date(project.endDate);
//     const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));

//     return successResponse(res, {
//       project,
//       stats: {
//         totalActivities: parseInt(activityStats?.total  || 0),
//         completed:       parseInt(activityStats?.completed  || 0),
//         inProgress:      parseInt(activityStats?.inProgress || 0),
//         pending:         parseInt(activityStats?.pending    || 0),
//         daysRemaining,
//         ...budgetStats,
//       },
//     });
//   } catch (err) { next(err); }
// };

// // POST /api/projects
// exports.createProject = async (req, res, next) => {
//   try {
//     const project = await Project.create({
//       ...req.body,
//       createdById: req.userId,
//     });

//     // Re-fetch with associations
//     const full = await Project.findByPk(project.id, { include: PROJECT_INCLUDES });
//     await audit({ userId: req.userId, action: 'create_project', resource: 'project', resourceId: project.id, req });
//     return successResponse(res, { project: full }, 'Project created', 201);
//   } catch (err) { next(err); }
// };

// // PUT /api/projects/:projectId
// exports.updateProject = async (req, res, next) => {
//   try {
//     const project = await Project.findByPk(req.params.projectId);
//     if (!project) return errorResponse(res, 'Project not found', 404);

//     await project.update(req.body);
//     const full = await Project.findByPk(project.id, { include: PROJECT_INCLUDES });
//     await audit({ userId: req.userId, action: 'update_project', resource: 'project', resourceId: project.id, req });
//     return successResponse(res, { project: full }, 'Project updated');
//   } catch (err) { next(err); }
// };

// // DELETE /api/projects/:projectId
// exports.deleteProject = async (req, res, next) => {
//   try {
//     const project = await Project.findByPk(req.params.projectId);
//     if (!project) return errorResponse(res, 'Project not found', 404);
//     await project.destroy();
//     await audit({ userId: req.userId, action: 'delete_project', resource: 'project', resourceId: req.params.projectId, req });
//     return successResponse(res, null, 'Project deleted');
//   } catch (err) { next(err); }
// };
