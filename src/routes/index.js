const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const { PERMISSIONS: P } = require("../config/permissions");
const roleCtrl = require("../controllers/roleController");

// Standalone permissions endpoint
router.get(
  "/permissions",
  authenticate,
  authorize(P.ROLE_VIEW),
  roleCtrl.listPermissions,
);

router.use("/public", require("./public.routes"));
router.use("/admin-website", require("./admin-website.routes"));
router.use("/auth", require("./auth.routes"));
router.use("/users", require("./users.routes"));
router.use("/roles", require("./roles.routes"));
router.use("/permissions", require("./permissions.routes"));
router.use("/clients", require("./clients.routes"));
router.use("/phases", require("./phases.routes"));
router.use("/activity-types", require("./activityTypes.routes"));
router.use("/suppliers", require("./suppliers.routes"));
router.use("/stakeholder-types", require("./stakeholderTypes.routes"));
router.use("/stakeholders", require("./stakeholders.routes"));
router.use("/products", require("./products.routes"));
router.use("/units", require("./units.routes"));
router.use("/store/central", require("./central.store.routes"));
router.use("/technicians", require("./technicians.routes"));
router.use("/storekeepers", require("./storekeepers.routes"));
router.use("/projects", require("./projects.routes"));
router.use("/media", require("./media.routes"));
router.use("/inquiries", require("./inquiries.routes"));
router.use("/", require("./gallery.routes"));
router.use("/", require("./letter.routes"));
router.use("/", require("./finance.routes"));
router.use("/", require("./document.routes"));

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const { authenticate, authorize } = require("../middleware/auth");
// const { PERMISSIONS: P } = require("../config/permissions");
// const roleCtrl = require("../controllers/roleController");

// // Standalone permissions endpoint
// router.get(
//   "/permissions",
//   authenticate,
//   authorize(P.ROLE_VIEW),
//   roleCtrl.listPermissions,
// );

// router.use("/auth", require("./auth.routes"));
// router.use("/users", require("./users.routes"));
// router.use("/roles", require("./roles.routes"));
// router.use("/clients", require("./clients.routes"));
// router.use("/phases", require("./phases.routes"));
// router.use("/activity-types", require("./activityTypes.routes"));
// router.use("/suppliers", require("./suppliers.routes"));
// router.use("/stakeholder-types", require("./stakeholderTypes.routes"));
// router.use("/stakeholders", require("./stakeholders.routes"));
// router.use("/products", require("./products.routes"));
// router.use("/units", require("./units.routes"));
// router.use("/store/central", require("./central.store.routes"));
// router.use("/projects", require("./projects.routes"));
// router.use("/letters", require("./letters.routes"));

// module.exports = router;
