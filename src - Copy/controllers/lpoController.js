const { LocalPurchaseOrder, LPOItem, LPOComment } = require('../models/lpo.model');
const { Requisition, RequisitionItem } = require('../models/requisition.model');
const { User, Supplier, Project } = require('../models/index');
const { successResponse, errorResponse, paginatedResponse, getPagination } = require('../utils/response');
const { audit } = require('../utils/audit');
const { Op } = require('sequelize');

// Common includes
const LPO_INCLUDES = [
  {
    model: User,
    as: "preparedBy",
    attributes: ["id", "firstName", "lastName", "jobTitle"],
  },
  {
    model: User,
    as: "approvedBy",
    attributes: ["id", "firstName", "lastName"],
  },
  {
    model: Supplier,
    as: "supplier",
    attributes: ["id", "name", "email", "phone", "address", "taxNumber"],
  },
  { model: LPOItem, as: "items", order: [["serialNo", "ASC"]] },
  {
    model: Requisition,
    as: "requisition",
    attributes: ["id", "requisitionNo", "siteLocation", "status"],
    required: false,
  },
];

// Auto-generate LPO number
const generateLPONo = async () => {
  const year = new Date().getFullYear();
  const count = await LocalPurchaseOrder.count();
  return `LPO-${year}-${String(count + 1).padStart(3, '0')}`;
};

// Calculate totals
const calculateTotals = (items, taxRate = 18) => {
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax;
  return { subtotal, tax, total };
};

// ── GET /api/projects/:projectId/lpos ─────────────────────────────────────
exports.listLPOs = async (req, res, next) => {
  try {
    
    const { page, limit, offset } = getPagination(req.query);
    const { status, search, supplierId } = req.query;
    const where = { projectId: req.params.projectId };
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (search) {
      where[Op.or] = [
        { lpoNo: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows } = await LocalPurchaseOrder.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "preparedBy",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: Supplier, as: "supplier", attributes: ["id", "name"] },
        { model: LPOItem, as: "items" },
        {
          model: Requisition,
          as: "requisition",
          required: false,
          attributes: ["id", "requisitionNo"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

// ── GET /api/projects/:projectId/lpos/:lpoId ──────────────────────────────
exports.getLPO = async (req, res, next) => {
  try {
   
    const lpo = await LocalPurchaseOrder.findOne({
      where: { id: req.params.lpoId, projectId: req.params.projectId },
      include: [
        ...LPO_INCLUDES,
        {
          model: LPOComment, as: 'comments',
          include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar', 'jobTitle'] }],
          order: [['createdAt', 'ASC']],
        },
      ],
    });
    if (!lpo) return errorResponse(res, 'LPO not found', 404);
    return successResponse(res, { lpo });
  } catch (err) { next(err); }
};

// ── POST /api/projects/:projectId/lpos ────────────────────────────────────
// Can be created from scratch OR from a Requisition
exports.createLPO = async (req, res, next) => {
  try {
    
    const {
      supplierId, requisitionId, date, deliveryDate,
      deliveryAddress, currency, taxRate, paymentTerms, notes, items,
    } = req.body;

    if (!supplierId)        return errorResponse(res, 'supplierId is required', 400);
    if (!items?.length)     return errorResponse(res, 'At least one item is required', 400);

    // Validate supplier
    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) return errorResponse(res, 'Supplier not found', 404);

    // Validate requisition if provided
    if (requisitionId) {
      const rn = await Requisition.findOne({ where: { id: requisitionId, projectId: req.params.projectId } });
      if (!rn) return errorResponse(res, 'Requisition not found in this project', 404);
    }

    // Calculate items amounts
    const itemsWithAmount = items.map((item, idx) => ({
      serialNo:         idx + 1,
      
      description:      item.description,
      unit:             item.unit || '',
      quantity:         parseFloat(item.quantity),
      unitPrice:        parseFloat(item.unitPrice),
      amount:           parseFloat(item.quantity) * parseFloat(item.unitPrice),
      quantityReceived: 0,
      requisitionItemId: item.requisitionItemId || null,
      notes:            item.notes || '',
    }));

    const { subtotal, tax, total } = calculateTotals(itemsWithAmount, taxRate || 18);
    const lpoNo = await generateLPONo();

    const lpo = await LocalPurchaseOrder.create({
      lpoNo,
      projectId:      req.params.projectId,
      supplierId,
      requisitionId:  requisitionId || null,
      preparedById:   req.userId,
      date:           date || new Date().toISOString().split('T')[0],
      deliveryDate,
      deliveryAddress,
      currency:       currency || 'TZS',
      taxRate:        taxRate || 18,
      subtotal, tax, total,
      paymentTerms,
      notes,
      status: 'draft',
    });

    await LPOItem.bulkCreate(itemsWithAmount.map(item => ({ ...item, lpoId: lpo.id })));

    await audit({ userId: req.userId, action: 'create_lpo', resource: 'lpo', resourceId: lpo.id, req, projectId: req.params.projectId });

    const full = await LocalPurchaseOrder.findByPk(lpo.id, { include: LPO_INCLUDES });
    return successResponse(res, { lpo: full }, 'LPO created', 201);
  } catch (err) { next(err); }
};

// ── POST /api/projects/:projectId/lpos/from-requisition/:reqId ────────────
// Create LPO directly from a Requisition (auto-populate items)
exports.createFromRequisition = async (req, res, next) => {
  try {
   
    const rn = await Requisition.findOne({
      where: { id: req.params.reqId, projectId: req.params.projectId },
      include: [{ model: RequisitionItem, as: 'items' }],
    });
    if (!rn) return errorResponse(res, 'Requisition not found', 404);
    if (!['submitted', 'reviewed', 'approved'].includes(rn.status)) {
      return errorResponse(res, 'Requisition must be submitted or reviewed to create LPO', 400);
    }

    const { supplierId, unitPrices, deliveryDate, deliveryAddress, taxRate, paymentTerms, notes } = req.body;
    if (!supplierId) return errorResponse(res, 'supplierId is required', 400);

    // unitPrices = { [requisitionItemId]: price }
    const prices = unitPrices || {};

    const itemsWithAmount = rn.items.map((item, idx) => {
      const unitPrice = parseFloat(prices[item.id] || 0);
      return {
        serialNo: idx + 1,
        productId: item.productId || null,
        description: item.description,
        unit: item.unit,
        quantity: parseFloat(item.quantityOrdered),
        unitPrice,
        amount: parseFloat(item.quantityOrdered) * unitPrice,
        quantityReceived: 0,
        requisitionItemId: item.id,
        notes: item.notes || "",
      };
    });

    const { subtotal, tax, total } = calculateTotals(itemsWithAmount, taxRate || 18);
    const lpoNo = await generateLPONo();

    const lpo = await LocalPurchaseOrder.create({
      lpoNo,
      projectId:      req.params.projectId,
      supplierId,
      requisitionId:  rn.id,
      preparedById:   req.userId,
      date:           new Date().toISOString().split('T')[0],
      deliveryDate,
      deliveryAddress: deliveryAddress || rn.siteLocation,
      currency:       'TZS',
      taxRate:        taxRate || 18,
      subtotal, tax, total,
      paymentTerms,
      notes,
      status: 'draft',
    });

    await LPOItem.bulkCreate(itemsWithAmount.map(item => ({ ...item, lpoId: lpo.id })));

    await LPOComment.create({
      lpoId: lpo.id, userId: req.userId, step: 'created',
      comment: `LPO created from Requisition ${rn.requisitionNo}`,
    });

    await audit({ userId: req.userId, action: 'create_lpo_from_rn', resource: 'lpo', resourceId: lpo.id, req, projectId: req.params.projectId });

    const full = await LocalPurchaseOrder.findByPk(lpo.id, { include: LPO_INCLUDES });
    return successResponse(res, { lpo: full }, `LPO created from ${rn.requisitionNo}`, 201);
  } catch (err) { next(err); }
};

// ── PUT /api/projects/:projectId/lpos/:lpoId ──────────────────────────────
exports.updateLPO = async (req, res, next) => {
  try {
    const lpo = await LocalPurchaseOrder.findOne({
      where: { id: req.params.lpoId, projectId: req.params.projectId }
    });
    if (!lpo) return errorResponse(res, 'LPO not found', 404);
    if (!['draft'].includes(lpo.status)) return errorResponse(res, 'Only draft LPOs can be edited', 400);

    const { items, taxRate, ...rest } = req.body;

    if (items?.length) {
      const itemsWithAmount = items.map((item, idx) => ({
        lpoId: lpo.id,
        serialNo: idx + 1,
        productId: item.productId || null,
        description: item.description,
        unit: item.unit || "",
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        amount: parseFloat(item.quantity) * parseFloat(item.unitPrice),
        quantityReceived: item.quantityReceived || 0,
        requisitionItemId: item.requisitionItemId || null,
        notes: item.notes || "",
      }));
      const { subtotal, tax, total } = calculateTotals(itemsWithAmount, taxRate || lpo.taxRate);
      await LPOItem.destroy({ where: { lpoId: lpo.id } });
      await LPOItem.bulkCreate(itemsWithAmount);
      await lpo.update({ ...rest, taxRate: taxRate || lpo.taxRate, subtotal, tax, total });
    } else {
      await lpo.update(rest);
    }

    const full = await LocalPurchaseOrder.findByPk(lpo.id, { include: LPO_INCLUDES });
    return successResponse(res, { lpo: full }, 'LPO updated');
  } catch (err) { next(err); }
};

// ── POST .../submit ────────────────────────────────────────────────────────
exports.submitLPO = async (req, res, next) => {
  try {
    const lpo = await LocalPurchaseOrder.findOne({ where: { id: req.params.lpoId, projectId: req.params.projectId } });
    if (!lpo) return errorResponse(res, 'LPO not found', 404);
    if (lpo.status !== 'draft') return errorResponse(res, 'Only draft LPOs can be submitted', 400);
    await lpo.update({ status: 'submitted', submittedAt: new Date() });
    await LPOComment.create({ lpoId: lpo.id, userId: req.userId, step: 'submitted', comment: req.body.comment || 'LPO submitted for approval.' });
    await audit({ userId: req.userId, action: 'submit_lpo', resource: 'lpo', resourceId: lpo.id, req });
    return successResponse(res, { lpo }, 'LPO submitted');
  } catch (err) { next(err); }
};

// ── POST .../approve ───────────────────────────────────────────────────────
exports.approveLPO = async (req, res, next) => {
  try {
    const lpo = await LocalPurchaseOrder.findOne({ where: { id: req.params.lpoId, projectId: req.params.projectId } });
    if (!lpo) return errorResponse(res, 'LPO not found', 404);
    if (lpo.status !== 'submitted') return errorResponse(res, 'Only submitted LPOs can be approved', 400);
    await lpo.update({ status: 'approved', approvedAt: new Date(), approvedById: req.userId });
    await LPOComment.create({ lpoId: lpo.id, userId: req.userId, step: 'approved', comment: req.body.comment || 'LPO approved.' });
    await audit({ userId: req.userId, action: 'approve_lpo', resource: 'lpo', resourceId: lpo.id, req });
    return successResponse(res, { lpo }, 'LPO approved');
  } catch (err) { next(err); }
};

// ── POST .../send ──────────────────────────────────────────────────────────
exports.sendLPO = async (req, res, next) => {
  try {
    const lpo = await LocalPurchaseOrder.findOne({ where: { id: req.params.lpoId, projectId: req.params.projectId } });
    if (!lpo) return errorResponse(res, 'LPO not found', 404);
    if (lpo.status !== 'approved') return errorResponse(res, 'Only approved LPOs can be sent to supplier', 400);
    await lpo.update({ status: 'sent', sentAt: new Date() });
    await LPOComment.create({ lpoId: lpo.id, userId: req.userId, step: 'sent', comment: req.body.comment || 'LPO sent to supplier.' });
    await audit({ userId: req.userId, action: 'send_lpo', resource: 'lpo', resourceId: lpo.id, req });
    return successResponse(res, { lpo }, 'LPO sent to supplier');
  } catch (err) { next(err); }
};

// ── POST .../receive ───────────────────────────────────────────────────────
exports.receiveLPO = async (req, res, next) => {
  try {
    const lpo = await LocalPurchaseOrder.findOne({
      where: { id: req.params.lpoId, projectId: req.params.projectId },
      include: [{ model: LPOItem, as: 'items' }],
    });
    if (!lpo) return errorResponse(res, 'LPO not found', 404);
    if (!['sent', 'partial'].includes(lpo.status)) return errorResponse(res, 'LPO must be sent before receiving', 400);

    const { receivedItems, comment } = req.body;

    // Update quantities received per item
    if (receivedItems?.length) {
      for (const ri of receivedItems) {
        await LPOItem.update(
          { quantityReceived: ri.quantityReceived },
          { where: { id: ri.id, lpoId: lpo.id } }
        );
      }
    }

    // Check if all items fully received
    const updatedItems = await LPOItem.findAll({ where: { lpoId: lpo.id } });
    const allReceived = updatedItems.every(i => parseFloat(i.quantityReceived) >= parseFloat(i.quantity));
    const newStatus = allReceived ? 'received' : 'partial';

    await lpo.update({ status: newStatus, receivedAt: allReceived ? new Date() : null });
    await LPOComment.create({
      lpoId: lpo.id, userId: req.userId, step: newStatus,
      comment: comment || (allReceived ? 'All items received.' : 'Partial delivery received.'),
    });

    await audit({ userId: req.userId, action: 'receive_lpo', resource: 'lpo', resourceId: lpo.id, req });
    return successResponse(res, { lpo, status: newStatus }, allReceived ? 'All items received' : 'Partial delivery recorded');
  } catch (err) { next(err); }
};

// ── POST .../cancel ────────────────────────────────────────────────────────
exports.cancelLPO = async (req, res, next) => {
  try {
    const lpo = await LocalPurchaseOrder.findOne({ where: { id: req.params.lpoId, projectId: req.params.projectId } });
    if (!lpo) return errorResponse(res, 'LPO not found', 404);
    if (['received', 'paid', 'cancelled'].includes(lpo.status)) return errorResponse(res, 'Cannot cancel this LPO', 400);
    await lpo.update({ status: 'cancelled' });
    await LPOComment.create({ lpoId: lpo.id, userId: req.userId, step: 'cancelled', comment: req.body.reason || 'LPO cancelled.' });
    return successResponse(res, { lpo }, 'LPO cancelled');
  } catch (err) { next(err); }
};

// ── POST .../comments ──────────────────────────────────────────────────────
exports.addComment = async (req, res, next) => {
  try {
    
    const lpo = await LocalPurchaseOrder.findOne({ where: { id: req.params.lpoId, projectId: req.params.projectId } });
    if (!lpo) return errorResponse(res, 'LPO not found', 404);
    if (!req.body.comment) return errorResponse(res, 'Comment is required', 400);
    const comment = await LPOComment.create({
      lpoId: lpo.id, userId: req.userId,
      step: lpo.status,
      comment: req.body.comment,
      isInternal: req.body.isInternal || false,
    });
    const full = await LPOComment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar', 'jobTitle'] }],
    });
    return successResponse(res, { comment: full }, 'Comment added', 201);
  } catch (err) { next(err); }
};

// ── DELETE /api/projects/:projectId/lpos/:lpoId ───────────────────────────
exports.deleteLPO = async (req, res, next) => {
  try {
    const lpo = await LocalPurchaseOrder.findOne({ where: { id: req.params.lpoId, projectId: req.params.projectId } });
    if (!lpo) return errorResponse(res, 'LPO not found', 404);
    if (!['draft', 'cancelled'].includes(lpo.status)) return errorResponse(res, 'Only draft or cancelled LPOs can be deleted', 400);
    await LPOItem.destroy({ where: { lpoId: lpo.id } });
    await LPOComment.destroy({ where: { lpoId: lpo.id } });
    await lpo.destroy();
    await audit({ userId: req.userId, action: 'delete_lpo', resource: 'lpo', resourceId: req.params.lpoId, req });
    return successResponse(res, null, 'LPO deleted');
  } catch (err) { next(err); }
};
