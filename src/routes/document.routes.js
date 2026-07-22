const express = require("express");
const router = express.Router();
const dc = require("../controllers/document.controller");
const upload = require("../middleware/documentUpload");
const { authenticate, authorize } = require("../middleware/auth");
const { PERMISSIONS: P } = require("../config/permissions");

router.get("/projects/:projectId/documents", authenticate, authorize(P.PROJECT_VIEW), dc.listDocuments);
router.get("/projects/:projectId/documents/stats", authenticate, authorize(P.PROJECT_VIEW), dc.getDocumentStats);
router.post("/projects/:projectId/documents", authenticate, authorize(P.PROJECT_CREATE), upload.single("file"), dc.uploadDocument);
router.put("/projects/:projectId/documents/:documentId", authenticate, authorize(P.PROJECT_UPDATE), dc.updateDocument);
router.post(
  "/projects/:projectId/documents/:documentId/version",
  authenticate,
  authorize(P.PROJECT_UPDATE),
  upload.single("file"),
  dc.uploadNewVersion,
);
router.get("/projects/:projectId/documents/:documentId/versions", authenticate, authorize(P.PROJECT_VIEW), dc.listDocumentVersions);
router.get("/projects/:projectId/documents/:documentId/download", authenticate, authorize(P.PROJECT_VIEW), dc.downloadDocument);
router.delete("/projects/:projectId/documents/:documentId", authenticate, authorize(P.PROJECT_DELETE), dc.deleteDocument);

module.exports = router;

// ══════════════════════════════════════════════════════════════
// USICHOSAHAU
// ══════════════════════════════════════════════════════════════
// 1. npm install multer (kama huna bado)
// 2. Kwenye routes index yako kuu, ongeza: router.use("/", require("./document.routes"));
// 3. Ongeza folder "uploads/" kwenye .gitignore yako (files hazipaswi kuingia git)
// 4. Sync/migrate database — tables mpya: project_documents_v2, project_document_versions
