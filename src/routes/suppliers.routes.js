const express = require('express');
const supplierCtrl = require('../controllers/supplierController');
const { authenticate, authorize } = require('../middleware/auth');
const { PERMISSIONS: P } = require('../config/permissions');

const router = express.Router();
router.use(authenticate);

router.get(   '/categories',    authorize(P.SUPPLIER_VIEW),   supplierCtrl.listCategories);
router.get(   '/',              authorize(P.SUPPLIER_VIEW),   supplierCtrl.listSuppliers);
router.post(  '/',              authorize(P.SUPPLIER_CREATE), supplierCtrl.createSupplier);
router.get(   '/:supplierId',   authorize(P.SUPPLIER_VIEW),   supplierCtrl.getSupplier);
router.put(   '/:supplierId',   authorize(P.SUPPLIER_UPDATE), supplierCtrl.updateSupplier);
router.delete('/:supplierId',   authorize(P.SUPPLIER_DELETE), supplierCtrl.deleteSupplier);

module.exports = router;
