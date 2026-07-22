const express = require("express");
const router = express.Router();
const stakeholderTypeCtrl = require("../controllers/stakeholderTypeController");
const { authenticate, authorize } = require("../middleware/auth");
const { PERMISSIONS: P } = require("../config/permissions");

router.use(authenticate);

router.get(
  "/",
  authorize(P.STAKEHOLDER_TYPE_VIEW),
  stakeholderTypeCtrl.listTypes,
);
router.post(
  "/",
  authorize(P.STAKEHOLDER_TYPE_CREATE),
  stakeholderTypeCtrl.createType,
);
router.put(
  "/:typeId",
  authorize(P.STAKEHOLDER_TYPE_UPDATE),
  stakeholderTypeCtrl.updateType,
);
router.delete(
  "/:typeId",
  authorize(P.STAKEHOLDER_TYPE_DELETE),
  stakeholderTypeCtrl.deleteType,
);

module.exports = router;
