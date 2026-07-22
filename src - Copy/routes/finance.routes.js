const express = require('express');
const financeCtrl = require('../controllers/financeController');
const { authenticate, authorize } = require('../middleware/auth');
const { PERMISSIONS: P } = require('../config/permissions');

const router = express.Router({ mergeParams: true });
router.use(authenticate);

router.get(  '/budget',            authorize(P.FINANCE_VIEW),   financeCtrl.getBudget);
router.post( '/budget',            authorize(P.FINANCE_UPDATE), financeCtrl.upsertBudgetItem);
router.get(  '/overview',          authorize(P.FINANCE_VIEW),   financeCtrl.getFinanceOverview);

router.get(  '/invoices',          authorize(P.FINANCE_VIEW),   financeCtrl.listInvoices);
router.post( '/invoices',          authorize(P.FINANCE_CREATE), financeCtrl.createInvoice);
router.post( '/invoices/:id/approve', authorize(P.FINANCE_UPDATE), financeCtrl.approveInvoice);

router.get(  '/payments',          authorize(P.FINANCE_VIEW),   financeCtrl.listPayments);
router.post( '/payments',          authorize(P.FINANCE_CREATE), financeCtrl.createPayment);
router.post( '/payments/:id/approve', authorize(P.FINANCE_UPDATE), financeCtrl.approvePayment);

router.get(  '/expenses',          authorize(P.FINANCE_VIEW),   financeCtrl.listExpenses);
router.post( '/expenses',          authorize(P.FINANCE_CREATE), financeCtrl.createExpense);

module.exports = router;
