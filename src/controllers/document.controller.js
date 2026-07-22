const fs = require("fs");
const path = require("path");
const { DOCUMENTS_DIR } = require("../config/uploadPaths");
const { Document, DocumentVersion } = require("../models/document.model");

if (!Document) {
  console.error(
    "❌ document.controller.js: 'Document' ni undefined — hakikisha require(\"../models/document.model\") path ni sahihi na faili hiyo ina 'module.exports = { Document, ... }'",
  );
}
if (!DocumentVersion) {
  console.error(
    "❌ document.controller.js: 'DocumentVersion' ni undefined — angalia require path",
  );
}
const { User } = require("../models/index");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPagination,
} = require("../utils/response");
const { Op } = require("sequelize");
console.log("🔍 DEBUG: Document =", typeof Document, Document);
const UPLOADED_BY_INCLUDE = {
  model: User,
  as: "uploadedBy",
  attributes: ["id", "firstName", "lastName"],
};

// ══════════════════════════════════════════════════════════════
// LIST / STATS
// ══════════════════════════════════════════════════════════════

// GET /api/projects/:projectId/documents
exports.listDocuments = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page, limit, offset } = getPagination(req.query);
    const { category, search } = req.query;

    const where = { projectId };
    if (category) where.category = category;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Document.findAndCountAll({
      where,
      include: [UPLOADED_BY_INCLUDE],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/documents/stats
exports.getDocumentStats = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const documents = await Document.findAll({
      where: { projectId },
      attributes: ["category"],
    });

    const stats = {
      total: documents.length,
      Contract: documents.filter((d) => d.category === "Contract").length,
      Drawing: documents.filter((d) => d.category === "Drawing").length,
      Report: documents.filter((d) => d.category === "Report").length,
      Specification: documents.filter((d) => d.category === "Specification")
        .length,
      Permit: documents.filter((d) => d.category === "Permit").length,
      Correspondence: documents.filter((d) => d.category === "Correspondence")
        .length,
    };

    return successResponse(res, { stats });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
// UPLOAD / CRUD
// ══════════════════════════════════════════════════════════════

// POST /api/projects/:projectId/documents  (multipart/form-data, field: "file")
exports.uploadDocument = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { category, reportType, drawingType, title, description, phaseId, status, submittedBy, submittedOn } = req.body;

    if (!req.file) return errorResponse(res, "File is required", 400);
    if (!category) return errorResponse(res, "Category is required", 400);
    if (!title) return errorResponse(res, "Title is required", 400);
    
    if (category === "Report" && !reportType) {
      fs.unlink(req.file.path, () => {});
      return errorResponse(
        res,
        "Report type is required for Report category",
        400,
      );
    }

    if (category === "Drawing" && !drawingType) {
      fs.unlink(req.file.path, () => {});
      return errorResponse(
        res,
        "Drawing type is required for Drawing category",
        400,
      );
    }

    const document = await Document.create({
      projectId,
      category,
      reportType: category === "Report" ? reportType : null,
      drawingType: category === "Drawing" ? drawingType : null,
      title,
      description,
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      version: "1.0",
      uploadedById: req.userId,
      phaseId: phaseId || null,
      status: status || "Completed",
      submittedBy: submittedBy || null,
      submittedOn: submittedOn || null,
    });

    const full = await Document.findByPk(document.id, {
      include: [UPLOADED_BY_INCLUDE],
    });
    return successResponse(res, { document: full }, "Document uploaded", 201);
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

// PUT /api/projects/:projectId/documents/:documentId
exports.updateDocument = async (req, res, next) => {
  try {
    const { projectId, documentId } = req.params;
    const document = await Document.findOne({
      where: { id: documentId, projectId },
    });
    if (!document) return errorResponse(res, "Document not found", 404);

    const { category, reportType, drawingType, title, description, phaseId, status, submittedBy, submittedOn } = req.body;
    if (category === "Report" && !reportType && !document.reportType) {
      return errorResponse(
        res,
        "Report type is required for Report category",
        400,
      );
    }

    if (category === "Drawing" && !drawingType && !document.drawingType) {
      return errorResponse(
        res,
        "Drawing type is required for Drawing category",
        400,
      );
    }

    await document.update({
      category: category ?? document.category,
      reportType:
        category === "Report" ? (reportType ?? document.reportType) : null,
      drawingType:
        category === "Drawing" ? (drawingType ?? document.drawingType) : null,
      title: title ?? document.title,
      description: description ?? document.description,
      phaseId: phaseId !== undefined ? (phaseId || null) : document.phaseId,
      status: status ?? document.status,
      submittedBy: submittedBy !== undefined ? (submittedBy || null) : document.submittedBy,
      submittedOn: submittedOn !== undefined ? (submittedOn || null) : document.submittedOn,
    });

    return successResponse(res, { document }, "Document updated");
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/documents/:documentId/version  (upload toleo jipya, multipart/form-data)
exports.uploadNewVersion = async (req, res, next) => {
  try {
    const { projectId, documentId } = req.params;
    const document = await Document.findOne({
      where: { id: documentId, projectId },
    });
    if (!document) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return errorResponse(res, "Document not found", 404);
    }
    if (!req.file) return errorResponse(res, "File is required", 400);

    // Hifadhi toleo la zamani kwenye historia
    await DocumentVersion.create({
      documentId: document.id,
      version: document.version,
      fileName: document.fileName,
      filePath: document.filePath,
      fileSize: document.fileSize,
      uploadedById: document.uploadedById,
    });

    const [major] = document.version.split(".");
    const newVersion = `${parseInt(major, 10) + 1}.0`;

    await document.update({
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      version: newVersion,
      uploadedById: req.userId,
    });

    return successResponse(
      res,
      { document },
      `New version (${newVersion}) uploaded`,
    );
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

// GET /api/projects/:projectId/documents/:documentId/versions
exports.listDocumentVersions = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const versions = await DocumentVersion.findAll({
      where: { documentId },
      include: [UPLOADED_BY_INCLUDE],
      order: [["createdAt", "DESC"]],
    });
    return successResponse(res, { versions });
  } catch (err) {
    next(err);
  }
};

const { MEDIA_DIR, UPLOADS_ROOT } = require("../config/uploadPaths");

// GET /api/projects/:projectId/documents/:documentId/download
exports.downloadDocument = async (req, res, next) => {
  try {
    const { projectId, documentId } = req.params;
    const { preview, inline, file, versionId } = req.query;

    const document = await Document.findOne({
      where: { id: documentId, projectId },
    });
    if (!document) return errorResponse(res, "Document not found", 404);

    let targetFile = document.filePath;
    let targetName = document.fileName;

    if (versionId) {
      const ver = await DocumentVersion.findOne({ where: { id: versionId, documentId } });
      if (ver) {
        targetFile = ver.filePath;
        targetName = ver.fileName;
      }
    } else if (file) {
      targetFile = file;
      targetName = path.basename(file);
    }

    let filePath = path.join(DOCUMENTS_DIR, targetFile);
    if (!fs.existsSync(filePath)) filePath = path.join(MEDIA_DIR, targetFile);
    if (!fs.existsSync(filePath)) filePath = path.join(UPLOADS_ROOT, targetFile);

    if (!fs.existsSync(filePath))
      return errorResponse(res, "File not found on server", 404);

    if (preview === "true" || inline === "true") {
      res.sendFile(filePath);
    } else {
      res.download(filePath, targetName);
    }
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/documents/:documentId
exports.deleteDocument = async (req, res, next) => {
  try {
    const { projectId, documentId } = req.params;
    const document = await Document.findOne({
      where: { id: documentId, projectId },
    });
    if (!document) return errorResponse(res, "Document not found", 404);

    const filePath = path.join(DOCUMENTS_DIR, document.filePath);
    if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});

    await document.destroy();
    return successResponse(res, null, "Document deleted");
  } catch (err) {
    next(err);
  }
};
