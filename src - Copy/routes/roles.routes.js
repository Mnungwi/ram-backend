const express = require("express");
const roleCtrl = require("../controllers/roleController");
const { authenticate, authorize } = require("../middleware/auth");
const { PERMISSIONS: P } = require("../config/permissions");

const router = express.Router();
router.use(authenticate);


router.get("/", authorize(P.ROLE_VIEW), roleCtrl.listRoles);
router.post("/", authorize(P.ROLE_CREATE), roleCtrl.createRole);
router.get("/:roleId", authorize(P.ROLE_VIEW), roleCtrl.getRole);
router.put("/:roleId", authorize(P.ROLE_UPDATE), roleCtrl.updateRole);
router.delete("/:roleId", authorize(P.ROLE_DELETE), roleCtrl.deleteRole);
router.put(
  "/:roleId/permissions",
  authorize(P.PERMISSION_ASSIGN),
  roleCtrl.syncRolePermissions,
);

module.exports = router;
