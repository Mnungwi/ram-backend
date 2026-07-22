const express = require('express');
const storeCtrl = require('../controllers/storeController');
const { authenticate, authorize } = require('../middleware/auth');
const { PERMISSIONS: P } = require('../config/permissions');

const router = express.Router();
router.use(authenticate);

router.get(   '/',                    authorize(P.SUPPLIER_VIEW),   storeCtrl.listCentralStore);
router.get(   '/transactions',        authorize(P.SUPPLIER_VIEW),   storeCtrl.listCentralTransactions);
router.post(  '/transfer/:projectId', authorize(P.SUPPLIER_CREATE), storeCtrl.transferCentralToProject);

module.exports = router;
