const express = require("express");
const router = express.Router();
const sfc = require("../controllers/siteFundController");
const { authenticate, authorize } = require("../middleware/auth");
const { PERMISSIONS: P } = require("../config/permissions");

router.use(authenticate);

// Mobile/admin: "which projects am I a storekeeper on" — no finance permission needed
router.get("/site-fund/my-projects", sfc.getMyProjects);

// Storekeeper's own balance (mobile + admin self-view) — access is enforced
// inside the controller by checking the ProjectStorekeeper assignment itself.
router.get("/projects/:projectId/site-fund/my-balance", sfc.getMyBalance);

// Finance/admin views — require real finance permissions
router.get("/projects/:projectId/site-fund/balance", authorize(P.FINANCE_VIEW), sfc.getBalance);
router.get("/projects/:projectId/site-fund/disbursements", authorize(P.FINANCE_VIEW), sfc.listDisbursements);
router.post("/projects/:projectId/site-fund/disbursements", authorize(P.FINANCE_CREATE), sfc.createDisbursement);
router.delete("/projects/:projectId/site-fund/disbursements/:id", authorize(P.FINANCE_DELETE), sfc.deleteDisbursement);

module.exports = router;
