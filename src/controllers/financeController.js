const {
  Budget,
  Payment,
  Invoice,
  InvoicePayment,
  Expense,
  ExpenseCategory,
  FundingSource,
} = require("../models/finance.model");

const { Technician } = require("../models/technician.model"); // rekebisha path kama tofauti
const {
  User,
  Activity,
  Supplier,
  LocalPurchaseOrder,
  LPOItem,
} = require("../models/index");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPagination,
} = require("../utils/response");
const { Op } = require("sequelize");

const ACTIVITY_INCLUDE = {
  model: Activity,
  as: "activity",
  attributes: ["id", "name"],
};
const EXPENSE_CATEGORY_INCLUDE = {
  model: ExpenseCategory,
  as: "category",
  attributes: ["id", "name"],
};
const PAID_TO_INCLUDE = {
  model: Technician,
  as: "paidTo",
  attributes: ["id", "name", "phone"],
};
const SUPPLIER_INCLUDE = {
  model: Supplier,
  as: "supplier",
  attributes: ["id", "name", "phone"],
};
const LPO_BASIC_INCLUDE = {
  model: LocalPurchaseOrder,
  as: "lpo",
  attributes: ["id", "lpoNo", "total", "status"],
};
const USER_CREATED_INCLUDE = {
  model: User,
  as: "createdBy",
  attributes: ["id", "firstName", "lastName"],
};

// ══════════════════════════════════════════════════════════════
// OVERVIEW
// ══════════════════════════════════════════════════════════════

exports.getOverview = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const budgets = await Budget.findAll({ where: { projectId } });
    const totalBudget = budgets.reduce(
      (s, b) => s + parseFloat(b.budgetAmount || 0),
      0,
    );

    const payments = await Payment.findAll({ where: { projectId } });
    const totalPaidVal = payments
      .filter((p) => p.status === "Paid" || p.status === "Approved" || p.status === "Open")
      .reduce((s, p) => s + parseFloat(p.amount || 0), 0);

    const expenses = await Expense.findAll({ where: { projectId } });
    const totalExpensesVal = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

    const invoices = await Invoice.findAll({ where: { projectId } });
    const invoiceIds = invoices.map((i) => i.id);
    const paidInvoicesTotal = invoiceIds.length
      ? (await InvoicePayment.sum("amount", {
          where: { invoiceId: { [Op.in]: invoiceIds } },
        })) || 0
      : 0;

    const totalPaid = totalPaidVal + totalExpensesVal + parseFloat(paidInvoicesTotal);

    const totalInvoiceAmount = invoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const remainingInvoices = totalInvoiceAmount - parseFloat(paidInvoicesTotal);

    const lpos = await LocalPurchaseOrder.findAll({ where: { projectId } }).catch(() => []);
    const lpoIdsWithInvoices = new Set(
      invoices.filter((i) => i.lpoId).map((i) => i.lpoId),
    );
    const lpoTotal = lpos
      .filter(
        (l) =>
          !["draft", "cancelled"].includes(l.status) &&
          !lpoIdsWithInvoices.has(l.id),
      )
      .reduce((s, l) => s + parseFloat(l.total || l.subtotal || 0), 0);

    const totalCommitted = remainingInvoices + lpoTotal;
    const totalBalance = totalBudget - totalPaid;

    const retentionHeld = 0;
    const retentionReleased = 0;
    const retentionRate = 0;

    return successResponse(res, {
      overview: {
        totalBudget,
        totalCommitted: +totalCommitted.toFixed(2),
        totalPaid: +totalPaid.toFixed(2),
        totalBalance: +totalBalance.toFixed(2),
        retentionHeld,
        retentionReleased,
        retentionPending: retentionHeld,
        retentionRate: +retentionRate.toFixed(2),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getTaxSummary = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const payments = await Payment.findAll({
      where: { projectId, status: "Paid" },
    });
    const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount), 0);

    const vatBase = totalPaid / 1.18;
    const vatAmount = totalPaid - vatBase;
    const whtAmount = totalPaid * 0.05;

    return successResponse(res, {
      taxes: [
        {
          type: "VAT",
          rate: "18%",
          taxableAmount: +vatBase.toFixed(2),
          taxAmount: +vatAmount.toFixed(2),
          status: "Applied",
        },
        {
          type: "Withholding Tax",
          rate: "5%",
          taxableAmount: +totalPaid.toFixed(2),
          taxAmount: +whtAmount.toFixed(2),
          status: "Applied",
        },
      ],
    });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
// BUDGET
// ══════════════════════════════════════════════════════════════

exports.getBudget = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const budgets = await Budget.findAll({
      where: { projectId },
      include: [ACTIVITY_INCLUDE],
      order: [["category", "ASC"]],
    });

    // Kwa kila budget category (= activity), "paid" ni jumla HALISI ya:
    //   - Payments zenye activityId hiyo na status = 'Paid'
    //   - Expenses zenye activityId hiyo
    // "committed" ni jumla ya:
    //   - Invoices zenye activityId hiyo
    //   - LPOs (vifaa/materials) zenye activityId hiyo, zisizo draft/cancelled
    const categories = await Promise.all(
      budgets.map(async (b) => {
        const [paidPayments, paidExpenses, activityInvoices, activityLpos] =
          await Promise.all([
            Payment.sum("amount", {
              where: { projectId, activityId: b.activityId, status: "Paid" },
            }),
            Expense.sum("amount", {
              where: { projectId, activityId: b.activityId },
            }),
            Invoice.findAll({
              where: { projectId, activityId: b.activityId },
              attributes: ["id", "amount", "lpoId"],
            }),
            LocalPurchaseOrder.findAll({
              where: {
                projectId,
                activityId: b.activityId,
                status: { [Op.notIn]: ["draft", "cancelled"] },
              },
              attributes: ["id", "total"],
            }),
          ]);

        // Kwa kila invoice ya activity hii, chukua kiasi kilicholipwa halisi
        // (InvoicePayment sum) — hii inashughulikia malipo ya sehemu-sehemu.
        const invoiceIds = activityInvoices.map((i) => i.id);
        const paidInvoicesTotal = invoiceIds.length
          ? (await InvoicePayment.sum("amount", {
              where: { invoiceId: { [Op.in]: invoiceIds } },
            })) || 0
          : 0;
        const totalInvoiceAmount = activityInvoices.reduce(
          (s, i) => s + parseFloat(i.amount),
          0,
        );
        const remainingInvoices =
          totalInvoiceAmount - parseFloat(paidInvoicesTotal);

        // LPO ambazo tayari zina Invoice iliyounganishwa — HAZIHESABIWI tena
        // hapa kama "committedLpos" ili kuepuka kuhesabu mara mbili (deni lile
        // lile tayari linahesabika kupitia Invoice.amount hapo juu).
        const lpoIdsWithInvoices = new Set(
          activityInvoices.filter((i) => i.lpoId).map((i) => i.lpoId),
        );
        const committedLpos = activityLpos
          .filter((l) => !lpoIdsWithInvoices.has(l.id))
          .reduce((s, l) => s + parseFloat(l.total || 0), 0);

        const paid =
          (parseFloat(paidPayments) || 0) +
          (parseFloat(paidExpenses) || 0) +
          parseFloat(paidInvoicesTotal);
        const committed = remainingInvoices + committedLpos;
        const budgetAmount = parseFloat(b.budgetAmount);

        return {
          id: b.id,
          activityId: b.activityId,
          category: b.category,
          budget: budgetAmount,
          committed: +committed.toFixed(2),
          paid: +paid.toFixed(2),
          balance: +(budgetAmount - paid).toFixed(2),
        };
      }),
    );

    const upcomingPayments = await Payment.findAll({
      where: {
        projectId,
        status: { [Op.in]: ["Open", "Pending Approval", "Approved"] },
      },
      include: [PAID_TO_INCLUDE],
      order: [["dueDate", "ASC"]],
      limit: 5,
    });

    const recentPayments = await Payment.findAll({
      where: { projectId },
      include: [PAID_TO_INCLUDE],
      order: [["date", "DESC"]],
      limit: 5,
    });

    const expenses = await Expense.findAll({
      where: { projectId },
      include: [EXPENSE_CATEGORY_INCLUDE],
    });
    const expenseByCategory = {};
    expenses.forEach((e) => {
      const catName = e.category?.name || "Uncategorized";
      expenseByCategory[catName] =
        (expenseByCategory[catName] || 0) + parseFloat(e.amount);
    });
    const colors = ["#1a56db", "#16a34a", "#ea580c", "#7c3aed", "#0891b2"];
    const topExpenses = Object.entries(expenseByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount], i) => ({
        category,
        amount,
        color: colors[i % colors.length],
      }));

    return successResponse(res, {
      categories,
      upcomingPayments,
      recentPayments,
      topExpenses,
    });
  } catch (err) {
    next(err);
  }
};

exports.upsertBudget = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { id, activityId, budgetAmount, notes } = req.body;

    if (!activityId) return errorResponse(res, "Activity is required", 400);
    if (budgetAmount === undefined || parseFloat(budgetAmount) < 0)
      return errorResponse(res, "A valid budget amount is required", 400);

    const activity = await Activity.findOne({
      where: { id: activityId, projectId },
    });
    if (!activity)
      return errorResponse(res, "Activity not found for this project", 404);

    let budget;
    if (id) {
      budget = await Budget.findOne({ where: { id, projectId } });
      if (!budget) return errorResponse(res, "Budget category not found", 404);
      await budget.update({
        activityId,
        category: activity.name,
        budgetAmount,
        notes,
      });
    } else {
      const existing = await Budget.findOne({
        where: { projectId, activityId },
      });
      if (existing) {
        await existing.update({ budgetAmount, notes });
        budget = existing;
      } else {
        budget = await Budget.create({
          projectId,
          activityId,
          category: activity.name,
          budgetAmount,
          notes,
        });
      }
    }

    return successResponse(res, { budget }, "Budget saved");
  } catch (err) {
    next(err);
  }
};

exports.deleteBudget = async (req, res, next) => {
  try {
    const { projectId, budgetId } = req.params;
    const budget = await Budget.findOne({ where: { id: budgetId, projectId } });
    if (!budget) return errorResponse(res, "Budget category not found", 404);
    await budget.destroy();
    return successResponse(res, null, "Budget category deleted");
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/finance/budget/:budgetId/detail
// Detail kamili ya category moja: payments kwa fundi, expenses, na LPO/materials
exports.getBudgetDetail = async (req, res, next) => {
  try {
    const { projectId, budgetId } = req.params;
    const budget = await Budget.findOne({
      where: { id: budgetId, projectId },
      include: [ACTIVITY_INCLUDE],
    });
    if (!budget) return errorResponse(res, "Budget category not found", 404);

    const [payments, expenses, lpos, invoices] = await Promise.all([
      Payment.findAll({
        where: { projectId, activityId: budget.activityId },
        include: [PAID_TO_INCLUDE],
        order: [["date", "DESC"]],
      }),
      Expense.findAll({
        where: { projectId, activityId: budget.activityId },
        include: [EXPENSE_CATEGORY_INCLUDE],
        order: [["date", "DESC"]],
      }),
      LocalPurchaseOrder.findAll({
        where: { projectId, activityId: budget.activityId },
        include: [{ association: "supplier", attributes: ["id", "name"] }],
        order: [["date", "DESC"]],
      }).catch(() => []), // endapo "supplier" association alias ni tofauti, rudisha [] badala ya kuvunjika
      Invoice.findAll({
        where: { projectId, activityId: budget.activityId },
        include: [SUPPLIER_INCLUDE, LPO_BASIC_INCLUDE],
        order: [["date", "DESC"]],
      }),
    ]);

    // Malipo halisi ya Invoice (InvoicePayment sums) — inashughulikia partial payments
    const invoiceIds = invoices.map((i) => i.id);
    const paidInvoicesTotal = invoiceIds.length
      ? (await InvoicePayment.sum("amount", {
          where: { invoiceId: { [Op.in]: invoiceIds } },
        })) || 0
      : 0;
    const totalInvoiceAmount = invoices.reduce(
      (s, i) => s + parseFloat(i.amount),
      0,
    );
    const remainingInvoices =
      totalInvoiceAmount - parseFloat(paidInvoicesTotal);

    // LPO zenye Invoice iliyounganishwa HAZIHESABIWI tena kwenye committed
    // (kuepuka double-counting — deni lile lile tayari liko kwenye Invoice)
    const lpoIdsWithInvoices = new Set(
      invoices.filter((i) => i.lpoId).map((i) => i.lpoId),
    );
    const lpoTotal = lpos
      .filter(
        (l) =>
          !["draft", "cancelled"].includes(l.status) &&
          !lpoIdsWithInvoices.has(l.id),
      )
      .reduce((s, l) => s + parseFloat(l.total || 0), 0);

    const paidTotal =
      payments
        .filter((p) => p.status === "Paid")
        .reduce((s, p) => s + parseFloat(p.amount), 0) +
      expenses.reduce((s, e) => s + parseFloat(e.amount), 0) +
      parseFloat(paidInvoicesTotal);

    const invoicesWithBalance = await Promise.all(
      invoices.map(withInvoiceBalance),
    );

    // Kwa kila LPO, onyesha wazi kama ina Invoice(s) inayoifuatilia, na jumla
    // ya kiasi kilicholipwa dhidi ya invoice hizo — ili isionekane kama "vitu
    // viwili tofauti" kwenye UI.
    const lposWithInvoiceInfo = lpos.map((l) => {
      const plain = l.toJSON ? l.toJSON() : l;
      const linkedInvoices = invoicesWithBalance.filter(
        (i) => i.lpoId === plain.id,
      );
      const invoicedTotal = linkedInvoices.reduce(
        (s, i) => s + parseFloat(i.amount),
        0,
      );
      const invoicedPaid = linkedInvoices.reduce(
        (s, i) => s + parseFloat(i.paidAmount),
        0,
      );
      return {
        ...plain,
        linkedInvoices,
        invoicedTotal: +invoicedTotal.toFixed(2),
        invoicedPaid: +invoicedPaid.toFixed(2),
        notYetInvoiced: +(parseFloat(plain.total) - invoicedTotal).toFixed(2),
      };
    });

    return successResponse(res, {
      budget: {
        id: budget.id,
        category: budget.category,
        activityId: budget.activityId,
        activity: budget.activity,
        budgetAmount: parseFloat(budget.budgetAmount),
        notes: budget.notes,
      },
      summary: {
        budget: parseFloat(budget.budgetAmount),
        paid: +paidTotal.toFixed(2),
        committed: +(remainingInvoices + lpoTotal).toFixed(2),
        balance: +(parseFloat(budget.budgetAmount) - paidTotal).toFixed(2),
        paymentsCount: payments.length,
        expensesCount: expenses.length,
        lposCount: lpos.length,
      },
      payments,
      expenses,
      invoices: invoicesWithBalance,
      lpos: lposWithInvoiceInfo,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/finance/report
// Report kamili ya project: kila category (activity) na breakdown yake nzima
// + jumla ya jumla (grand summary) — kwa printing/export
exports.getBudgetReport = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const budgets = await Budget.findAll({
      where: { projectId },
      include: [ACTIVITY_INCLUDE],
      order: [["category", "ASC"]],
    });

    const budgetedActivityIds = new Set(budgets.map(b => b.activityId).filter(Boolean));

    const sections = await Promise.all(
      budgets.map(async (b) => {
        const [payments, expenses, lpos, invoices] = await Promise.all([
          Payment.findAll({
            where: { projectId, activityId: b.activityId },
            include: [PAID_TO_INCLUDE],
            order: [["date", "ASC"]],
          }),
          Expense.findAll({
            where: { projectId, activityId: b.activityId },
            include: [EXPENSE_CATEGORY_INCLUDE],
            order: [["date", "ASC"]],
          }),
          LocalPurchaseOrder.findAll({
            where: { projectId, activityId: b.activityId },
            order: [["date", "ASC"]],
          }).catch(() => []),
          Invoice.findAll({
            where: { projectId, activityId: b.activityId },
            include: [SUPPLIER_INCLUDE],
            order: [["date", "ASC"]],
          }),
        ]);

        const invoiceIds = invoices.map((i) => i.id);
        const paidInvoicesTotal = invoiceIds.length
          ? (await InvoicePayment.sum("amount", {
              where: { invoiceId: { [Op.in]: invoiceIds } },
            })) || 0
          : 0;
        const totalInvoiceAmount = invoices.reduce(
          (s, i) => s + parseFloat(i.amount || 0),
          0,
        );
        const remainingInvoices = totalInvoiceAmount - parseFloat(paidInvoicesTotal);

        const lpoIdsWithInvoices = new Set(
          invoices.filter((i) => i.lpoId).map((i) => i.lpoId),
        );
        const lpoTotal = lpos
          .filter(
            (l) =>
              !["draft", "cancelled"].includes(l.status) &&
              !lpoIdsWithInvoices.has(l.id),
          )
          .reduce((s, l) => s + parseFloat(l.total || l.subtotal || 0), 0);

        const paidTotal =
          payments
            .filter((p) => p.status === "Paid" || p.status === "Approved" || p.status === "Open")
            .reduce((s, p) => s + parseFloat(p.amount || 0), 0) +
          expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0) +
          parseFloat(paidInvoicesTotal);
        const budgetAmount = parseFloat(b.budgetAmount || 0);

        const invoicesWithBalance = await Promise.all(
          invoices.map(withInvoiceBalance),
        );

        const lposWithInvoiceInfo = lpos.map((l) => {
          const plain = l.toJSON ? l.toJSON() : l;
          const linkedInvoices = invoicesWithBalance.filter(
            (i) => i.lpoId === plain.id,
          );
          const invoicedTotal = linkedInvoices.reduce(
            (s, i) => s + parseFloat(i.amount || 0),
            0,
          );
          const invoicedPaid = linkedInvoices.reduce(
            (s, i) => s + parseFloat(i.paidAmount || 0),
            0,
          );
          return {
            ...plain,
            linkedInvoices,
            invoicedTotal: +invoicedTotal.toFixed(2),
            invoicedPaid: +invoicedPaid.toFixed(2),
            notYetInvoiced: +(parseFloat(plain.total || plain.subtotal || 0) - invoicedTotal).toFixed(2),
          };
        });

        return {
          category: b.category,
          activityId: b.activityId,
          budget: budgetAmount,
          paid: +paidTotal.toFixed(2),
          committed: +(remainingInvoices + lpoTotal).toFixed(2),
          balance: +(budgetAmount - paidTotal).toFixed(2),
          payments,
          expenses,
          lpos: lposWithInvoiceInfo,
          invoices: invoicesWithBalance,
        };
      }),
    );

    // Fetch and calculate unbudgeted items
    const [allPayments, allExpenses, allLpos, allInvoices] = await Promise.all([
      Payment.findAll({
        where: { projectId },
        include: [PAID_TO_INCLUDE],
        order: [["date", "ASC"]],
      }),
      Expense.findAll({
        where: { projectId },
        include: [EXPENSE_CATEGORY_INCLUDE],
        order: [["date", "ASC"]],
      }),
      LocalPurchaseOrder.findAll({
        where: { projectId },
        order: [["date", "ASC"]],
      }).catch(() => []),
      Invoice.findAll({
        where: { projectId },
        include: [SUPPLIER_INCLUDE],
        order: [["date", "ASC"]],
      }),
    ]);

    const unbudgetedPayments = allPayments.filter(p => !p.activityId || !budgetedActivityIds.has(p.activityId));
    const unbudgetedExpenses = allExpenses.filter(e => !e.activityId || !budgetedActivityIds.has(e.activityId));
    const unbudgetedLpos = allLpos.filter(l => !l.activityId || !budgetedActivityIds.has(l.activityId));
    const unbudgetedInvoices = allInvoices.filter(i => !i.activityId || !budgetedActivityIds.has(i.activityId));

    const unbudgetedInvoiceIds = unbudgetedInvoices.map(i => i.id);
    const unbudgetedPaidInvoicesTotal = unbudgetedInvoiceIds.length
      ? (await InvoicePayment.sum("amount", {
          where: { invoiceId: { [Op.in]: unbudgetedInvoiceIds } },
        })) || 0
      : 0;

    const unbudgetedInvoiceTotal = unbudgetedInvoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const unbudgetedRemainingInvoices = unbudgetedInvoiceTotal - parseFloat(unbudgetedPaidInvoicesTotal);

    const unbudgetedLpoIdsWithInvoices = new Set(
      unbudgetedInvoices.filter(i => i.lpoId).map(i => i.lpoId)
    );
    const unbudgetedLpoTotal = unbudgetedLpos
      .filter(
        (l) =>
          !["draft", "cancelled"].includes(l.status) &&
          !unbudgetedLpoIdsWithInvoices.has(l.id),
      )
      .reduce((s, l) => s + parseFloat(l.total || l.subtotal || 0), 0);

    const unbudgetedPaid =
      unbudgetedPayments
        .filter(p => p.status === "Paid" || p.status === "Approved" || p.status === "Open")
        .reduce((s, p) => s + parseFloat(p.amount || 0), 0) +
      unbudgetedExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0) +
      parseFloat(unbudgetedPaidInvoicesTotal);

    const unbudgetedCommitted = unbudgetedRemainingInvoices + unbudgetedLpoTotal;

    const unbudgetedInvoicesWithBalance = await Promise.all(
      unbudgetedInvoices.map(withInvoiceBalance),
    );
    const unbudgetedLposWithInvoiceInfo = unbudgetedLpos.map((l) => {
      const plain = l.toJSON ? l.toJSON() : l;
      const linkedInvoices = unbudgetedInvoicesWithBalance.filter(
        (i) => i.lpoId === plain.id,
      );
      const invoicedTotal = linkedInvoices.reduce(
        (s, i) => s + parseFloat(i.amount || 0),
        0,
      );
      const invoicedPaid = linkedInvoices.reduce(
        (s, i) => s + parseFloat(i.paidAmount || 0),
        0,
      );
      return {
        ...plain,
        linkedInvoices,
        invoicedTotal: +invoicedTotal.toFixed(2),
        invoicedPaid: +invoicedPaid.toFixed(2),
        notYetInvoiced: +(parseFloat(plain.total || plain.subtotal || 0) - invoicedTotal).toFixed(2),
      };
    });

    if (unbudgetedPaid > 0 || unbudgetedCommitted > 0) {
      sections.push({
        category: "Uncategorized/Unbudgeted",
        activityId: null,
        budget: 0,
        paid: +unbudgetedPaid.toFixed(2),
        committed: +unbudgetedCommitted.toFixed(2),
        balance: +(-unbudgetedPaid).toFixed(2),
        payments: unbudgetedPayments,
        expenses: unbudgetedExpenses,
        lpos: unbudgetedLposWithInvoiceInfo,
        invoices: unbudgetedInvoicesWithBalance,
      });
    }

    const grandSummary = sections.reduce(
      (acc, s) => ({
        budget: acc.budget + s.budget,
        paid: acc.paid + s.paid,
        committed: acc.committed + s.committed,
        balance: acc.balance + s.balance,
        paymentsCount: acc.paymentsCount + s.payments.length,
        expensesCount: acc.expensesCount + s.expenses.length,
        lposCount: acc.lposCount + s.lpos.length,
      }),
      {
        budget: 0,
        paid: 0,
        committed: 0,
        balance: 0,
        paymentsCount: 0,
        expensesCount: 0,
        lposCount: 0,
      },
    );

    return successResponse(res, {
      generatedAt: new Date(),
      projectId,
      grandSummary,
      sections,
    });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
// PAYMENTS
// ══════════════════════════════════════════════════════════════

exports.listPayments = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page, limit, offset } = getPagination(req.query);
    const { status, activityId } = req.query;

    const where = { projectId };
    if (status) where.status = status;
    if (activityId) where.activityId = activityId;

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [ACTIVITY_INCLUDE, PAID_TO_INCLUDE, USER_CREATED_INCLUDE],
      order: [["date", "DESC"]],
      limit,
      offset,
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

exports.getPayment = async (req, res, next) => {
  try {
    const { projectId, paymentId } = req.params;
    const payment = await Payment.findOne({
      where: { id: paymentId, projectId },
      include: [ACTIVITY_INCLUDE, PAID_TO_INCLUDE, USER_CREATED_INCLUDE],
    });
    if (!payment) return errorResponse(res, "Payment not found", 404);
    return successResponse(res, { payment });
  } catch (err) {
    next(err);
  }
};

exports.createPayment = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      activityId,
      paidTo,
      description,
      amount,
      currency,
      date,
      dueDate,
      status,
    } = req.body;

    if (!description) return errorResponse(res, "Description is required", 400);
    if (!amount || parseFloat(amount) <= 0)
      return errorResponse(res, "A valid amount is required", 400);
    if (!date) return errorResponse(res, "Date is required", 400);

    if (activityId) {
      const activity = await Activity.findOne({
        where: { id: activityId, projectId },
      });
      if (!activity)
        return errorResponse(res, "Activity not found for this project", 404);
    }

    if (paidTo) {
      const technician = await Technician.findByPk(paidTo);
      if (!technician)
        return errorResponse(res, "Technician (paidTo) not found", 404);
    }

    const payment = await Payment.create({
      projectId,
      activityId: activityId || null,
      paidToId: paidTo || null,
      description,
      amount: parseFloat(amount),
      currency: currency || "TZS",
      date,
      dueDate: dueDate || null,
      status: status || "Open",
      createdById: req.userId,
    });

    const full = await Payment.findByPk(payment.id, {
      include: [ACTIVITY_INCLUDE, PAID_TO_INCLUDE],
    });
    return successResponse(res, { payment: full }, "Payment recorded", 201);
  } catch (err) {
    next(err);
  }
};

exports.updatePayment = async (req, res, next) => {
  try {
    const { projectId, paymentId } = req.params;
    const payment = await Payment.findOne({
      where: { id: paymentId, projectId },
    });
    if (!payment) return errorResponse(res, "Payment not found", 404);

    const {
      activityId,
      paidTo,
      description,
      amount,
      currency,
      date,
      dueDate,
      status,
    } = req.body;

    if (activityId) {
      const activity = await Activity.findOne({
        where: { id: activityId, projectId },
      });
      if (!activity)
        return errorResponse(res, "Activity not found for this project", 404);
    }

    if (paidTo) {
      const technician = await Technician.findByPk(paidTo);
      if (!technician)
        return errorResponse(res, "Technician (paidTo) not found", 404);
    }

    await payment.update({
      activityId: activityId ?? payment.activityId,
      paidToId: paidTo ?? payment.paidToId,
      description: description ?? payment.description,
      amount: amount !== undefined ? parseFloat(amount) : payment.amount,
      currency: currency ?? payment.currency,
      date: date ?? payment.date,
      dueDate: dueDate ?? payment.dueDate,
      status: status ?? payment.status,
    });

    return successResponse(res, { payment }, "Payment updated");
  } catch (err) {
    next(err);
  }
};

exports.approvePayment = async (req, res, next) => {
  try {
    const { projectId, paymentId } = req.params;
    const payment = await Payment.findOne({
      where: { id: paymentId, projectId },
    });
    if (!payment) return errorResponse(res, "Payment not found", 404);

    await payment.update({
      status: "Approved",
      approvedById: req.userId,
      approvedAt: new Date(),
    });

    return successResponse(res, { payment }, "Payment approved");
  } catch (err) {
    next(err);
  }
};

exports.deletePayment = async (req, res, next) => {
  try {
    const { projectId, paymentId } = req.params;
    const payment = await Payment.findOne({
      where: { id: paymentId, projectId },
    });
    if (!payment) return errorResponse(res, "Payment not found", 404);
    if (payment.status === "Paid")
      return errorResponse(
        res,
        "Cannot delete a payment already marked as paid",
        400,
      );
    await payment.destroy();
    return successResponse(res, null, "Payment deleted");
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
// INVOICES
// ══════════════════════════════════════════════════════════════

// Helper: ongeza paidAmount/balance kwenye invoice object (kutoka InvoicePayment records)
async function withInvoiceBalance(invoice) {
  const plain = invoice.toJSON ? invoice.toJSON() : invoice;
  const paidAmount =
    (await InvoicePayment.sum("amount", {
      where: { invoiceId: plain.id },
    })) || 0;
  return {
    ...plain,
    paidAmount: +parseFloat(paidAmount).toFixed(2),
    balance: +(parseFloat(plain.amount) - parseFloat(paidAmount)).toFixed(2),
  };
}

exports.listInvoices = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page, limit, offset } = getPagination(req.query);
    const { status } = req.query;

    const where = { projectId };
    if (status) where.status = status;

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include: [ACTIVITY_INCLUDE, SUPPLIER_INCLUDE, LPO_BASIC_INCLUDE],
      order: [["date", "DESC"]],
      limit,
      offset,
    });

    const withBalances = await Promise.all(rows.map(withInvoiceBalance));
    return paginatedResponse(res, withBalances, count, page, limit);
  } catch (err) {
    next(err);
  }
};

exports.createInvoice = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      activityId,
      supplierId,
      lpoId,
      invoiceNo,
      description,
      amount,
      currency,
      date,
      dueDate,
      notes,
    } = req.body;

    if (!invoiceNo)
      return errorResponse(res, "Invoice number is required", 400);
    if (!description) return errorResponse(res, "Description is required", 400);
    if (!amount || parseFloat(amount) <= 0)
      return errorResponse(res, "A valid amount is required", 400);
    if (!date) return errorResponse(res, "Date is required", 400);

    if (supplierId) {
      const supplier = await Supplier.findByPk(supplierId);
      if (!supplier) return errorResponse(res, "Supplier not found", 404);
    }

    if (lpoId) {
      const lpo = await LocalPurchaseOrder.findOne({
        where: { id: lpoId, projectId },
      });
      if (!lpo)
        return errorResponse(res, "LPO not found for this project", 404);

      const otherInvoicesTotal =
        (await Invoice.sum("amount", { where: { lpoId } })) || 0;
      const wouldBeTotal = parseFloat(otherInvoicesTotal) + parseFloat(amount);

      if (wouldBeTotal > parseFloat(lpo.total) + 0.01) {
        const remaining =
          parseFloat(lpo.total) - parseFloat(otherInvoicesTotal);
        return errorResponse(
          res,
          `Invoice amount exceeds LPO ${lpo.lpoNo} value. LPO total: ${parseFloat(lpo.total).toFixed(2)}, already invoiced: ${parseFloat(otherInvoicesTotal).toFixed(2)}, remaining: ${remaining.toFixed(2)}`,
          400,
        );
      }
    }

    const invoice = await Invoice.create({
      projectId,
      activityId: activityId || null,
      supplierId: supplierId || null,
      lpoId: lpoId || null, // HIARI — invoice inaweza kuwa huru bila LPO
      invoiceNo,
      description,
      amount: parseFloat(amount),
      currency: currency || "TZS",
      date,
      dueDate: dueDate || null,
      notes,
      status: "Pending Approval",
      createdById: req.userId,
    });

    const full = await Invoice.findByPk(invoice.id, {
      include: [ACTIVITY_INCLUDE, SUPPLIER_INCLUDE, LPO_BASIC_INCLUDE],
    });
    return successResponse(
      res,
      { invoice: await withInvoiceBalance(full) },
      "Invoice created",
      201,
    );
  } catch (err) {
    next(err);
  }
};

exports.updateInvoice = async (req, res, next) => {
  try {
    const { projectId, invoiceId } = req.params;
    const invoice = await Invoice.findOne({
      where: { id: invoiceId, projectId },
    });
    if (!invoice) return errorResponse(res, "Invoice not found", 404);

    if (req.body.supplierId) {
      const supplier = await Supplier.findByPk(req.body.supplierId);
      if (!supplier) return errorResponse(res, "Supplier not found", 404);
    }
    if (req.body.lpoId) {
      const lpo = await LocalPurchaseOrder.findOne({
        where: { id: req.body.lpoId, projectId },
      });
      if (!lpo)
        return errorResponse(res, "LPO not found for this project", 404);

      const otherInvoicesTotal =
        (await Invoice.sum("amount", {
          where: { lpoId: req.body.lpoId, id: { [Op.ne]: invoiceId } },
        })) || 0;
      const newAmount =
        req.body.amount !== undefined
          ? parseFloat(req.body.amount)
          : parseFloat(invoice.amount);
      const wouldBeTotal = parseFloat(otherInvoicesTotal) + newAmount;

      if (wouldBeTotal > parseFloat(lpo.total) + 0.01) {
        const remaining =
          parseFloat(lpo.total) - parseFloat(otherInvoicesTotal);
        return errorResponse(
          res,
          `Invoice amount exceeds LPO ${lpo.lpoNo} value. Remaining available: ${remaining.toFixed(2)}`,
          400,
        );
      }
    }

    await invoice.update({
      ...req.body,
      activityId: req.body.activityId || null,
      supplierId: req.body.supplierId || null,
      lpoId: req.body.lpoId || null,
    });
    return successResponse(
      res,
      { invoice: await withInvoiceBalance(invoice) },
      "Invoice updated",
    );
  } catch (err) {
    next(err);
  }
};

exports.approveInvoice = async (req, res, next) => {
  try {
    const { projectId, invoiceId } = req.params;
    const invoice = await Invoice.findOne({
      where: { id: invoiceId, projectId },
    });
    if (!invoice) return errorResponse(res, "Invoice not found", 404);

    await invoice.update({
      status: "Approved",
      approvedById: req.userId,
      approvedAt: new Date(),
    });

    return successResponse(res, { invoice }, "Invoice approved");
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/finance/invoices/:invoiceId/record-payment
// Malipo ya SEHEMU-SEHEMU dhidi ya Invoice — unaweza kuita hii mara nyingi
// mpaka deni liishe. Kila call inaunda rekodi ya InvoicePayment, kisha
// inakokotoa upya jumla iliyolipwa na kubadilisha status ya Invoice:
//   paidAmount === 0            -> haibadiliki (Open/Pending/Approved)
//   0 < paidAmount < amount     -> "Partially Paid"
//   paidAmount >= amount        -> "Paid" (deni limeisha)
exports.recordInvoicePayment = async (req, res, next) => {
  try {
    const { projectId, invoiceId } = req.params;
    const { amount, date, notes } = req.body;

    if (!amount || parseFloat(amount) <= 0)
      return errorResponse(res, "A valid payment amount is required", 400);
    if (!date) return errorResponse(res, "Date is required", 400);

    const invoice = await Invoice.findOne({
      where: { id: invoiceId, projectId },
      include: [LPO_BASIC_INCLUDE],
    });
    if (!invoice) return errorResponse(res, "Invoice not found", 404);
    if (invoice.status === "Paid")
      return errorResponse(res, "Invoice is already fully paid", 400);

    const alreadyPaid =
      (await InvoicePayment.sum("amount", { where: { invoiceId } })) || 0;
    const remaining = parseFloat(invoice.amount) - parseFloat(alreadyPaid);

    if (parseFloat(amount) > remaining + 0.01) {
      return errorResponse(
        res,
        `Payment exceeds remaining balance. Remaining: ${remaining.toFixed(2)} ${invoice.currency}`,
        400,
      );
    }

    await InvoicePayment.create({
      invoiceId,
      amount: parseFloat(amount),
      date,
      notes,
      createdById: req.userId,
    });

    const newPaidTotal = parseFloat(alreadyPaid) + parseFloat(amount);
    const fullyPaid = newPaidTotal >= parseFloat(invoice.amount) - 0.01;

    await invoice.update({
      status: fullyPaid ? "Paid" : "Partially Paid",
      paidById: fullyPaid ? req.userId : invoice.paidById,
      paidAt: fullyPaid ? new Date() : invoice.paidAt,
    });

    // Kama Invoice hii imeunganishwa na LPO, na sasa Invoice zote za LPO hiyo
    // zimelipwa kikamilifu, tunaashiria "deni la LPO limeisha" kwenye response.
    let lpoFullySettled = null;
    if (invoice.lpoId) {
      const lpoInvoices = await Invoice.findAll({
        where: { lpoId: invoice.lpoId },
      });
      lpoFullySettled = lpoInvoices.every(
        (i) => i.status === "Paid" || (i.id === invoice.id && fullyPaid),
      );
      if (lpoFullySettled) {
        // Hakikisha invoice zote (pamoja na hii tuliyoibadilisha sasa hivi) ni Paid
        const stillUnpaid = await Invoice.count({
          where: { lpoId: invoice.lpoId, status: { [Op.ne]: "Paid" } },
        });
        lpoFullySettled = stillUnpaid === 0;
      }
    }

    const full = await Invoice.findByPk(invoiceId, {
      include: [ACTIVITY_INCLUDE, SUPPLIER_INCLUDE, LPO_BASIC_INCLUDE],
    });

    return successResponse(
      res,
      {
        invoice: await withInvoiceBalance(full),
        lpoFullySettled,
        lpoNo: invoice.lpo?.lpoNo || null,
      },
      fullyPaid
        ? `Invoice fully paid!${lpoFullySettled ? ` LPO ${invoice.lpo?.lpoNo || ""} debt is now fully settled.` : ""}`
        : `Partial payment of ${amount} recorded. Remaining balance: ${(remaining - parseFloat(amount)).toFixed(2)}`,
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/finance/invoices/:invoiceId/payments
// Historia ya malipo yote ya sehemu-sehemu kwa Invoice hii
exports.getInvoicePayments = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const payments = await InvoicePayment.findAll({
      where: { invoiceId },
      order: [["date", "ASC"]],
    });
    return successResponse(res, { payments });
  } catch (err) {
    next(err);
  }
};

// Helper: baada ya kuongeza/kuhariri/kufuta InvoicePayment, kokotoa upya
// paidAmount na status ya Invoice husika
async function recalcInvoiceStatus(invoiceId) {
  const invoice = await Invoice.findByPk(invoiceId);
  if (!invoice) return null;

  const paidAmount =
    (await InvoicePayment.sum("amount", { where: { invoiceId } })) || 0;
  const fullyPaid = parseFloat(paidAmount) >= parseFloat(invoice.amount) - 0.01;
  const partiallyPaid = parseFloat(paidAmount) > 0 && !fullyPaid;

  let newStatus = invoice.status;
  if (fullyPaid) newStatus = "Paid";
  else if (partiallyPaid) newStatus = "Partially Paid";
  else if (["Paid", "Partially Paid"].includes(invoice.status)) {
    // Malipo yote yamefutwa/kupunguzwa hadi 0 — rudisha kwenye "Approved"
    newStatus = "Approved";
  }

  await invoice.update({
    status: newStatus,
    paidAt: fullyPaid ? invoice.paidAt || new Date() : null,
  });

  return invoice;
}

// PUT /api/projects/:projectId/finance/invoices/:invoiceId/payments/:paymentId
// Hariri rekodi ya malipo iliyopo (mfano: kurekebisha kiasi/tarehe kimakosa)
exports.updateInvoicePayment = async (req, res, next) => {
  try {
    const { invoiceId, paymentId } = req.params;
    const { amount, date, notes } = req.body;

    const record = await InvoicePayment.findOne({
      where: { id: paymentId, invoiceId },
    });
    if (!record) return errorResponse(res, "Payment record not found", 404);

    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) return errorResponse(res, "Invoice not found", 404);

    if (amount !== undefined) {
      if (parseFloat(amount) <= 0)
        return errorResponse(res, "A valid payment amount is required", 400);

      // Kagua kwamba kubadilisha kiasi hiki hakuzidishi jumla zaidi ya Invoice.amount
      const otherPaymentsTotal =
        (await InvoicePayment.sum("amount", {
          where: { invoiceId, id: { [Op.ne]: paymentId } },
        })) || 0;
      const newTotal = parseFloat(otherPaymentsTotal) + parseFloat(amount);
      if (newTotal > parseFloat(invoice.amount) + 0.01) {
        return errorResponse(
          res,
          `Total payments would exceed invoice amount. Max allowed for this entry: ${(parseFloat(invoice.amount) - parseFloat(otherPaymentsTotal)).toFixed(2)}`,
          400,
        );
      }
    }

    await record.update({
      amount: amount !== undefined ? parseFloat(amount) : record.amount,
      date: date ?? record.date,
      notes: notes ?? record.notes,
    });

    const updatedInvoice = await recalcInvoiceStatus(invoiceId);

    return successResponse(
      res,
      { payment: record, invoice: await withInvoiceBalance(updatedInvoice) },
      "Payment record updated",
    );
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/finance/invoices/:invoiceId/payments/:paymentId
// Futa rekodi ya malipo (mfano: iliingizwa kimakosa) — Invoice status
// inarudi nyuma kiotomatiki (Paid -> Partially Paid -> Approved) kadri ya
// kiasi kilichobaki
exports.deleteInvoicePayment = async (req, res, next) => {
  try {
    const { invoiceId, paymentId } = req.params;
    const record = await InvoicePayment.findOne({
      where: { id: paymentId, invoiceId },
    });
    if (!record) return errorResponse(res, "Payment record not found", 404);

    await record.destroy();
    const updatedInvoice = await recalcInvoiceStatus(invoiceId);

    return successResponse(
      res,
      { invoice: await withInvoiceBalance(updatedInvoice) },
      "Payment record deleted",
    );
  } catch (err) {
    next(err);
  }
};

// Helper: baada ya kuongeza/kuhariri/kufuta InvoicePayment, kokotoa upya
// status ya Invoice kufuatana na jumla mpya ya malipo.
async function recalculateInvoiceStatus(invoice) {
  const paidTotal =
    (await InvoicePayment.sum("amount", {
      where: { invoiceId: invoice.id },
    })) || 0;
  const fullyPaid = parseFloat(paidTotal) >= parseFloat(invoice.amount) - 0.01;
  const partiallyPaid = parseFloat(paidTotal) > 0 && !fullyPaid;

  let newStatus = invoice.status;
  if (fullyPaid) newStatus = "Paid";
  else if (partiallyPaid) newStatus = "Partially Paid";
  else if (invoice.status === "Paid" || invoice.status === "Partially Paid") {
    // Malipo yote yamefutwa/yamepunguzwa hadi 0 — rudisha kwenye "Approved"
    newStatus = "Approved";
  }

  await invoice.update({
    status: newStatus,
    paidById: fullyPaid ? invoice.paidById : null,
    paidAt: fullyPaid ? invoice.paidAt || new Date() : null,
  });

  return { paidTotal: parseFloat(paidTotal), fullyPaid };
}

// PUT /api/projects/:projectId/finance/invoices/:invoiceId/payments/:paymentId
exports.updateInvoicePayment = async (req, res, next) => {
  try {
    const { projectId, invoiceId, paymentId } = req.params;
    const { amount, date, notes } = req.body;

    const invoice = await Invoice.findOne({
      where: { id: invoiceId, projectId },
    });
    if (!invoice) return errorResponse(res, "Invoice not found", 404);

    const paymentRecord = await InvoicePayment.findOne({
      where: { id: paymentId, invoiceId },
    });
    if (!paymentRecord)
      return errorResponse(res, "Payment record not found", 404);

    if (amount !== undefined) {
      if (parseFloat(amount) <= 0)
        return errorResponse(res, "A valid amount is required", 400);

      const otherPaymentsTotal =
        (await InvoicePayment.sum("amount", {
          where: { invoiceId, id: { [Op.ne]: paymentId } },
        })) || 0;
      const wouldBeTotal = parseFloat(otherPaymentsTotal) + parseFloat(amount);

      if (wouldBeTotal > parseFloat(invoice.amount) + 0.01) {
        const maxAllowed =
          parseFloat(invoice.amount) - parseFloat(otherPaymentsTotal);
        return errorResponse(
          res,
          `Amount exceeds invoice total. Maximum allowed for this payment: ${maxAllowed.toFixed(2)}`,
          400,
        );
      }
    }

    await paymentRecord.update({
      amount: amount !== undefined ? parseFloat(amount) : paymentRecord.amount,
      date: date ?? paymentRecord.date,
      notes: notes ?? paymentRecord.notes,
    });

    const { paidTotal, fullyPaid } = await recalculateInvoiceStatus(invoice);
    const full = await Invoice.findByPk(invoiceId, {
      include: [ACTIVITY_INCLUDE, SUPPLIER_INCLUDE, LPO_BASIC_INCLUDE],
    });

    return successResponse(
      res,
      { payment: paymentRecord, invoice: await withInvoiceBalance(full) },
      "Payment record updated",
    );
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/finance/invoices/:invoiceId/payments/:paymentId
exports.deleteInvoicePayment = async (req, res, next) => {
  try {
    const { projectId, invoiceId, paymentId } = req.params;

    const invoice = await Invoice.findOne({
      where: { id: invoiceId, projectId },
    });
    if (!invoice) return errorResponse(res, "Invoice not found", 404);

    const paymentRecord = await InvoicePayment.findOne({
      where: { id: paymentId, invoiceId },
    });
    if (!paymentRecord)
      return errorResponse(res, "Payment record not found", 404);

    await paymentRecord.destroy();
    await recalculateInvoiceStatus(invoice);

    const full = await Invoice.findByPk(invoiceId, {
      include: [ACTIVITY_INCLUDE, SUPPLIER_INCLUDE, LPO_BASIC_INCLUDE],
    });

    return successResponse(
      res,
      { invoice: await withInvoiceBalance(full) },
      "Payment record deleted",
    );
  } catch (err) {
    next(err);
  }
};

exports.deleteInvoice = async (req, res, next) => {
  try {
    const { projectId, invoiceId } = req.params;
    const invoice = await Invoice.findOne({
      where: { id: invoiceId, projectId },
    });
    if (!invoice) return errorResponse(res, "Invoice not found", 404);
    await invoice.destroy();
    return successResponse(res, null, "Invoice deleted");
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
// EXPENSE CATEGORIES (global)
// ══════════════════════════════════════════════════════════════

exports.listExpenseCategories = async (req, res, next) => {
  try {
    const categories = await ExpenseCategory.findAll({
      where: { isActive: true },
      order: [["name", "ASC"]],
    });
    return successResponse(res, { categories });
  } catch (err) {
    next(err);
  }
};

exports.createExpenseCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return errorResponse(res, "Name is required", 400);
    const existing = await ExpenseCategory.findOne({ where: { name } });
    if (existing) return errorResponse(res, "Category already exists", 400);
    const category = await ExpenseCategory.create({ name });
    return successResponse(res, { category }, "Category created", 201);
  } catch (err) {
    next(err);
  }
};

exports.updateExpenseCategory = async (req, res, next) => {
  try {
    const category = await ExpenseCategory.findByPk(req.params.categoryId);
    if (!category) return errorResponse(res, "Category not found", 404);
    await category.update(req.body);
    return successResponse(res, { category }, "Category updated");
  } catch (err) {
    next(err);
  }
};

exports.deleteExpenseCategory = async (req, res, next) => {
  try {
    const category = await ExpenseCategory.findByPk(req.params.categoryId);
    if (!category) return errorResponse(res, "Category not found", 404);
    const count = await Expense.count({ where: { categoryId: category.id } });
    if (count > 0)
      return errorResponse(
        res,
        `Cannot delete: ${count} expense(s) use this category`,
        400,
      );
    await category.update({ isActive: false });
    return successResponse(res, null, "Category deleted");
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
// EXPENSES
// ══════════════════════════════════════════════════════════════

exports.listExpenses = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page, limit, offset } = getPagination(req.query);
    const { categoryId } = req.query;

    const where = { projectId };
    if (categoryId) where.categoryId = categoryId;

    const { count, rows } = await Expense.findAndCountAll({
      where,
      include: [ACTIVITY_INCLUDE, EXPENSE_CATEGORY_INCLUDE],
      order: [["date", "DESC"]],
      limit,
      offset,
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

exports.createExpense = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { activityId, categoryId, description, amount, date, notes } =
      req.body;

    if (!categoryId) return errorResponse(res, "Category is required", 400);
    if (!description) return errorResponse(res, "Description is required", 400);
    if (!amount || parseFloat(amount) <= 0)
      return errorResponse(res, "A valid amount is required", 400);
    if (!date) return errorResponse(res, "Date is required", 400);

    const category = await ExpenseCategory.findByPk(categoryId);
    if (!category) return errorResponse(res, "Expense category not found", 404);

    if (activityId) {
      const activity = await Activity.findOne({
        where: { id: activityId, projectId },
      });
      if (!activity)
        return errorResponse(res, "Activity not found for this project", 404);
    }

    const expense = await Expense.create({
      projectId,
      activityId: activityId || null,
      categoryId,
      description,
      amount: parseFloat(amount),
      date,
      notes,
      createdById: req.userId,
    });

    const full = await Expense.findByPk(expense.id, {
      include: [ACTIVITY_INCLUDE, EXPENSE_CATEGORY_INCLUDE],
    });
    return successResponse(res, { expense: full }, "Expense recorded", 201);
  } catch (err) {
    next(err);
  }
};

exports.updateExpense = async (req, res, next) => {
  try {
    const { projectId, expenseId } = req.params;
    const expense = await Expense.findOne({
      where: { id: expenseId, projectId },
    });
    if (!expense) return errorResponse(res, "Expense not found", 404);

    const { activityId, categoryId } = req.body;

    if (categoryId) {
      const category = await ExpenseCategory.findByPk(categoryId);
      if (!category)
        return errorResponse(res, "Expense category not found", 404);
    }
    if (activityId) {
      const activity = await Activity.findOne({
        where: { id: activityId, projectId },
      });
      if (!activity)
        return errorResponse(res, "Activity not found for this project", 404);
    }

    await expense.update({
      ...req.body,
      activityId: req.body.activityId || null,
    });
    return successResponse(res, { expense }, "Expense updated");
  } catch (err) {
    next(err);
  }
};

exports.deleteExpense = async (req, res, next) => {
  try {
    const { projectId, expenseId } = req.params;
    const expense = await Expense.findOne({
      where: { id: expenseId, projectId },
    });
    if (!expense) return errorResponse(res, "Expense not found", 404);
    await expense.destroy();
    return successResponse(res, null, "Expense deleted");
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
// FUNDING SOURCES
// ══════════════════════════════════════════════════════════════

exports.listFundingSources = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const sources = await FundingSource.findAll({
      where: { projectId },
      order: [["name", "ASC"]],
    });

    const totalBudgetRow = await Budget.findAll({ where: { projectId } });
    const totalBudget = totalBudgetRow.reduce(
      (s, b) => s + parseFloat(b.budgetAmount),
      0,
    );

    const withPct = sources.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      amount: parseFloat(s.amount),
      percentOfBudget: totalBudget
        ? +((parseFloat(s.amount) / totalBudget) * 100).toFixed(2)
        : 0,
      status: s.status,
    }));

    return successResponse(res, { sources: withPct });
  } catch (err) {
    next(err);
  }
};

exports.createFundingSource = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, type, amount, status, notes } = req.body;

    if (!name) return errorResponse(res, "Source name is required", 400);
    if (!type) return errorResponse(res, "Type is required", 400);
    if (!amount || parseFloat(amount) <= 0)
      return errorResponse(res, "A valid amount is required", 400);

    const source = await FundingSource.create({
      projectId,
      name,
      type,
      amount: parseFloat(amount),
      status: status || "Active",
      notes,
    });

    return successResponse(res, { source }, "Funding source added", 201);
  } catch (err) {
    next(err);
  }
};

exports.updateFundingSource = async (req, res, next) => {
  try {
    const { projectId, sourceId } = req.params;
    const source = await FundingSource.findOne({
      where: { id: sourceId, projectId },
    });
    if (!source) return errorResponse(res, "Funding source not found", 404);
    await source.update(req.body);
    return successResponse(res, { source }, "Funding source updated");
  } catch (err) {
    next(err);
  }
};

exports.deleteFundingSource = async (req, res, next) => {
  try {
    const { projectId, sourceId } = req.params;
    const source = await FundingSource.findOne({
      where: { id: sourceId, projectId },
    });
    if (!source) return errorResponse(res, "Funding source not found", 404);
    await source.destroy();
    return successResponse(res, null, "Funding source deleted");
  } catch (err) {
    next(err);
  }
};
