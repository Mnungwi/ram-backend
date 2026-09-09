const express = require("express");
const router = express.Router();
const fc = require("../controllers/financeController");
const { authenticate, authorize } = require("../middleware/auth");
const { PERMISSIONS: P } = require("../config/permissions");

router.use(authenticate);

// NOTE: every route below used to be `authenticate`-only — any logged-in
// user, regardless of role, could read or write Budget/Payments/Invoices/
// Expenses/Funding Sources data. That's why hiding the Finance tab in the
// admin UI never actually stopped anyone: the API behind it had no
// permission check to enforce it. Gated here now to match the real
// permission catalog (backend/src/config/permissions.js) — same pattern
// already used in siteFund.routes.js.

// ── Overview & Tax Summary ──
router.get("/projects/:projectId/finance", authorize(P.FINANCE_VIEW), fc.getOverview);
router.get("/projects/:projectId/finance/tax-summary", authorize(P.FINANCE_VIEW), fc.getTaxSummary);

// ── Expense Categories (global lookup, used by dropdowns across the app —
//    left read-open for any logged-in user; mutations still need a real
//    finance permission) ──
router.get("/expense-categories", fc.listExpenseCategories);
router.post("/expense-categories", authorize(P.FINANCE_CREATE), fc.createExpenseCategory);
router.put("/expense-categories/:categoryId", authorize(P.FINANCE_UPDATE), fc.updateExpenseCategory);
router.delete("/expense-categories/:categoryId", authorize(P.FINANCE_DELETE), fc.deleteExpenseCategory);

// ── Budget ──
router.get("/projects/:projectId/finance/budget", authorize(P.BUDGET_VIEW), fc.getBudget);
router.post("/projects/:projectId/finance/budget", authorize(P.BUDGET_UPDATE), fc.upsertBudget);
router.delete("/projects/:projectId/finance/budget/:budgetId", authorize(P.BUDGET_UPDATE), fc.deleteBudget);
router.get("/projects/:projectId/finance/budget/:budgetId/detail", authorize(P.BUDGET_VIEW), fc.getBudgetDetail);
router.get("/projects/:projectId/finance/report", authorize(P.FINANCE_VIEW), fc.getBudgetReport);
router.get("/projects/:projectId/finance/cashflow", authorize(P.BUDGET_VIEW), fc.getCashFlow);

// ── Payments ──
router.get("/projects/:projectId/finance/payments", authorize(P.PAYMENT_VIEW), fc.listPayments);
router.get("/projects/:projectId/finance/payments/:paymentId", authorize(P.PAYMENT_VIEW), fc.getPayment);
router.post("/projects/:projectId/finance/payments", authorize(P.PAYMENT_CREATE), fc.createPayment);
router.put("/projects/:projectId/finance/payments/:paymentId", authorize(P.PAYMENT_CREATE), fc.updatePayment);
router.post("/projects/:projectId/finance/payments/:paymentId/approve", authorize(P.PAYMENT_APPROVE), fc.approvePayment);
router.delete("/projects/:projectId/finance/payments/:paymentId", authorize(P.FINANCE_DELETE), fc.deletePayment);

// ── Invoices ──
router.get("/projects/:projectId/finance/invoices", authorize(P.INVOICE_VIEW), fc.listInvoices);
router.post("/projects/:projectId/finance/invoices", authorize(P.INVOICE_CREATE), fc.createInvoice);
router.put("/projects/:projectId/finance/invoices/:invoiceId", authorize(P.INVOICE_CREATE), fc.updateInvoice);
router.post("/projects/:projectId/finance/invoices/:invoiceId/approve", authorize(P.INVOICE_APPROVE), fc.approveInvoice);
router.post("/projects/:projectId/finance/invoices/:invoiceId/record-payment", authorize(P.PAYMENT_CREATE), fc.recordInvoicePayment);
router.get("/projects/:projectId/finance/invoices/:invoiceId/payments", authorize(P.INVOICE_VIEW), fc.getInvoicePayments);
router.put("/projects/:projectId/finance/invoices/:invoiceId/payments/:paymentId", authorize(P.PAYMENT_CREATE), fc.updateInvoicePayment);
router.delete("/projects/:projectId/finance/invoices/:invoiceId/payments/:paymentId", authorize(P.FINANCE_DELETE), fc.deleteInvoicePayment);
router.delete("/projects/:projectId/finance/invoices/:invoiceId", authorize(P.FINANCE_DELETE), fc.deleteInvoice);

// ── Expenses ──
router.get("/projects/:projectId/finance/expenses", authorize(P.EXPENSE_VIEW), fc.listExpenses);
router.post("/projects/:projectId/finance/expenses", authorize(P.EXPENSE_CREATE), fc.createExpense);
router.put("/projects/:projectId/finance/expenses/:expenseId", authorize(P.EXPENSE_CREATE), fc.updateExpense);
router.delete("/projects/:projectId/finance/expenses/:expenseId", authorize(P.FINANCE_DELETE), fc.deleteExpense);

// ── Funding Sources ──
router.get("/projects/:projectId/finance/funding-sources", authorize(P.FINANCE_VIEW), fc.listFundingSources);
router.post("/projects/:projectId/finance/funding-sources", authorize(P.FINANCE_CREATE), fc.createFundingSource);
router.put("/projects/:projectId/finance/funding-sources/:sourceId", authorize(P.FINANCE_UPDATE), fc.updateFundingSource);
router.delete("/projects/:projectId/finance/funding-sources/:sourceId", authorize(P.FINANCE_DELETE), fc.deleteFundingSource);

module.exports = router;

// ══════════════════════════════════════════════════════════════
// USICHOSAHAU
// ══════════════════════════════════════════════════════════════
// 1. Kwenye main routes index yako (ile yenye router.use("/technicians",...)
//    n.k.), ongeza: router.use("/", require("./finance.routes"));
// 2. Sync/migrate database — tables: budgets, payments, invoices, expenses, funding_sources
// 3. Hakikisha require("../models/activity.model"), require("../models/technician.model"),
//    na require("../models/index") kwenye finance.model.js na finance.controller.js
//    zinaelekeza sahihi
// 4. Taxes haina table yake — inakokotolewa moja kwa moja kutoka Payment
//    (getTaxSummary) — hakuna migration ya ziada inayohitajika
