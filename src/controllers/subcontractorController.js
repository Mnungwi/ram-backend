const fs = require("fs");
const path = require("path");
const { DOCUMENTS_DIR } = require("../config/uploadPaths");
const { Subcontractor, SubcontractorDocument } = require("../models/subcontractor.model");
const { User } = require("../models/index");
const { successResponse, errorResponse, paginatedResponse, getPagination } = require("../utils/response");
const { Op } = require("sequelize");

const DOC_INCLUDE = {
  model: SubcontractorDocument,
  as: "documents",
  include: [{ model: User, as: "uploadedBy", attributes: ["id", "firstName", "lastName"] }],
};

// GET /api/projects/:projectId/subcontractors
exports.listSubcontractors = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page, limit, offset } = getPagination(req.query);
    const { search, status } = req.query;

    const where = { projectId };
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { companyName: { [Op.like]: `%${search}%` } },
        { contactPerson: { [Op.like]: `%${search}%` } },
        { tradeScope: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Subcontractor.findAndCountAll({
      where,
      include: [DOC_INCLUDE, { model: User, as: "createdBy", attributes: ["id", "firstName", "lastName"] }],
      order: [["createdAt", "DESC"], ["id", "ASC"]],
      limit,
      offset,
      distinct: true,
    });

    return paginatedResponse(res, rows, count, page, limit, "Subcontractors retrieved");
  } catch (err) {
    next(err);
  }
};

// GET /api/subcontractors/:id
exports.getSubcontractor = async (req, res, next) => {
  try {
    const sub = await Subcontractor.findByPk(req.params.id, {
      include: [DOC_INCLUDE, { model: User, as: "createdBy", attributes: ["id", "firstName", "lastName"] }],
    });
    if (!sub) return errorResponse(res, "Subcontractor not found", 404);
    return successResponse(res, { subcontractor: sub });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/subcontractors
exports.createSubcontractor = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { companyName, contactPerson, phone, email, address, tradeScope, contractValue, startDate, endDate, status, notes } = req.body;

    if (!companyName) return errorResponse(res, "Company name is required", 400);

    const sub = await Subcontractor.create({
      projectId,
      companyName,
      contactPerson: contactPerson || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      tradeScope: tradeScope || null,
      contractValue: contractValue || null,
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || "active",
      notes: notes || null,
      createdById: req.userId,
    });

    const full = await Subcontractor.findByPk(sub.id, { include: [DOC_INCLUDE] });
    return successResponse(res, { subcontractor: full }, "Subcontractor created", 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/subcontractors/:id
exports.updateSubcontractor = async (req, res, next) => {
  try {
    const sub = await Subcontractor.findByPk(req.params.id);
    if (!sub) return errorResponse(res, "Subcontractor not found", 404);

    const { companyName, contactPerson, phone, email, address, tradeScope, contractValue, startDate, endDate, status, notes } = req.body;
    await sub.update({
      companyName: companyName ?? sub.companyName,
      contactPerson: contactPerson ?? sub.contactPerson,
      phone: phone ?? sub.phone,
      email: email ?? sub.email,
      address: address ?? sub.address,
      tradeScope: tradeScope ?? sub.tradeScope,
      contractValue: contractValue ?? sub.contractValue,
      startDate: startDate ?? sub.startDate,
      endDate: endDate ?? sub.endDate,
      status: status ?? sub.status,
      notes: notes ?? sub.notes,
    });

    const full = await Subcontractor.findByPk(sub.id, { include: [DOC_INCLUDE] });
    return successResponse(res, { subcontractor: full }, "Subcontractor updated");
  } catch (err) {
    next(err);
  }
};

// DELETE /api/subcontractors/:id
exports.deleteSubcontractor = async (req, res, next) => {
  try {
    const sub = await Subcontractor.findByPk(req.params.id, { include: [DOC_INCLUDE] });
    if (!sub) return errorResponse(res, "Subcontractor not found", 404);

    // Clean up any uploaded document files on disk too, not just the DB rows.
    for (const doc of sub.documents || []) {
      const filePath = path.join(DOCUMENTS_DIR, doc.filePath);
      if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    }

    // Sequelize doesn't cascade deletes by default — remove the document
    // rows explicitly before (or after) the parent row.
    await SubcontractorDocument.destroy({ where: { subcontractorId: sub.id } });
    await sub.destroy();

    return successResponse(res, null, "Subcontractor deleted");
  } catch (err) {
    next(err);
  }
};

// POST /api/subcontractors/:id/documents  (multipart, field "file")
exports.uploadDocument = async (req, res, next) => {
  try {
    const sub = await Subcontractor.findByPk(req.params.id);
    if (!sub) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return errorResponse(res, "Subcontractor not found", 404);
    }
    if (!req.file) return errorResponse(res, "File is required", 400);

    const doc = await SubcontractorDocument.create({
      subcontractorId: sub.id,
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

// GET /api/subcontractors/documents/:docId/download
exports.downloadDocument = async (req, res, next) => {
  try {
    const doc = await SubcontractorDocument.findByPk(req.params.docId);
    if (!doc) return errorResponse(res, "Document not found", 404);

    const filePath = path.join(DOCUMENTS_DIR, doc.filePath);
    if (!fs.existsSync(filePath)) return errorResponse(res, "File missing on server", 404);

    res.download(filePath, doc.fileName);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/subcontractors/documents/:docId
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await SubcontractorDocument.findByPk(req.params.docId);
    if (!doc) return errorResponse(res, "Document not found", 404);

    const filePath = path.join(DOCUMENTS_DIR, doc.filePath);
    if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});

    await doc.destroy();
    return successResponse(res, null, "Document deleted");
  } catch (err) {
    next(err);
  }
};
