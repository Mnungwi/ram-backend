const express = require('express');
const phaseCtrl = require('../controllers/phaseController');
const { authenticate, authorize } = require('../middleware/auth');
const { PERMISSIONS: P } = require('../config/permissions');

const router = express.Router();
router.use(authenticate);

router.get(   '/',       authorize(P.PROJECT_VIEW),   phaseCtrl.listAllPhases);
router.post(  '/',       authorize(P.PROJECT_CREATE), phaseCtrl.createPhaseGlobal);
router.put(   '/:id',    authorize(P.PROJECT_UPDATE), phaseCtrl.updatePhaseGlobal);
router.delete('/:id',    authorize(P.PROJECT_DELETE), phaseCtrl.deletePhaseGlobal);

module.exports = router;
