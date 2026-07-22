const express = require('express');
const unitCtrl = require('../controllers/unitController');
const { authorize,authenticate } = require('../middleware/auth');
const { PERMISSIONS: P } = require("../config/permissions");

const router = express.Router();
router.use(authenticate);

router.get(   '/categories', authorize(P.SUPPLIER_VIEW),   unitCtrl.listUnitCategories);
router.get(   '/',           authorize(P.SUPPLIER_VIEW),   unitCtrl.listUnits);
router.post(  '/',           authorize(P.SUPPLIER_CREATE), unitCtrl.createUnit);
router.get(   '/:unitId',    authorize(P.SUPPLIER_VIEW),   unitCtrl.getUnit);
router.put(   '/:unitId',    authorize(P.SUPPLIER_UPDATE), unitCtrl.updateUnit);
router.delete('/:unitId',    authorize(P.SUPPLIER_UPDATE), unitCtrl.deleteUnit);

module.exports = router;
