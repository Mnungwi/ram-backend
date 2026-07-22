const {
  CentralStoreItem,
  ProjectStoreItem,
  StoreTransaction,
} = require("../models/store.model");
const { Requisition, RequisitionItem } = require("../models/requisition.model");
const { LocalPurchaseOrder, LPOItem } = require("../models/lpo.model");
const { User } = require("../models/index");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPagination,
} = require("../utils/response");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");

// ══════════════════════════════════════════════════════════════
// PROJECT STORE
// ══════════════════════════════════════════════════════════════

// GET /api/projects/:projectId/store
exports.listProjectStore = async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = { projectId: req.params.projectId };
    if (search) where.description = { [Op.like]: `%${search}%` };
    const items = await ProjectStoreItem.findAll({
      where,
      order: [["description", "ASC"]],
    });
    return successResponse(res, { items });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/store/transactions
exports.listProjectTransactions = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { count, rows } = await StoreTransaction.findAndCountAll({
      where: { projectId: req.params.projectId, storeType: "project" },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

// ── LPO Received → Add to Project Store ─────────────────────────────────────
// POST /api/projects/:projectId/store/receive-lpo
exports.receiveLPOToProjectStore = async (req, res, next) => {
  try {
    const { lpoId } = req.body;
    const { projectId } = req.params;
    if (!lpoId) return errorResponse(res, "lpoId required", 400);

    const lpo = await LocalPurchaseOrder.findOne({
      where: { id: lpoId, projectId },
      include: [{ model: LPOItem, as: "items" }],
    });
    if (!lpo) return errorResponse(res, "LPO not found", 404);
    if (!["received", "partial"].includes(lpo.status)) {
      return errorResponse(res, "LPO must be received first", 400);
    }

    const t = await sequelize.transaction();
    try {
      for (const item of lpo.items) {
        const qty =
          parseFloat(item.quantityReceived) || parseFloat(item.quantity);
        if (qty <= 0) continue;

        // Find or create project store item
        let storeItem = await ProjectStoreItem.findOne({
          where: {
            projectId,
            [Op.or]: [
              ...(item.productId ? [{ productId: item.productId }] : []),
              { description: item.description },
            ],
          },
          transaction: t,
        });

        if (!storeItem) {
          storeItem = await ProjectStoreItem.create(
            {
              projectId,
              productId: item.productId || null,
              description: item.description,
              unit: item.unit,
              quantity: 0,
              unitCost: item.unitPrice,
            },
            { transaction: t },
          );
        }

        const newQty = parseFloat(storeItem.quantity) + qty;
        await storeItem.update({ quantity: newQty }, { transaction: t });

        await StoreTransaction.create(
          {
            storeType: "project",
            storeItemId: storeItem.id,
            projectId,
            productId: item.productId || null,
            description: item.description,
            unit: item.unit,
            quantityIn: qty,
            quantityOut: 0,
            balanceAfter: newQty,
            unitCost: item.unitPrice,
            transactionType: "lpo_receive",
            referenceType: "lpo",
            referenceId: lpo.id,
            referenceNo: lpo.lpoNo,
            performedById: req.userId,
          },
          { transaction: t },
        );
      }

      await t.commit();
      return successResponse(res, null, `LPO items received to project store`);
    } catch (err) {
      await t.rollback();
      return errorResponse(res, err.message, 400);
    }
  } catch (err) {
    next(err);
  }
};

// ── Requisition Issued → Smart Issue (Project Store → Central Store → Flag) ──
// POST /api/projects/:projectId/store/issue-rn
exports.issueRequisitionFromStore = async (req, res, next) => {
  try {
    const { requisitionId } = req.body;
    const { projectId } = req.params;
    if (!requisitionId)
      return errorResponse(res, "requisitionId required", 400);

    const rn = await Requisition.findOne({
      where: { id: requisitionId, projectId },
      include: [{ model: RequisitionItem, as: "items" }],
    });
    if (!rn) return errorResponse(res, "Requisition not found", 404);
    if (rn.status !== "issued")
      return errorResponse(res, "Requisition must be issued first", 400);

    const t = await sequelize.transaction();
    const issuedFromProject = []; // issued directly from project store
    const issuedFromCentral = []; // transferred from central then issued
    const notInStore = []; // not in any store - pending LPO

    try {
      for (const item of rn.items) {
        const qty =
          parseFloat(item.quantityIssued) || parseFloat(item.quantityOrdered);
        if (qty <= 0) continue;

        const itemWhere = {
          [Op.or]: [
            ...(item.productId ? [{ productId: item.productId }] : []),
            { description: item.description },
          ],
        };

        // ── 1. Check Project Store ──────────────────────────────
        const projectItem = await ProjectStoreItem.findOne({
          where: { projectId, ...itemWhere },
          transaction: t,
        });

        if (projectItem && parseFloat(projectItem.quantity) >= qty) {
          // Issue from project store
          const newQty = parseFloat(projectItem.quantity) - qty;
          await projectItem.update({ quantity: newQty }, { transaction: t });
          await StoreTransaction.create(
            {
              storeType: "project",
              storeItemId: projectItem.id,
              projectId,
              productId: item.productId || null,
              description: item.description,
              unit: item.unit,
              quantityIn: 0,
              quantityOut: qty,
              balanceAfter: newQty,
              transactionType: "rn_issue",
              referenceType: "requisition",
              referenceId: rn.id,
              referenceNo: rn.requisitionNo,
              performedById: req.userId,
            },
            { transaction: t },
          );
          issuedFromProject.push({
            description: item.description,
            quantity: qty,
            source: "project_store",
          });
          continue;
        }

        // ── 2. Check Central Store ──────────────────────────────
        const centralItem = await CentralStoreItem.findOne({
          where: { isActive: true, ...itemWhere },
          transaction: t,
        });

        if (centralItem && parseFloat(centralItem.quantity) >= qty) {
          // Transfer from central to project store first
          const newCentralQty = parseFloat(centralItem.quantity) - qty;
          await centralItem.update(
            { quantity: newCentralQty },
            { transaction: t },
          );
          await StoreTransaction.create(
            {
              storeType: "central",
              storeItemId: centralItem.id,
              projectId,
              productId: item.productId || null,
              description: item.description,
              unit: item.unit,
              quantityIn: 0,
              quantityOut: qty,
              balanceAfter: newCentralQty,
              transactionType: "transfer_out",
              referenceType: "requisition",
              referenceId: rn.id,
              referenceNo: rn.requisitionNo,
              performedById: req.userId,
              notes: `Auto-transfer to project for ${rn.requisitionNo}`,
            },
            { transaction: t },
          );

          // Add to project store then issue (balance = 0 after issue)
          let projItem = projectItem; // may have partial quantity
          if (!projItem) {
            projItem = await ProjectStoreItem.create(
              {
                projectId,
                productId: item.productId || null,
                description: item.description,
                unit: item.unit,
                quantity: 0,
                unitCost: centralItem.unitCost,
              },
              { transaction: t },
            );
          }
          // transfer in then out = net 0 (issued immediately)
          await StoreTransaction.create(
            {
              storeType: "project",
              storeItemId: projItem.id,
              projectId,
              productId: item.productId || null,
              description: item.description,
              unit: item.unit,
              quantityIn: qty,
              quantityOut: qty,
              balanceAfter: parseFloat(projItem.quantity),
              transactionType: "rn_issue",
              referenceType: "requisition",
              referenceId: rn.id,
              referenceNo: rn.requisitionNo,
              performedById: req.userId,
              notes: `Transferred from central store and issued`,
            },
            { transaction: t },
          );

          issuedFromCentral.push({
            description: item.description,
            quantity: qty,
            source: "central_store",
          });
          continue;
        }

        // ── 3. Not in any store ─────────────────────────────────
        // Partial issue if project store has some
        const available = projectItem ? parseFloat(projectItem.quantity) : 0;
        if (available > 0) {
          // Issue what is available
          await projectItem.update({ quantity: 0 }, { transaction: t });
          await StoreTransaction.create(
            {
              storeType: "project",
              storeItemId: projectItem.id,
              projectId,
              productId: item.productId || null,
              description: item.description,
              unit: item.unit,
              quantityIn: 0,
              quantityOut: available,
              balanceAfter: 0,
              transactionType: "rn_issue",
              referenceType: "requisition",
              referenceId: rn.id,
              referenceNo: rn.requisitionNo,
              performedById: req.userId,
              notes: `Partial issue — ${qty - available} still pending`,
            },
            { transaction: t },
          );
          issuedFromProject.push({
            description: item.description,
            quantity: available,
            source: "project_store_partial",
          });
          notInStore.push({
            description: item.description,
            required: qty,
            issued: available,
            pending: qty - available,
          });
        } else {
          notInStore.push({
            description: item.description,
            required: qty,
            issued: 0,
            pending: qty,
          });
        }
      }

      await t.commit();

      const totalIssued = issuedFromProject.length + issuedFromCentral.length;
      let message = "";
      if (issuedFromProject.length)
        message += `${issuedFromProject.length} from project store. `;
      if (issuedFromCentral.length)
        message += `${issuedFromCentral.length} from central store. `;
      if (notInStore.length)
        message += `${notInStore.length} pending — not in any store.`;

      return successResponse(
        res,
        {
          issuedFromProject,
          issuedFromCentral,
          notInStore,
          summary: { totalIssued, pending: notInStore.length },
        },
        message.trim() || "Issue complete",
      );
    } catch (err) {
      await t.rollback();
      return errorResponse(res, err.message, 400);
    }
  } catch (err) {
    next(err);
  }
};

// ── Project Completed → Transfer remaining to Central Store ─────────────────
// POST /api/projects/:projectId/store/transfer-to-central
exports.transferRemainingToCentral = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { notes } = req.body;

    const projectItems = await ProjectStoreItem.findAll({
      where: { projectId, quantity: { [Op.gt]: 0 } },
    });

    if (!projectItems.length)
      return errorResponse(res, "No items to transfer", 400);

    const t = await sequelize.transaction();
    const transferred = [];

    try {
      for (const item of projectItems) {
        const qty = parseFloat(item.quantity);
        if (qty <= 0) continue;

        // Find or create central store item
        let centralItem = await CentralStoreItem.findOne({
          where: {
            [Op.or]: [
              ...(item.productId ? [{ productId: item.productId }] : []),
              { description: item.description },
            ],
          },
          transaction: t,
        });

        if (!centralItem) {
          centralItem = await CentralStoreItem.create(
            {
              productId: item.productId || null,
              description: item.description,
              unit: item.unit,
              quantity: 0,
              unitCost: item.unitCost,
            },
            { transaction: t },
          );
        }

        const newCentralQty = parseFloat(centralItem.quantity) + qty;
        await centralItem.update(
          { quantity: newCentralQty },
          { transaction: t },
        );

        // Record in central store
        await StoreTransaction.create(
          {
            storeType: "central",
            storeItemId: centralItem.id,
            projectId,
            productId: item.productId || null,
            description: item.description,
            unit: item.unit,
            quantityIn: qty,
            quantityOut: 0,
            balanceAfter: newCentralQty,
            transactionType: "transfer_in",
            referenceType: "project",
            referenceNo: `Project ${projectId}`,
            performedById: req.userId,
            notes,
          },
          { transaction: t },
        );

        // Zero out project store item
        await item.update({ quantity: 0 }, { transaction: t });

        await StoreTransaction.create(
          {
            storeType: "project",
            storeItemId: item.id,
            projectId,
            productId: item.productId || null,
            description: item.description,
            unit: item.unit,
            quantityIn: 0,
            quantityOut: qty,
            balanceAfter: 0,
            transactionType: "transfer_out",
            referenceType: "central",
            performedById: req.userId,
            notes,
          },
          { transaction: t },
        );

        transferred.push({ description: item.description, quantity: qty });
      }

      await t.commit();
      return successResponse(
        res,
        { transferred },
        `${transferred.length} item(s) transferred to central store`,
      );
    } catch (err) {
      await t.rollback();
      return errorResponse(res, err.message, 400);
    }
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
// CENTRAL STORE
// ══════════════════════════════════════════════════════════════

// GET /api/store/central
exports.listCentralStore = async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = { isActive: true, quantity: { [Op.gt]: 0 } };
    if (search) where.description = { [Op.like]: `%${search}%` };
    const items = await CentralStoreItem.findAll({
      where,
      order: [["description", "ASC"]],
    });
    return successResponse(res, { items });
  } catch (err) {
    next(err);
  }
};

// POST /api/store/central/transfer/:projectId — Central → Project Store
exports.transferCentralToProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { items, notes } = req.body;
    if (!items?.length) return errorResponse(res, "Items required", 400);

    const t = await sequelize.transaction();
    const transferred = [];

    try {
      for (const transfer of items) {
        const centralItem = await CentralStoreItem.findByPk(
          transfer.centralItemId,
          { transaction: t },
        );
        if (!centralItem) throw new Error(`Item not found`);

        const qty = parseFloat(transfer.quantity);
        if (parseFloat(centralItem.quantity) < qty) {
          throw new Error(
            `Insufficient stock for ${centralItem.description}: available ${centralItem.quantity}`,
          );
        }

        // Deduct from central
        const newCentralQty = parseFloat(centralItem.quantity) - qty;
        await centralItem.update(
          { quantity: newCentralQty },
          { transaction: t },
        );

        await StoreTransaction.create(
          {
            storeType: "central",
            storeItemId: centralItem.id,
            projectId,
            productId: centralItem.productId || null,
            description: centralItem.description,
            unit: centralItem.unit,
            quantityIn: 0,
            quantityOut: qty,
            balanceAfter: newCentralQty,
            transactionType: "transfer_out",
            referenceType: "project",
            referenceNo: `Project ${projectId}`,
            performedById: req.userId,
            notes,
          },
          { transaction: t },
        );

        // Add to project store
        let projectItem = await ProjectStoreItem.findOne({
          where: {
            projectId,
            [Op.or]: [
              ...(centralItem.productId
                ? [{ productId: centralItem.productId }]
                : []),
              { description: centralItem.description },
            ],
          },
          transaction: t,
        });

        if (!projectItem) {
          projectItem = await ProjectStoreItem.create(
            {
              projectId,
              productId: centralItem.productId || null,
              description: centralItem.description,
              unit: centralItem.unit,
              quantity: 0,
              unitCost: centralItem.unitCost,
            },
            { transaction: t },
          );
        }

        const newProjectQty = parseFloat(projectItem.quantity) + qty;
        await projectItem.update(
          { quantity: newProjectQty },
          { transaction: t },
        );

        await StoreTransaction.create(
          {
            storeType: "project",
            storeItemId: projectItem.id,
            projectId,
            productId: centralItem.productId || null,
            description: centralItem.description,
            unit: centralItem.unit,
            quantityIn: qty,
            quantityOut: 0,
            balanceAfter: newProjectQty,
            transactionType: "transfer_in",
            referenceType: "central",
            performedById: req.userId,
            notes,
          },
          { transaction: t },
        );

        transferred.push({
          description: centralItem.description,
          quantity: qty,
        });
      }

      await t.commit();
      return successResponse(
        res,
        { transferred },
        `${transferred.length} item(s) transferred to project store`,
      );
    } catch (err) {
      await t.rollback();
      return errorResponse(res, err.message, 400);
    }
  } catch (err) {
    next(err);
  }
};

// GET /api/store/central/transactions
exports.listCentralTransactions = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { count, rows } = await StoreTransaction.findAndCountAll({
      where: { storeType: "central" },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/store/adjust — manual adjustment
exports.adjustProjectStore = async (req, res, next) => {
  try {
    const { productId, description, unit, quantity, type, notes } = req.body;
    const { projectId } = req.params;
    if (!description || !quantity)
      return errorResponse(res, "Description and quantity required", 400);

    let item = await ProjectStoreItem.findOne({
      where: { projectId, description },
    });
    if (!item) {
      item = await ProjectStoreItem.create({
        projectId,
        productId,
        description,
        unit,
        quantity: 0,
      });
    }

    const qtyIn = type === "in" ? parseFloat(quantity) : 0;
    const qtyOut = type === "out" ? parseFloat(quantity) : 0;
    const newQty = parseFloat(item.quantity) + qtyIn - qtyOut;
    if (newQty < 0) return errorResponse(res, "Insufficient stock", 400);

    await item.update({ quantity: newQty });
    await StoreTransaction.create({
      storeType: "project",
      storeItemId: item.id,
      projectId,
      productId,
      description,
      unit,
      quantityIn: qtyIn,
      quantityOut: qtyOut,
      balanceAfter: newQty,
      transactionType: type === "in" ? "adjustment_in" : "adjustment_out",
      referenceType: "manual",
      performedById: req.userId,
      notes,
    });

    return successResponse(res, { item }, "Stock adjusted");
  } catch (err) {
    next(err);
  }
};
