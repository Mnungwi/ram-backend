const fs = require("fs");
const path = require("path");
const { DOCUMENTS_DIR } = require("../config/uploadPaths");
const { SafetyRecord, SafetyDocument } = require("../models/safety.model");
const { User } = require("../models/index");
const { successResponse, errorResponse, paginatedResponse, getPagination } = require("../utils/response");
const { Op } = require("sequelize");

const DOC_INCLUDE = {
  model: SafetyDocument,
  as: "documents",
  include: [{ model: User, as: "uploadedBy", attributes: ["id", "firstName", "lastName"] }],
};

const RECORD_INCLUDES = [
  DOC_INCLUDE,
  { model: User, as: "reportedBy", attributes: ["id", "firstName", "lastName"] },
  { model: User, as: "createdBy", attributes: ["id", "firstName", "lastName"] },
];

// GET /api/projects/:projectId/safety/records
exports.listRecords = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page, limit, offset } = getPagination(req.query);
    const { search, type, status, severity } = req.query;

    const where = { projectId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await SafetyRecord.findAndCountAll({
      where,
      include: RECORD_INCLUDES,
      order: [["eventDate", "DESC"], ["id", "ASC"]],
      limit,
      offset,
      distinct: true,
    });

    return paginatedResponse(res, rows, count, page, limit, "Safety records retrieved");
  } catch (err) {
    next(err);
  }
};

// GET /api/safety/records/:id
exports.getRecord = async (req, res, next) => {
  try {
    const record = await SafetyRecord.findByPk(req.params.id, { include: RECORD_INCLUDES });
    if (!record) return errorResponse(res, "Safety record not found", 404);
    return successResponse(res, { record });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/safety/summary — quick counters for a dashboard widget
exports.getSummary = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const records = await SafetyRecord.findAll({ where: { projectId }, attributes: ["type", "status", "severity"] });

    const summary = {
      total: records.length,
      open: records.filter((r) => r.status === "open").length,
      resolved: records.filter((r) => r.status === "resolved").length,
      closed: records.filter((r) => r.status === "closed").length,
      byType: {},
      bySeverity: {},
    };
    for (const r of records) {
      summary.byType[r.type] = (summary.byType[r.type] || 0) + 1;
      if (r.severity) summary.bySeverity[r.severity] = (summary.bySeverity[r.severity] || 0) + 1;
    }

    return successResponse(res, summary, "Safety summary retrieved");
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/safety/records
exports.createRecord = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { type, title, description, eventDate, severity, location, actionTaken, status, reportedById } = req.body;

    if (!title) return errorResponse(res, "Title is required", 400);
    if (!eventDate) return errorResponse(res, "Event date is required", 400);

    const record = await SafetyRecord.create({
      projectId,
      type: type || "inspection",
      title,
      description: description || null,
      eventDate,
      severity: severity || null,
      location: location || null,
      actionTaken: actionTaken || null,
      status: status || "open",
      reportedById: reportedById || req.userId,
      createdById: req.userId,
    });

    const full = await SafetyRecord.findByPk(record.id, { include: RECORD_INCLUDES });
    return successResponse(res, { record: full }, "Safety record created", 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/safety/records/:id
exports.updateRecord = async (req, res, next) => {
  try {
    const record = await SafetyRecord.findByPk(req.params.id);
    if (!record) return errorResponse(res, "Safety record not found", 404);

    const { type, title, description, eventDate, severity, location, actionTaken, status, reportedById } = req.body;
    await record.update({
      type: type ?? record.type,
      title: title ?? record.title,
      description: description ?? record.description,
      eventDate: eventDate ?? record.eventDate,
      severity: severity ?? record.severity,
      location: location ?? record.location,
      actionTaken: actionTaken ?? record.actionTaken,
      status: status ?? record.status,
      reportedById: reportedById ?? record.reportedById,
    });

    const full = await SafetyRecord.findByPk(record.id, { include: RECORD_INCLUDES });
    return successResponse(res, { record: full }, "Safety record updated");
  } catch (err) {
    next(err);
  }
};

// DELETE /api/safety/records/:id
exports.deleteRecord = async (req, res, next) => {
  try {
    const record = await SafetyRecord.findByPk(req.params.id, { include: [DOC_INCLUDE] });
    if (!record) return errorResponse(res, "Safety record not found", 404);

    for (const doc of record.documents || []) {
      const filePath = path.join(DOCUMENTS_DIR, doc.filePath);
      if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    }
    await SafetyDocument.destroy({ where: { safetyRecordId: record.id } });
    await record.destroy();

    return successResponse(res, null, "Safety record deleted");
  } catch (err) {
    next(err);
  }
};

// ── Documents ────────────────────────────────────────────────────────────

// GET /api/projects/:projectId/safety/documents — general project safety
// files (Safety Plan, Site Policy, ...), not tied to a specific record
exports.listProjectDocuments = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const documents = await SafetyDocument.findAll({
      where: { projectId, safetyRecordId: null },
      include: [{ model: User, as: "uploadedBy", attributes: ["id", "firstName", "lastName"] }],
      order: [["createdAt", "DESC"]],
    });
    return successResponse(res, documents, "Project safety documents retrieved");
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/safety/documents  (multipart, field "file")
// Optional body.safetyRecordId attaches it to one specific record instead
// of leaving it as a general project-level safety document.
exports.uploadDocument = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    if (!req.file) return errorResponse(res, "File is required", 400);

    if (req.body.safetyRecordId) {
      const record = await SafetyRecord.findOne({ where: { id: req.body.safetyRecordId, projectId } });
      if (!record) {
        fs.unlink(req.file.path, () => {});
        return errorResponse(res, "Safety record not found for this project", 404);
      }
    }

    const doc = await SafetyDocument.create({
      projectId,
      safetyRecordId: req.body.safetyRecordId || null,
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      category: req.body.category || null,
      uploadedById: req.userId,
    });

    return successResponse(res, { document: doc }, "Document uploaded", 201);
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

// GET /api/safety/documents/:docId/download
exports.downloadDocument = async (req, res, next) => {
  try {
    const doc = await SafetyDocument.findByPk(req.params.docId);
    if (!doc) return errorResponse(res, "Document not found", 404);

    const filePath = path.join(DOCUMENTS_DIR, doc.filePath);
    if (!fs.existsSync(filePath)) return errorResponse(res, "File missing on server", 404);

    res.download(filePath, doc.fileName);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/safety/documents/:docId
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await SafetyDocument.findByPk(req.params.docId);
    if (!doc) return errorResponse(res, "Document not found", 404);

    const filePath = path.join(DOCUMENTS_DIR, doc.filePath);
    if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});

    await doc.destroy();
    return successResponse(res, null, "Document deleted");
  } catch (err) {
    next(err);
  }
};
