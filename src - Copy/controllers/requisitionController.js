const {
  Requisition,
  RequisitionItem,
  RequisitionComment,
} = require("../models/requisition.model");
const { User, Project } = require("../models/index");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPagination,
} = require("../utils/response");
const { audit } = require("../utils/audit");
const { Op } = require("sequelize");

// Common includes
const REQUISITION_INCLUDES = [
  {
    model: User,
    as: "requestedBy",
    attributes: ["id", "firstName", "lastName", "email", "jobTitle"],
  },
  {
    model: User,
    as: "reviewedBy",
    attributes: ["id", "firstName", "lastName"],
  },
  {
    model: User,
    as: "approvedBy",
    attributes: ["id", "firstName", "lastName"],
  },
  { model: User, as: "issuedBy", attributes: ["id", "firstName", "lastName"] },
  {
    model: User,
    as: "rejectedBy",
    attributes: ["id", "firstName", "lastName"],
  },
  { model: RequisitionItem, as: "items", order: [["serialNo", "ASC"]] },
];

// Auto-generate requisition number
const generateReqNo = async () => {
  const year = new Date().getFullYear();
  const count = await Requisition.count();
  return `RN-${year}-${String(count + 1).padStart(3, "0")}`;
};

// ── GET /api/projects/:projectId/requisitions ──────────────────────────────
exports.listRequisitions = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status, search } = req.query;
    const where = { projectId: req.params.projectId };
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { requisitionNo: { [Op.like]: `%${search}%` } },
        { siteLocation: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows } = await Requisition.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "requestedBy",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: RequisitionItem, as: "items" },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/projects/:projectId/requisitions/:reqId ──────────────────────
exports.getRequisition = async (req, res, next) => {
  try {
    const requisition = await Requisition.findOne({
      where: { id: req.params.reqId, projectId: req.params.projectId },
      include: [
        ...REQUISITION_INCLUDES,
        {
          model: RequisitionComment,
          as: "comments",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "firstName", "lastName", "avatar", "jobTitle"],
            },
          ],
          order: [["createdAt", "ASC"]],
        },
      ],
    });
    if (!requisition) return errorResponse(res, "Requisition not found", 404);
    return successResponse(res, { requisition });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/projects/:projectId/requisitions ─────────────────────────────
exports.createRequisition = async (req, res, next) => {
  try {
    const { siteLocation, date, designation, notes, items } = req.body;
    if (!items || items.length === 0)
      return errorResponse(res, "At least one item is required", 400);

    const requisitionNo = await generateReqNo();

    const requisition = await Requisition.create({
      requisitionNo,
      projectId: req.params.projectId,
      requestedById: req.userId,
      designation,
      siteLocation,
      date: date || new Date().toISOString().split("T")[0],
      notes,
      status: "draft",
    });

    await RequisitionItem.bulkCreate(
      items.map((item, idx) => ({
        requisitionId: requisition.id,
        serialNo: idx + 1,
        productId: item.productId || null,
        description: item.description,
        unit: item.unit || "",
        quantityOrdered: item.quantityOrdered,
        quantityIssued: 0,
        unitPrice: item.unitPrice || null,
        notes: item.notes || "",
      })),
    );

    await audit({
      userId: req.userId,
      action: "create_requisition",
      resource: "requisition",
      resourceId: requisition.id,
      req,
      projectId: req.params.projectId,
    });

    const full = await Requisition.findByPk(requisition.id, {
      include: REQUISITION_INCLUDES,
    });
    return successResponse(
      res,
      { requisition: full },
      "Requisition created",
      201,
    );
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/projects/:projectId/requisitions/:reqId ──────────────────────
exports.updateRequisition = async (req, res, next) => {
  try {
    const requisition = await Requisition.findOne({
      where: { id: req.params.reqId, projectId: req.params.projectId },
    });
    if (!requisition) return errorResponse(res, "Requisition not found", 404);
    if (!["draft", "rejected"].includes(requisition.status)) {
      return errorResponse(
        res,
        "Only draft or rejected requisitions can be edited",
        400,
      );
    }

    const { siteLocation, date, designation, notes, items } = req.body;
    await requisition.update({ siteLocation, date, designation, notes });

    if (items && items.length > 0) {
      await RequisitionItem.destroy({
        where: { requisitionId: requisition.id },
      });
      await RequisitionItem.bulkCreate(
        items.map((item, idx) => ({
          requisitionId: requisition.id,
          serialNo: idx + 1,
          productId: item.productId || null,
          description: item.description,
          unit: item.unit || "",
          quantityOrdered: item.quantityOrdered,
          quantityIssued: item.quantityIssued || 0,
          unitPrice: item.unitPrice || null,
          notes: item.notes || "",
        })),
      );
    }

    const full = await Requisition.findByPk(requisition.id, {
      include: REQUISITION_INCLUDES,
    });
    return successResponse(res, { requisition: full }, "Requisition updated");
  } catch (err) {
    next(err);
  }
};

// ── POST .../submit ────────────────────────────────────────────────────────
exports.submitRequisition = async (req, res, next) => {
  try {
    const requisition = await Requisition.findOne({
      where: { id: req.params.reqId, projectId: req.params.projectId },
    });
    if (!requisition) return errorResponse(res, "Requisition not found", 404);
    if (requisition.status !== "draft")
      return errorResponse(
        res,
        "Only draft requisitions can be submitted",
        400,
      );
    await requisition.update({ status: "submitted", submittedAt: new Date() });
    await RequisitionComment.create({
      requisitionId: requisition.id,
      userId: req.userId,
      step: "submitted",
      comment: req.body.comment || "Requisition submitted for review.",
      isInternal: false,
    });
    await audit({
      userId: req.userId,
      action: "submit_requisition",
      resource: "requisition",
      resourceId: requisition.id,
      req,
    });
    return successResponse(res, { requisition }, "Requisition submitted");
  } catch (err) {
    next(err);
  }
};

// ── POST .../review ────────────────────────────────────────────────────────
exports.reviewRequisition = async (req, res, next) => {
  try {
    const requisition = await Requisition.findOne({
      where: { id: req.params.reqId, projectId: req.params.projectId },
    });
    if (!requisition) return errorResponse(res, "Requisition not found", 404);
    if (requisition.status !== "submitted")
      return errorResponse(
        res,
        "Only submitted requisitions can be reviewed",
        400,
      );
    await requisition.update({
      status: "reviewed",
      reviewedAt: new Date(),
      reviewedById: req.userId,
    });
    await RequisitionComment.create({
      requisitionId: requisition.id,
      userId: req.userId,
      step: "reviewed",
      comment: req.body.comment || "Requisition reviewed.",
      isInternal: false,
    });
    await audit({
      userId: req.userId,
      action: "review_requisition",
      resource: "requisition",
      resourceId: requisition.id,
      req,
    });
    return successResponse(res, { requisition }, "Requisition reviewed");
  } catch (err) {
    next(err);
  }
};

// ── POST .../approve ───────────────────────────────────────────────────────
exports.approveRequisition = async (req, res, next) => {
  try {
    const requisition = await Requisition.findOne({
      where: { id: req.params.reqId, projectId: req.params.projectId },
    });
    if (!requisition) return errorResponse(res, "Requisition not found", 404);
    if (requisition.status !== "reviewed")
      return errorResponse(
        res,
        "Only reviewed requisitions can be approved",
        400,
      );
    await requisition.update({
      status: "approved",
      approvedAt: new Date(),
      approvedById: req.userId,
    });
    await RequisitionComment.create({
      requisitionId: requisition.id,
      userId: req.userId,
      step: "approved",
      comment: req.body.comment || "Requisition approved.",
      isInternal: false,
    });
    await audit({
      userId: req.userId,
      action: "approve_requisition",
      resource: "requisition",
      resourceId: requisition.id,
      req,
    });
    return successResponse(res, { requisition }, "Requisition approved");
  } catch (err) {
    next(err);
  }
};

// ── POST .../issue ─────────────────────────────────────────────────────────
exports.issueRequisition = async (req, res, next) => {
  try {
    const requisition = await Requisition.findOne({
      where: { id: req.params.reqId, projectId: req.params.projectId },
      include: [{ model: RequisitionItem, as: "items" }],
    });
    if (!requisition) return errorResponse(res, "Requisition not found", 404);
    if (requisition.status !== "approved")
      return errorResponse(
        res,
        "Only approved requisitions can be issued",
        400,
      );

    const { issuedItems, comment } = req.body;
    if (issuedItems && issuedItems.length > 0) {
      for (const issued of issuedItems) {
        await RequisitionItem.update(
          { quantityIssued: issued.quantityIssued },
          { where: { id: issued.id, requisitionId: requisition.id } },
        );
      }
    }

    await requisition.update({
      status: "issued",
      issuedAt: new Date(),
      issuedById: req.userId,
    });
    await RequisitionComment.create({
      requisitionId: requisition.id,
      userId: req.userId,
      step: "issued",
      comment: comment || "Goods issued from store.",
      isInternal: false,
    });
    await audit({
      userId: req.userId,
      action: "issue_requisition",
      resource: "requisition",
      resourceId: requisition.id,
      req,
    });
    return successResponse(res, { requisition }, "Requisition issued");
  } catch (err) {
    next(err);
  }
};

// ── POST .../reject ────────────────────────────────────────────────────────
exports.rejectRequisition = async (req, res, next) => {
  try {
    const requisition = await Requisition.findOne({
      where: { id: req.params.reqId, projectId: req.params.projectId },
    });
    if (!requisition) return errorResponse(res, "Requisition not found", 404);
    if (["issued", "cancelled"].includes(requisition.status))
      return errorResponse(res, "Cannot reject this requisition", 400);
    if (!req.body.reason)
      return errorResponse(res, "Rejection reason is required", 400);
    await requisition.update({
      status: "rejected",
      rejectedAt: new Date(),
      rejectedById: req.userId,
      rejectionReason: req.body.reason,
    });
    await RequisitionComment.create({
      requisitionId: requisition.id,
      userId: req.userId,
      step: "rejected",
      comment: `Rejected: ${req.body.reason}`,
      isInternal: false,
    });
    await audit({
      userId: req.userId,
      action: "reject_requisition",
      resource: "requisition",
      resourceId: requisition.id,
      req,
    });
    return successResponse(res, { requisition }, "Requisition rejected");
  } catch (err) {
    next(err);
  }
};

// ── POST .../cancel ────────────────────────────────────────────────────────
exports.cancelRequisition = async (req, res, next) => {
  try {
    const requisition = await Requisition.findOne({
      where: { id: req.params.reqId, projectId: req.params.projectId },
    });
    if (!requisition) return errorResponse(res, "Requisition not found", 404);
    if (["issued", "cancelled"].includes(requisition.status))
      return errorResponse(res, "Cannot cancel this requisition", 400);
    await requisition.update({ status: "cancelled" });
    await RequisitionComment.create({
      requisitionId: requisition.id,
      userId: req.userId,
      step: "cancelled",
      comment: req.body.reason || "Requisition cancelled.",
      isInternal: false,
    });
    return successResponse(res, { requisition }, "Requisition cancelled");
  } catch (err) {
    next(err);
  }
};

// ── POST .../comments ──────────────────────────────────────────────────────
exports.addComment = async (req, res, next) => {
  try {
    const requisition = await Requisition.findOne({
      where: { id: req.params.reqId, projectId: req.params.projectId },
    });
    if (!requisition) return errorResponse(res, "Requisition not found", 404);
    if (!req.body.comment)
      return errorResponse(res, "Comment is required", 400);
    const comment = await RequisitionComment.create({
      requisitionId: requisition.id,
      userId: req.userId,
      step: requisition.status,
      comment: req.body.comment,
      isInternal: req.body.isInternal || false,
    });
    const full = await RequisitionComment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "avatar", "jobTitle"],
        },
      ],
    });
    return successResponse(res, { comment: full }, "Comment added", 201);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/projects/:projectId/requisitions/:reqId ───────────────────
exports.deleteRequisition = async (req, res, next) => {
  try {
    const requisition = await Requisition.findOne({
      where: { id: req.params.reqId, projectId: req.params.projectId },
    });
    if (!requisition) return errorResponse(res, "Requisition not found", 404);
    if (!["draft", "rejected", "cancelled"].includes(requisition.status))
      return errorResponse(
        res,
        "Only draft, rejected, or cancelled requisitions can be deleted",
        400,
      );
    await RequisitionItem.destroy({ where: { requisitionId: requisition.id } });
    await RequisitionComment.destroy({
      where: { requisitionId: requisition.id },
    });
    await requisition.destroy();
    return successResponse(res, null, "Requisition deleted");
  } catch (err) {
    next(err);
  }
};

// const { Requisition, RequisitionItem, RequisitionComment } = require('../models/requisition.model');
// const { User, Project } = require('../models/index');
// const { successResponse, errorResponse, paginatedResponse, getPagination } = require('../utils/response');
// const { audit } = require('../utils/audit');
// const { Op } = require('sequelize');

// // Sync tables
// const syncTables = async () => {
//   await Requisition.sync({ alter: true });
//   await RequisitionItem.sync({ alter: true });
//   await RequisitionComment.sync({ alter: true });
// };

// // Common includes
// const REQUISITION_INCLUDES = [
//   { model: User, as: 'requestedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'jobTitle'] },
//   { model: User, as: 'reviewedBy',  attributes: ['id', 'firstName', 'lastName'] },
//   { model: User, as: 'approvedBy',  attributes: ['id', 'firstName', 'lastName'] },
//   { model: User, as: 'issuedBy',    attributes: ['id', 'firstName', 'lastName'] },
//   { model: User, as: 'rejectedBy',  attributes: ['id', 'firstName', 'lastName'] },
//   { model: RequisitionItem, as: 'items', order: [['serialNo', 'ASC']] },
// ];

// // Auto-generate requisition number
// const generateReqNo = async () => {
//   const year = new Date().getFullYear();
//   const count = await Requisition.count();
//   return `RN-${year}-${String(count + 1).padStart(3, '0')}`;
// };

// // ── GET /api/projects/:projectId/requisitions ──────────────────────────────
// exports.listRequisitions = async (req, res, next) => {
//   try {
//     await syncTables();
//     const { page, limit, offset } = getPagination(req.query);
//     const { status, search } = req.query;
//     const where = { projectId: req.params.projectId };
//     if (status) where.status = status;
//     if (search) {
//       where[Op.or] = [
//         { requisitionNo:  { [Op.like]: `%${search}%` } },
//         { siteLocation:   { [Op.like]: `%${search}%` } },
//       ];
//     }
//     const { count, rows } = await Requisition.findAndCountAll({
//       where,
//       include: [
//         { model: User, as: 'requestedBy', attributes: ['id', 'firstName', 'lastName'] },
//         { model: RequisitionItem, as: 'items' },
//       ],
//       order: [['createdAt', 'DESC']],
//       limit, offset,
//     });
//     return paginatedResponse(res, rows, count, page, limit);
//   } catch (err) { next(err); }
// };

// // ── GET /api/projects/:projectId/requisitions/:reqId ──────────────────────
// exports.getRequisition = async (req, res, next) => {
//   try {
//     await syncTables();
//     const req_ = await Requisition.findOne({
//       where: { id: req.params.reqId, projectId: req.params.projectId },
//       include: [
//         ...REQUISITION_INCLUDES,
//         {
//           model: RequisitionComment, as: 'comments',
//           include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar', 'jobTitle'] }],
//           order: [['createdAt', 'ASC']],
//         },
//       ],
//     });
//     if (!req_) return errorResponse(res, 'Requisition not found', 404);
//     return successResponse(res, { requisition: req_ });
//   } catch (err) { next(err); }
// };

// // ── POST /api/projects/:projectId/requisitions ─────────────────────────────
// exports.createRequisition = async (req, res, next) => {
//   try {
//     await syncTables();
//     const { siteLocation, date, designation, notes, items } = req.body;
//     if (!items || items.length === 0) return errorResponse(res, 'At least one item is required', 400);

//     const requisitionNo = await generateReqNo();

//     const requisition = await Requisition.create({
//       requisitionNo,
//       projectId:     req.params.projectId,
//       requestedById: req.userId,
//       designation,
//       siteLocation,
//       date:          date || new Date().toISOString().split('T')[0],
//       notes,
//       status:        'draft',
//     });

//     // Create items
//     await RequisitionItem.bulkCreate(
//       items.map((item, idx) => ({
//         requisitionId:   requisition.id,
//         serialNo:        idx + 1,
//         description:     item.description,
//         unit:            item.unit || '',
//         quantityOrdered: item.quantityOrdered,
//         quantityIssued:  0,
//         unitPrice:       item.unitPrice || null,
//         notes:           item.notes || '',
//       }))
//     );

//     await audit({ userId: req.userId, action: 'create_requisition', resource: 'requisition', resourceId: requisition.id, req, projectId: req.params.projectId });

//     const full = await Requisition.findByPk(requisition.id, { include: REQUISITION_INCLUDES });
//     return successResponse(res, { requisition: full }, 'Requisition created', 201);
//   } catch (err) { next(err); }
// };

// // ── PUT /api/projects/:projectId/requisitions/:reqId ──────────────────────
// exports.updateRequisition = async (req, res, next) => {
//   try {
//     const requisition = await Requisition.findOne({
//       where: { id: req.params.reqId, projectId: req.params.projectId }
//     });
//     if (!requisition) return errorResponse(res, 'Requisition not found', 404);
//     if (!['draft', 'rejected'].includes(requisition.status)) {
//       return errorResponse(res, 'Only draft or rejected requisitions can be edited', 400);
//     }

//     const { siteLocation, date, designation, notes, items } = req.body;
//     await requisition.update({ siteLocation, date, designation, notes });

//     // Replace items
//     if (items && items.length > 0) {
//       await RequisitionItem.destroy({ where: { requisitionId: requisition.id } });
//       await RequisitionItem.bulkCreate(
//         items.map((item, idx) => ({
//           requisitionId:   requisition.id,
//           serialNo:        idx + 1,
//           description:     item.description,
//           unit:            item.unit || '',
//           quantityOrdered: item.quantityOrdered,
//           quantityIssued:  item.quantityIssued || 0,
//           unitPrice:       item.unitPrice || null,
//           notes:           item.notes || '',
//         }))
//       );
//     }

//     const full = await Requisition.findByPk(requisition.id, { include: REQUISITION_INCLUDES });
//     return successResponse(res, { requisition: full }, 'Requisition updated');
//   } catch (err) { next(err); }
// };

// // ── POST /api/projects/:projectId/requisitions/:reqId/submit ──────────────
// exports.submitRequisition = async (req, res, next) => {
//   try {
//     const requisition = await Requisition.findOne({
//       where: { id: req.params.reqId, projectId: req.params.projectId }
//     });
//     if (!requisition) return errorResponse(res, 'Requisition not found', 404);
//     if (requisition.status !== 'draft') return errorResponse(res, 'Only draft requisitions can be submitted', 400);

//     await requisition.update({ status: 'submitted', submittedAt: new Date() });

//     // Add automatic comment
//     await RequisitionComment.create({
//       requisitionId: requisition.id,
//       userId: req.userId,
//       step: 'submitted',
//       comment: req.body.comment || 'Requisition submitted for review.',
//       isInternal: false,
//     });

//     await audit({ userId: req.userId, action: 'submit_requisition', resource: 'requisition', resourceId: requisition.id, req });
//     return successResponse(res, { requisition }, 'Requisition submitted');
//   } catch (err) { next(err); }
// };

// // ── POST /api/projects/:projectId/requisitions/:reqId/review ──────────────
// exports.reviewRequisition = async (req, res, next) => {
//   try {
//     const requisition = await Requisition.findOne({
//       where: { id: req.params.reqId, projectId: req.params.projectId }
//     });
//     if (!requisition) return errorResponse(res, 'Requisition not found', 404);
//     if (requisition.status !== 'submitted') return errorResponse(res, 'Only submitted requisitions can be reviewed', 400);

//     await requisition.update({ status: 'reviewed', reviewedAt: new Date(), reviewedById: req.userId });

//     await RequisitionComment.create({
//       requisitionId: requisition.id,
//       userId: req.userId,
//       step: 'reviewed',
//       comment: req.body.comment || 'Requisition reviewed by Procurement Officer.',
//       isInternal: false,
//     });

//     await audit({ userId: req.userId, action: 'review_requisition', resource: 'requisition', resourceId: requisition.id, req });
//     return successResponse(res, { requisition }, 'Requisition reviewed');
//   } catch (err) { next(err); }
// };

// // ── POST /api/projects/:projectId/requisitions/:reqId/approve ─────────────
// exports.approveRequisition = async (req, res, next) => {
//   try {
//     const requisition = await Requisition.findOne({
//       where: { id: req.params.reqId, projectId: req.params.projectId }
//     });
//     if (!requisition) return errorResponse(res, 'Requisition not found', 404);
//     if (requisition.status !== 'reviewed') return errorResponse(res, 'Only reviewed requisitions can be approved', 400);

//     await requisition.update({ status: 'approved', approvedAt: new Date(), approvedById: req.userId });

//     await RequisitionComment.create({
//       requisitionId: requisition.id,
//       userId: req.userId,
//       step: 'approved',
//       comment: req.body.comment || 'Requisition approved.',
//       isInternal: false,
//     });

//     await audit({ userId: req.userId, action: 'approve_requisition', resource: 'requisition', resourceId: requisition.id, req });
//     return successResponse(res, { requisition }, 'Requisition approved');
//   } catch (err) { next(err); }
// };

// // ── POST /api/projects/:projectId/requisitions/:reqId/issue ───────────────
// exports.issueRequisition = async (req, res, next) => {
//   try {
//     const requisition = await Requisition.findOne({
//       where: { id: req.params.reqId, projectId: req.params.projectId },
//       include: [{ model: RequisitionItem, as: 'items' }],
//     });
//     if (!requisition) return errorResponse(res, 'Requisition not found', 404);
//     if (requisition.status !== 'approved') return errorResponse(res, 'Only approved requisitions can be issued', 400);

//     // Update quantity issued per item
//     const { issuedItems, comment } = req.body;
//     if (issuedItems && issuedItems.length > 0) {
//       for (const issued of issuedItems) {
//         await RequisitionItem.update(
//           { quantityIssued: issued.quantityIssued },
//           { where: { id: issued.id, requisitionId: requisition.id } }
//         );
//       }
//     }

//     await requisition.update({ status: 'issued', issuedAt: new Date(), issuedById: req.userId });

//     await RequisitionComment.create({
//       requisitionId: requisition.id,
//       userId: req.userId,
//       step: 'issued',
//       comment: comment || 'Goods issued from store.',
//       isInternal: false,
//     });

//     await audit({ userId: req.userId, action: 'issue_requisition', resource: 'requisition', resourceId: requisition.id, req });
//     return successResponse(res, { requisition }, 'Requisition issued');
//   } catch (err) { next(err); }
// };

// // ── POST /api/projects/:projectId/requisitions/:reqId/reject ──────────────
// exports.rejectRequisition = async (req, res, next) => {
//   try {
//     const requisition = await Requisition.findOne({
//       where: { id: req.params.reqId, projectId: req.params.projectId }
//     });
//     if (!requisition) return errorResponse(res, 'Requisition not found', 404);
//     if (['issued', 'cancelled'].includes(requisition.status)) {
//       return errorResponse(res, 'Cannot reject an issued or cancelled requisition', 400);
//     }
//     if (!req.body.reason) return errorResponse(res, 'Rejection reason is required', 400);

//     await requisition.update({
//       status: 'rejected',
//       rejectedAt: new Date(),
//       rejectedById: req.userId,
//       rejectionReason: req.body.reason,
//     });

//     await RequisitionComment.create({
//       requisitionId: requisition.id,
//       userId: req.userId,
//       step: 'rejected',
//       comment: `Rejected: ${req.body.reason}`,
//       isInternal: false,
//     });

//     await audit({ userId: req.userId, action: 'reject_requisition', resource: 'requisition', resourceId: requisition.id, req });
//     return successResponse(res, { requisition }, 'Requisition rejected');
//   } catch (err) { next(err); }
// };

// // ── POST /api/projects/:projectId/requisitions/:reqId/cancel ──────────────
// exports.cancelRequisition = async (req, res, next) => {
//   try {
//     const requisition = await Requisition.findOne({
//       where: { id: req.params.reqId, projectId: req.params.projectId }
//     });
//     if (!requisition) return errorResponse(res, 'Requisition not found', 404);
//     if (['issued', 'cancelled'].includes(requisition.status)) {
//       return errorResponse(res, 'Cannot cancel an issued or already cancelled requisition', 400);
//     }

//     await requisition.update({ status: 'cancelled' });

//     await RequisitionComment.create({
//       requisitionId: requisition.id,
//       userId: req.userId,
//       step: 'cancelled',
//       comment: req.body.reason || 'Requisition cancelled.',
//       isInternal: false,
//     });

//     return successResponse(res, { requisition }, 'Requisition cancelled');
//   } catch (err) { next(err); }
// };

// // ── POST /api/projects/:projectId/requisitions/:reqId/comments ────────────
// exports.addComment = async (req, res, next) => {
//   try {
//     await syncTables();
//     const requisition = await Requisition.findOne({
//       where: { id: req.params.reqId, projectId: req.params.projectId }
//     });
//     if (!requisition) return errorResponse(res, 'Requisition not found', 404);
//     if (!req.body.comment) return errorResponse(res, 'Comment is required', 400);

//     const comment = await RequisitionComment.create({
//       requisitionId: requisition.id,
//       userId: req.userId,
//       step: requisition.status,
//       comment: req.body.comment,
//       isInternal: req.body.isInternal || false,
//     });

//     const full = await RequisitionComment.findByPk(comment.id, {
//       include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar', 'jobTitle'] }],
//     });

//     return successResponse(res, { comment: full }, 'Comment added', 201);
//   } catch (err) { next(err); }
// };

// // ── DELETE /api/projects/:projectId/requisitions/:reqId ───────────────────
// exports.deleteRequisition = async (req, res, next) => {
//   try {
//     const requisition = await Requisition.findOne({
//       where: { id: req.params.reqId, projectId: req.params.projectId }
//     });
//     if (!requisition) return errorResponse(res, 'Requisition not found', 404);
//     if (!['draft', 'rejected', 'cancelled'].includes(requisition.status)) {
//       return errorResponse(res, 'Only draft, rejected, or cancelled requisitions can be deleted', 400);
//     }

//     await RequisitionItem.destroy({ where: { requisitionId: requisition.id } });
//     await RequisitionComment.destroy({ where: { requisitionId: requisition.id } });
//     await requisition.destroy();

//     return successResponse(res, null, 'Requisition deleted');
//   } catch (err) { next(err); }
// };
