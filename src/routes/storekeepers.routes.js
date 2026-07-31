const express = require("express");
const router = express.Router();
const storekeeperCtrl = require("../controllers/storekeeperController");
const { authenticate, authorize } = require("../middleware/auth");
const { PERMISSIONS: P } = require("../config/permissions");

router.use(authenticate);

// ── All Storekeepers (Administration) ────────────────────
router.get("/", authorize(P.PROJECT_VIEW), storekeeperCtrl.listAllStorekeepers);
router.patch(
  "/:assignmentId/status",
  authorize(P.PROJECT_UPDATE),
  storekeeperCtrl.setStorekeeperStatus,
);

module.exports = router;
