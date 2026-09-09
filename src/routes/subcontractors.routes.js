const express = require("express");
const router = express.Router();
const sc = require("../controllers/subcontractorController");
const { authenticate, authorize } = require("../middleware/auth");
const { PERMISSIONS: P } = require("../config/permissions");
const upload = require("../middleware/documentUpload");

router.use(authenticate);

router.get("/projects/:projectId/subcontractors", authorize(P.SUBCONTRACTOR_VIEW), sc.listSubcontractors);
router.post("/projects/:projectId/subcontractors", authorize(P.SUBCONTRACTOR_CREATE), sc.createSubcontractor);

router.get("/subcontractors/:id", authorize(P.SUBCONTRACTOR_VIEW), sc.getSubcontractor);
router.put("/subcontractors/:id", authorize(P.SUBCONTRACTOR_UPDATE), sc.updateSubcontractor);
router.delete("/subcontractors/:id", authorize(P.SUBCONTRACTOR_DELETE), sc.deleteSubcontractor);

router.post("/subcontractors/:id/documents", authorize(P.SUBCONTRACTOR_UPDATE), upload.single("file"), sc.uploadDocument);
router.get("/subcontractors/documents/:docId/download", authorize(P.SUBCONTRACTOR_VIEW), sc.downloadDocument);
router.delete("/subcontractors/documents/:docId", authorize(P.SUBCONTRACTOR_UPDATE), sc.deleteDocument);

module.exports = router;
