const express = require("express");
const router = express.Router();
const safety = require("../controllers/safetyController");
const { authenticate, authorize } = require("../middleware/auth");
const { PERMISSIONS: P } = require("../config/permissions");
const upload = require("../middleware/documentUpload");

router.use(authenticate);

router.get("/projects/:projectId/safety/records", authorize(P.SAFETY_VIEW), safety.listRecords);
router.post("/projects/:projectId/safety/records", authorize(P.SAFETY_CREATE), safety.createRecord);
router.get("/projects/:projectId/safety/summary", authorize(P.SAFETY_VIEW), safety.getSummary);
router.get("/projects/:projectId/safety/documents", authorize(P.SAFETY_VIEW), safety.listProjectDocuments);
router.post("/projects/:projectId/safety/documents", authorize(P.SAFETY_CREATE), upload.single("file"), safety.uploadDocument);

router.get("/safety/records/:id", authorize(P.SAFETY_VIEW), safety.getRecord);
router.put("/safety/records/:id", authorize(P.SAFETY_UPDATE), safety.updateRecord);
router.delete("/safety/records/:id", authorize(P.SAFETY_DELETE), safety.deleteRecord);

router.get("/safety/documents/:docId/download", authorize(P.SAFETY_VIEW), safety.downloadDocument);
router.delete("/safety/documents/:docId", authorize(P.SAFETY_UPDATE), safety.deleteDocument);

module.exports = router;
