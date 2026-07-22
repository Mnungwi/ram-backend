const express = require('express');
const clientCtrl = require('../controllers/clientController');
const { authenticate, authorize } = require('../middleware/auth');
const { PERMISSIONS: P } = require('../config/permissions');

const router = express.Router();
router.use(authenticate);

router.get(   '/',           authorize(P.PROJECT_VIEW),   clientCtrl.listClients);
router.post(  '/',           authorize(P.PROJECT_CREATE), clientCtrl.createClient);
router.get(   '/:clientId',  authorize(P.PROJECT_VIEW),   clientCtrl.getClient);
router.put(   '/:clientId',  authorize(P.PROJECT_UPDATE), clientCtrl.updateClient);
router.delete('/:clientId',  authorize(P.PROJECT_DELETE), clientCtrl.deleteClient);

module.exports = router;
