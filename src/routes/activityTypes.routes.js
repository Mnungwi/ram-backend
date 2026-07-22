const express = require('express');
const activityTypeCtrl = require('../controllers/activityTypeController');
const { authenticate, authorize } = require('../middleware/auth');
const { PERMISSIONS: P } = require('../config/permissions');

const router = express.Router();
router.use(authenticate);

router.get(
  "/",
  authorize(P.ACTIVITY_TYPE_VIEW),
  activityTypeCtrl.listTypes,
);
router.post(
  "/",
  authorize(P.ACTIVITY_TYPE_CREATE),
  activityTypeCtrl.createType,
);
router.get(
  "/:typeId",
  authorize(P.ACTIVITY_TYPE_VIEW),
  activityTypeCtrl.getType,
);
router.put(
  "/:typeId",
  authorize(P.ACTIVITY_TYPE_UPDATE),
  activityTypeCtrl.updateType,
);
router.delete(
  "/:typeId",
  authorize(P.ACTIVITY_TYPE_DELETE),
  activityTypeCtrl.deleteType,
);

module.exports = router;
