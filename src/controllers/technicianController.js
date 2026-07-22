const {
  Technician,
  TechnicianCategory,
  TechnicianReceipt,
  ProjectTechnician,
  User,
  Project,
} = require("../models/index");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPagination,
} = require("../utils/response");
const { Op } = require("sequelize");
  const {
    ProjectStoreItem,
    StoreTransaction,
  } = require("../models/store.model");
  const { sequelize } = require("../config/database");

const generateReceiptNo = async () => {
  const year = new Date().getFullYear();
  const count = await TechnicianReceipt.count();
  return `TR-${year}-${String(count + 1).padStart(4, "0")}`;
};

const TECHNICIAN_INCLUDE = [
  { model: TechnicianCategory, as: "category", attributes: ["id", "name"] },
];

// ══════════════════════════════════════════════════════════════
// CATEGORIES
// ══════════════════════════════════════════════════════════════

exports.listCategories = async (req, res, next) => {
  try {
    const categories = await TechnicianCategory.findAll({
      where: { isActive: true },
      order: [["name", "ASC"]],
    });
    return successResponse(res, { categories });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return errorResponse(res, "Name is required", 400);
    const existing = await TechnicianCategory.findOne({ where: { name } });
    if (existing) return errorResponse(res, "Category already exists", 400);
    const category = await TechnicianCategory.create({ name });
    return successResponse(res, { category }, "Category created", 201);
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await TechnicianCategory.findByPk(req.params.catId);
    if (!category) return errorResponse(res, "Category not found", 404);
    await category.update(req.body);
    return successResponse(res, { category }, "Category updated");
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await TechnicianCategory.findByPk(req.params.catId);
    if (!category) return errorResponse(res, "Category not found", 404);
    const count = await Technician.count({
      where: { categoryId: category.id },
    });
    if (count > 0)
      return errorResponse(
        res,
        `Cannot delete: ${count} technician(s) use this category`,
        400,
      );
    await category.update({ isActive: false });
    return successResponse(res, null, "Category deleted");
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
// TECHNICIANS
// ══════════════════════════════════════════════════════════════

exports.listTechnicians = async (req, res, next) => {
  try {
    const { search, categoryId } = req.query;
    const where = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { idNumber: { [Op.like]: `%${search}%` } },
      ];
    }
    const technicians = await Technician.findAll({
      where,
      include: TECHNICIAN_INCLUDE,
      order: [["name", "ASC"]],
    });
    return successResponse(res, { technicians });
  } catch (err) {
    next(err);
  }
};

exports.getTechnician = async (req, res, next) => {
  try {
    const technician = await Technician.findByPk(req.params.technicianId, {
      include: TECHNICIAN_INCLUDE,
    });
    if (!technician) return errorResponse(res, "Technician not found", 404);
    return successResponse(res, { technician });
  } catch (err) {
    next(err);
  }
};

exports.createTechnician = async (req, res, next) => {
  try {
    const { name, categoryId, phone, idType, idNumber } = req.body;
    if (!name) return errorResponse(res, "Name is required", 400);
    const technician = await Technician.create({
      name,
      categoryId,
      phone,
      idType,
      idNumber,
    });
    const full = await Technician.findByPk(technician.id, {
      include: TECHNICIAN_INCLUDE,
    });
    return successResponse(
      res,
      { technician: full },
      "Technician created",
      201,
    );
  } catch (err) {
    next(err);
  }
};

exports.updateTechnician = async (req, res, next) => {
  try {
    const technician = await Technician.findByPk(req.params.technicianId);
    if (!technician) return errorResponse(res, "Technician not found", 404);
    await technician.update(req.body);
    const full = await Technician.findByPk(technician.id, {
      include: TECHNICIAN_INCLUDE,
    });
    return successResponse(res, { technician: full }, "Technician updated");
  } catch (err) {
    next(err);
  }
};

exports.deleteTechnician = async (req, res, next) => {
  try {
    const technician = await Technician.findByPk(req.params.technicianId);
    if (!technician) return errorResponse(res, "Technician not found", 404);
    await technician.update({ isActive: false });
    return successResponse(res, null, "Technician deactivated");
  } catch (err) {
    next(err);
  }
};

exports.getTechnicianReceipts = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { projectId } = req.query;
    const where = {};
    if (req.params.technicianId && req.params.technicianId !== 'all') {
      where.technicianId = req.params.technicianId;
    }
    if (projectId) where.projectId = projectId;
    const { count, rows } = await TechnicianReceipt.findAndCountAll({
      where,
      include: [
        {
          model: Technician,
          as: "technician",
          attributes: ["id", "name", "phone"],
        },
        {
          model: User,
          as: "issuedBy",
          attributes: ["id", "firstName", "lastName"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "projectCode"],
        },
      ],
      order: [["issuedAt", "DESC"]],
      limit,
      offset,
    });
    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
// RECEIPTS (Per Project)
// ══════════════════════════════════════════════════════════════

exports.listProjectReceipts = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { technicianId, requisitionId, search } = req.query;
    const where = { projectId: req.params.projectId };
    if (technicianId) where.technicianId = technicianId;
    if (requisitionId) where.requisitionId = requisitionId;
    if (search) where.description = { [Op.like]: `%${search}%` };
    const { count, rows } = await TechnicianReceipt.findAndCountAll({
      where,
      include: [
        {
          model: Technician,
          as: "technician",
          attributes: ["id", "name", "phone"],
          include: TECHNICIAN_INCLUDE,
        },
        {
          model: User,
          as: "issuedBy",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
      order: [["issuedAt", "DESC"]],
      limit,
      offset,
    });
    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

// POST — distribute items to multiple technicians at once
exports.distributeItems = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { requisitionId, notes, distributions } = req.body;

    if (!distributions?.length)
      return errorResponse(res, "Distributions required", 400);

    const t = await sequelize.transaction();
    const created = [];

    try {
      for (const dist of distributions) {
        const technician = await Technician.findByPk(dist.technicianId, {
          transaction: t,
        });
        if (!technician) continue;

        for (const item of dist.items || []) {
          const qty = parseFloat(item.quantity);
          if (!qty || qty <= 0) continue;

          let storeTransactionId = null;

          // ── Punguza stock kwenye Project Store (kama storeItemId imetolewa) ──
          if (item.storeItemId) {
            const storeItem = await ProjectStoreItem.findOne({
              where: { id: item.storeItemId, projectId },
              transaction: t,
            });

            if (!storeItem) {
              throw new Error(`Store item not found for "${item.description}"`);
            }

            const available = parseFloat(storeItem.quantity);
            if (available < qty) {
              throw new Error(
                `Insufficient stock for "${storeItem.description}": available ${available} ${storeItem.unit || ""}`,
              );
            }

            const newQty = available - qty;
            await storeItem.update({ quantity: newQty }, { transaction: t });

            const storeTransaction = await StoreTransaction.create(
              {
                storeType: "project",
                storeItemId: storeItem.id,
                projectId,
                productId: storeItem.productId || item.productId || null,
                description: storeItem.description,
                unit: storeItem.unit,
                quantityIn: 0,
                quantityOut: qty,
                balanceAfter: newQty,
                transactionType: "worker_issue",
                referenceType: "technician",
                referenceId: technician.id,
                referenceNo: technician.name,
                performedById: req.userId,
                notes: item.notes || notes,
              },
              { transaction: t },
            );

            storeTransactionId = storeTransaction.id;
          }

          // ── Rekodi TechnicianReceipt ──
          const receiptNo = await generateReceiptNo();
          await TechnicianReceipt.create(
            {
              technicianId: dist.technicianId,
              projectId,
              requisitionId: requisitionId || null,
              storeTransactionId,
              productId: item.productId || null,
              description: item.description,
              unit: item.unit || "",
              quantity: qty,
              issuedById: req.userId,
              receiptNo,
              notes: item.notes || notes || "",
            },
            { transaction: t },
          );

          created.push({
            receiptNo,
            technician: technician.name,
            description: item.description,
            quantity: qty,
            unit: item.unit,
          });
        }
      }

      if (!created.length) {
        await t.rollback();
        return errorResponse(res, "No valid items were distributed", 400);
      }

      await t.commit();
      return successResponse(
        res,
        { distributed: created, count: created.length },
        `${created.length} item(s) distributed to ${distributions.length} technician(s)`,
        201,
      );
    } catch (err) {
      await t.rollback();
      return errorResponse(res, err.message, 400);
    }
  } catch (err) {
    next(err);
  }
};
// exports.distributeItems = async (req, res, next) => {
//   try {
//     const { projectId } = req.params;
//     const { requisitionId, storeTransactionId, distributions, notes } =
//       req.body;
//     // distributions = [{ technicianId, items: [{ description, unit, quantity, productId, notes }] }]
//     if (!distributions?.length)
//       return errorResponse(res, "Distributions required", 400);

//     const created = [];
//     for (const dist of distributions) {
//       const technician = await Technician.findByPk(dist.technicianId);
//       if (!technician) continue;
//       for (const item of dist.items || []) {
//         if (!item.quantity || parseFloat(item.quantity) <= 0) continue;
//         const receiptNo = await generateReceiptNo();
//         const receipt = await TechnicianReceipt.create({
//           technicianId: dist.technicianId,
//           projectId,
//           requisitionId: requisitionId || null,
//           storeTransactionId: storeTransactionId || null,
//           productId: item.productId || null,
//           description: item.description,
//           unit: item.unit || "",
//           quantity: parseFloat(item.quantity),
//           issuedById: req.userId,
//           receiptNo,
//           notes: item.notes || notes || "",
//         });
//         created.push({
//           receiptNo,
//           technician: technician.name,
//           description: item.description,
//           quantity: item.quantity,
//           unit: item.unit,
//         });
//       }
//     }
//     return successResponse(
//       res,
//       { distributed: created, count: created.length },
//       `${created.length} item(s) distributed to ${distributions.length} technician(s)`,
//       201,
//     );
//   } catch (err) {
//     next(err);
//   }
// };

// POST — single item to single technician
exports.createReceipt = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      technicianId,
      requisitionId,
      storeTransactionId,
      productId,
      description,
      unit,
      quantity,
      notes,
      signature,
    } = req.body;
    if (!technicianId || !description || !quantity)
      return errorResponse(
        res,
        "technicianId, description and quantity required",
        400,
      );
    const technician = await Technician.findByPk(technicianId);
    if (!technician) return errorResponse(res, "Technician not found", 404);
    const receiptNo = await generateReceiptNo();
    const receipt = await TechnicianReceipt.create({
      technicianId,
      projectId,
      requisitionId,
      storeTransactionId,
      productId,
      description,
      unit,
      quantity: parseFloat(quantity),
      issuedById: req.userId,
      receiptNo,
      notes,
      signature,
    });
    const full = await TechnicianReceipt.findByPk(receipt.id, {
      include: [
        {
          model: Technician,
          as: "technician",
          attributes: ["id", "name", "phone"],
        },
        {
          model: User,
          as: "issuedBy",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });
    return successResponse(res, { receipt: full }, "Receipt created", 201);
  } catch (err) {
    next(err);
  }
};

exports.acknowledgeReceipt = async (req, res, next) => {
  try {
    const receipt = await TechnicianReceipt.findOne({
      where: { id: req.params.receiptId, projectId: req.params.projectId },
    });
    if (!receipt) return errorResponse(res, "Receipt not found", 404);
    await receipt.update({
      acknowledged: true,
      acknowledgedAt: new Date(),
      signature: req.body.signature || receipt.signature,
    });
    return successResponse(res, { receipt }, "Receipt acknowledged");
  } catch (err) {
    next(err);
  }
};

exports.deleteReceipt = async (req, res, next) => {
  try {
    const receipt = await TechnicianReceipt.findOne({
      where: { id: req.params.receiptId, projectId: req.params.projectId },
    });
    if (!receipt) return errorResponse(res, "Receipt not found", 404);
    await receipt.destroy();
    return successResponse(res, null, "Receipt deleted");
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
// PROJECT TECHNICIANS
// ══════════════════════════════════════════════════════════════



// GET /api/projects/:projectId/technicians
exports.listProjectTechnicians = async (req, res, next) => {
  try {
    const { categoryId, search } = req.query;
    const where = { projectId: req.params.projectId, isActive: true };

    const include = [
      {
        model: Technician,
        as: "technician",
        where: { isActive: true },
        include: [
          {
            model: TechnicianCategory,
            as: "category",
            attributes: ["id", "name"],
          },
        ],
        ...(categoryId ? { where: { categoryId } } : {}),
        ...(search ? { where: { name: { [Op.like]: `%${search}%` } } } : {}),
      },
    ];

    const assignments = await ProjectTechnician.findAll({
      where,
      include: [
        {
          model: Technician,
          as: "technician",
          required: true,
          where: {
            isActive: true,
            ...(search ? { name: { [Op.like]: `%${search}%` } } : {}),
            ...(categoryId ? { categoryId } : {}),
          },
          include: [
            {
              model: TechnicianCategory,
              as: "category",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [[{ model: Technician, as: "technician" }, "name", "ASC"]],
    });

    return successResponse(res, { technicians: assignments });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/technicians — assign technician to project
exports.assignTechnicianToProject = async (req, res, next) => {
  try {
    const { technicianId, role, notes } = req.body;
    if (!technicianId) return errorResponse(res, "technicianId required", 400);

    const technician = await Technician.findByPk(technicianId);
    if (!technician) return errorResponse(res, "Technician not found", 404);

    const existing = await ProjectTechnician.findOne({
      where: { projectId: req.params.projectId, technicianId },
    });
    if (existing) {
      if (existing.isActive)
        return errorResponse(
          res,
          "Technician already assigned to this project",
          400,
        );
      await existing.update({
        isActive: true,
        role,
        notes,
        assignedById: req.userId,
      });
      return successResponse(
        res,
        { assignment: existing },
        "Technician re-activated for project",
      );
    }

    const assignment = await ProjectTechnician.create({
      projectId: req.params.projectId,
      technicianId,
      assignedById: req.userId,
      role,
      notes,
    });

    const full = await ProjectTechnician.findByPk(assignment.id, {
      include: [
        {
          model: Technician,
          as: "technician",
          include: [{ model: TechnicianCategory, as: "category" }],
        },
      ],
    });

    return successResponse(
      res,
      { assignment: full },
      "Technician assigned to project",
      201,
    );
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:projectId/technicians/:assignmentId
exports.updateProjectTechnician = async (req, res, next) => {
  try {
    const assignment = await ProjectTechnician.findOne({
      where: { id: req.params.assignmentId, projectId: req.params.projectId },
    });
    if (!assignment) return errorResponse(res, "Assignment not found", 404);
    await assignment.update(req.body);
    return successResponse(res, { assignment }, "Updated");
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/technicians/:assignmentId
exports.removeTechnicianFromProject = async (req, res, next) => {
  try {
    const assignment = await ProjectTechnician.findOne({
      where: { id: req.params.assignmentId, projectId: req.params.projectId },
    });
    if (!assignment) return errorResponse(res, "Assignment not found", 404);
    await assignment.update({ isActive: false });
    return successResponse(res, null, "Technician removed from project");
  } catch (err) {
    next(err);
  }
};
