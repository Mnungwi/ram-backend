const express = require('express');
const stakeholderTypeCtrl = require('../controllers/stakeholderTypeController');
const stakeholderCtrl     = require('../controllers/stakeholderController');
const { authenticate, authorize } = require('../middleware/auth');
const { PERMISSIONS: P } = require('../config/permissions');

const router = express.Router();
router.use(authenticate);

// Types
router.get(   '/types',      authorize(P.PROJECT_VIEW),   stakeholderTypeCtrl.listTypes);
router.post(  '/types',      authorize(P.PROJECT_CREATE), stakeholderTypeCtrl.createType);
router.put(   '/types/:id',  authorize(P.PROJECT_UPDATE), stakeholderTypeCtrl.updateType);
router.delete('/types/:id',  authorize(P.PROJECT_DELETE), stakeholderTypeCtrl.deleteType);

// Stakeholders
router.get(   '/',      authorize(P.PROJECT_VIEW),   stakeholderCtrl.listStakeholders);
router.post(  '/',      authorize(P.PROJECT_CREATE), stakeholderCtrl.createStakeholder);
router.get(   '/:id',   authorize(P.PROJECT_VIEW),   stakeholderCtrl.getStakeholder);
router.put(   '/:id',   authorize(P.PROJECT_UPDATE), stakeholderCtrl.updateStakeholder);
router.delete('/:id',   authorize(P.PROJECT_DELETE), stakeholderCtrl.deleteStakeholder);

module.exports = router;
