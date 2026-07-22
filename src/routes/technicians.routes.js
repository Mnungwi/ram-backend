const express = require('express');
const router = express.Router();
const techCtrl = require('../controllers/technicianController');
const { authenticate, authorize } = require('../middleware/auth');
const { PERMISSIONS: P } = require('../config/permissions');

router.use(authenticate);

// ── Categories ────────────────────────────────────────────
router.get(   '/categories',        authorize(P.PROJECT_VIEW),   techCtrl.listCategories);
router.post(  '/categories',        authorize(P.PROJECT_CREATE), techCtrl.createCategory);
router.put(   '/categories/:catId', authorize(P.PROJECT_UPDATE), techCtrl.updateCategory);
router.delete('/categories/:catId', authorize(P.PROJECT_DELETE), techCtrl.deleteCategory);

// ── Technicians ───────────────────────────────────────────
router.get(   '/',                       authorize(P.PROJECT_VIEW),   techCtrl.listTechnicians);
router.post(  '/',                       authorize(P.PROJECT_CREATE), techCtrl.createTechnician);
router.get(   '/:technicianId',          authorize(P.PROJECT_VIEW),   techCtrl.getTechnician);
router.put(   '/:technicianId',          authorize(P.PROJECT_UPDATE), techCtrl.updateTechnician);
router.delete('/:technicianId',          authorize(P.PROJECT_DELETE), techCtrl.deleteTechnician);
router.get(   '/:technicianId/receipts', authorize(P.PROJECT_VIEW),   techCtrl.getTechnicianReceipts);

module.exports = router;
