// ══════════════════════════════════════════════════════════════
// routes/inquiries.routes.js
// Admin-only "Contact Inbox": website contact-form messages (Inquiry) and
// career-application submissions (JobApplication). Mounted at /api/inquiries.
// ══════════════════════════════════════════════════════════════

const express = require("express");
const path = require("path");
const router = express.Router();
const { Inquiry, JobApplication } = require("../models/index");
const { successResponse, errorResponse } = require("../utils/response");
const { authenticate, authorize } = require("../middleware/auth");
const { PERMISSIONS: P } = require("../config/permissions");
const { RESUMES_DIR } = require("../config/uploadPaths");

router.use(authenticate);

// ─── CAREER APPLICATIONS (must be declared before the generic "/:id" routes) ──

// GET /api/inquiries/careers
router.get("/careers", authorize(P.INQUIRY_VIEW), async (req, res, next) => {
  try {
    const applications = await JobApplication.findAll({ order: [["createdAt", "DESC"]] });
    return successResponse(res, applications, "Career applications retrieved successfully");
  } catch (err) {
    next(err);
  }
});

// PATCH /api/inquiries/careers/:id/status
router.patch("/careers/:id/status", authorize(P.INQUIRY_VIEW), async (req, res, next) => {
  try {
    const application = await JobApplication.findByPk(req.params.id);
    if (!application) return errorResponse(res, "Application not found", 404);
    application.status = req.body.status || application.status;
    await application.save();
    return successResponse(res, application, "Status updated successfully");
  } catch (err) {
    next(err);
  }
});

// GET /api/inquiries/careers/:id/resume — authenticated file download
// (auth middleware also accepts ?token=... so an <a href> download link can carry auth)
router.get("/careers/:id/resume", authorize(P.INQUIRY_VIEW), async (req, res, next) => {
  try {
    const application = await JobApplication.findByPk(req.params.id);
    if (!application || !application.resumeFilename) {
      return errorResponse(res, "Resume not found", 404);
    }
    const filePath = path.join(RESUMES_DIR, application.resumeFilename);
    const downloadName = `${(application.name || "applicant").replace(/[^a-z0-9]+/gi, "-")}-CV.pdf`;
    return res.download(filePath, downloadName, (err) => {
      if (err && !res.headersSent) next(err);
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/inquiries/careers/:id
router.delete("/careers/:id", authorize(P.INQUIRY_DELETE), async (req, res, next) => {
  try {
    const application = await JobApplication.findByPk(req.params.id);
    if (!application) return errorResponse(res, "Application not found", 404);
    await application.destroy();
    return successResponse(res, {}, "Application deleted successfully");
  } catch (err) {
    next(err);
  }
});

// ─── CONTACT MESSAGES ──────────────────────────────────────────────────────

// GET /api/inquiries
router.get("/", authorize(P.INQUIRY_VIEW), async (req, res, next) => {
  try {
    const messages = await Inquiry.findAll({ order: [["createdAt", "DESC"]] });
    return successResponse(res, messages, "Inquiries retrieved successfully");
  } catch (err) {
    next(err);
  }
});

// PATCH /api/inquiries/:id/status
router.patch("/:id/status", authorize(P.INQUIRY_VIEW), async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findByPk(req.params.id);
    if (!inquiry) return errorResponse(res, "Inquiry not found", 404);
    inquiry.status = req.body.status || inquiry.status;
    await inquiry.save();
    return successResponse(res, inquiry, "Status updated successfully");
  } catch (err) {
    next(err);
  }
});

// DELETE /api/inquiries/:id
router.delete("/:id", authorize(P.INQUIRY_DELETE), async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findByPk(req.params.id);
    if (!inquiry) return errorResponse(res, "Inquiry not found", 404);
    await inquiry.destroy();
    return successResponse(res, {}, "Inquiry deleted successfully");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
