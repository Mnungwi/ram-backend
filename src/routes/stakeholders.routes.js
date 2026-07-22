const express = require("express");
const router = express.Router();
const stakeholderCtrl = require("../controllers/stakeholderController");
const { authenticate, authorize } = require("../middleware/auth");
const { PERMISSIONS: P } = require("../config/permissions");

router.use(authenticate);

router.get(
  "/",
  authorize(P.STAKEHOLDER_VIEW),
  stakeholderCtrl.listStakeholders,
);
router.post(
  "/",
  authorize(P.STAKEHOLDER_CREATE),
  stakeholderCtrl.createStakeholder,
);
router.get(
  "/:stakeholderId",
  authorize(P.STAKEHOLDER_VIEW),
  stakeholderCtrl.getStakeholder,
);
router.put(
  "/:stakeholderId",
  authorize(P.STAKEHOLDER_UPDATE),
  stakeholderCtrl.updateStakeholder,
);
router.delete(
  "/:stakeholderId",
  authorize(P.STAKEHOLDER_DELETE),
  stakeholderCtrl.deleteStakeholder,
);

module.exports = router;
