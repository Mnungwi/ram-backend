const express = require("express");
const router = express.Router();
const fc = require("../controllers/financeController");
const { authenticate } = require("../middleware/auth");


// ── Overview & Tax Summary ──
router.get("/projects/:projectId/finance", authenticate, fc.getOverview);
router.get("/projects/:projectId/finance/tax-summary", authenticate, fc.getTaxSummary);

// ── Expense Categories (global) ──
router.get("/expense-categories", authenticate, fc.listExpenseCategories);
router.post("/expense-categories", authenticate, fc.createExpenseCategory);
router.put("/expense-categories/:categoryId", authenticate, fc.updateExpenseCategory);
router.delete("/expense-categories/:categoryId", authenticate, fc.deleteExpenseCategory);

// ── Budget ──
router.get("/projects/:projectId/finance/budget", authenticate, fc.getBudget);
router.post("/projects/:projectId/finance/budget", authenticate, fc.upsertBudget);
router.delete("/projects/:projectId/finance/budget/:budgetId", authenticate, fc.deleteBudget);
router.get("/projects/:projectId/finance/budget/:budgetId/detail", authenticate, fc.getBudgetDetail);
router.get("/projects/:projectId/finance/report", authenticate, fc.getBudgetReport);
router.get("/projects/:projectId/finance/cashflow", authenticate, fc.getCashFlow);

// ── Payments ──
router.get("/projects/:projectId/finance/payments", authenticate, fc.listPayments);
router.get("/projects/:projectId/finance/payments/:paymentId", authenticate, fc.getPayment);
router.post("/projects/:projectId/finance/payments", authenticate, fc.createPayment);
router.put("/projects/:projectId/finance/payments/:paymentId", authenticate, fc.updatePayment);
router.post("/projects/:projectId/finance/payments/:paymentId/approve", authenticate, fc.approvePayment);
router.delete("/projects/:projectId/finance/payments/:paymentId", authenticate, fc.deletePayment);

// ── Invoices ──
router.get("/projects/:projectId/finance/invoices", authenticate, fc.listInvoices);
router.post("/projects/:projectId/finance/invoices", authenticate, fc.createInvoice);
router.put("/projects/:projectId/finance/invoices/:invoiceId", authenticate, fc.updateInvoice);
router.post("/projects/:projectId/finance/invoices/:invoiceId/approve", authenticate, fc.approveInvoice);
router.post("/projects/:projectId/finance/invoices/:invoiceId/record-payment", authenticate, fc.recordInvoicePayment);
router.get("/projects/:projectId/finance/invoices/:invoiceId/payments", authenticate, fc.getInvoicePayments);
router.put("/projects/:projectId/finance/invoices/:invoiceId/payments/:paymentId", authenticate, fc.updateInvoicePayment);
router.delete("/projects/:projectId/finance/invoices/:invoiceId/payments/:paymentId", authenticate, fc.deleteInvoicePayment);
router.put("/projects/:projectId/finance/invoices/:invoiceId/payments/:paymentId", authenticate, fc.updateInvoicePayment);
router.delete("/projects/:projectId/finance/invoices/:invoiceId/payments/:paymentId", authenticate, fc.deleteInvoicePayment);
router.delete("/projects/:projectId/finance/invoices/:invoiceId", authenticate, fc.deleteInvoice);

// ── Expenses ──
router.get("/projects/:projectId/finance/expenses", authenticate, fc.listExpenses);
router.post("/projects/:projectId/finance/expenses", authenticate, fc.createExpense);
router.put("/projects/:projectId/finance/expenses/:expenseId", authenticate, fc.updateExpense);
router.delete("/projects/:projectId/finance/expenses/:expenseId", authenticate, fc.deleteExpense);

// ── Funding Sources ──
router.get("/projects/:projectId/finance/funding-sources", authenticate, fc.listFundingSources);
router.post("/projects/:projectId/finance/funding-sources", authenticate, fc.createFundingSource);
router.put("/projects/:projectId/finance/funding-sources/:sourceId", authenticate, fc.updateFundingSource);
router.delete("/projects/:projectId/finance/funding-sources/:sourceId", authenticate, fc.deleteFundingSource);

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