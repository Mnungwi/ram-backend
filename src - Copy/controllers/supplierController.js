const { Supplier, PurchaseOrder } = require('../models/index');
const { successResponse, errorResponse, paginatedResponse, getPagination } = require('../utils/response');
const { audit } = require('../utils/audit');
const { Op } = require('sequelize');

// GET /api/suppliers
exports.listSuppliers = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search, category, isActive } = req.query;

    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    // else where.isActive = true; // default active only

    if (search) {
      where[Op.or] = [
        { name:      { [Op.like]: `%${search}%` } },
        { email:     { [Op.like]: `%${search}%` } },
        { phone:     { [Op.like]: `%${search}%` } },
        { category:  { [Op.like]: `%${search}%` } },
        { taxNumber: { [Op.like]: `%${search}%` } },
      ];
    }

    if (category) where.category = category;

    const { count, rows } = await Supplier.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit,
      offset,
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

// GET /api/suppliers/:supplierId
exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.supplierId, {
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrders',
          attributes: ['id', 'orderNumber', 'status', 'totalAmount', 'createdAt'],
          limit: 10,
          order: [['createdAt', 'DESC']],
        },
      ],
    });
    if (!supplier) return errorResponse(res, 'Supplier not found', 404);
    return successResponse(res, { supplier });
  } catch (err) { next(err); }
};

// POST /api/suppliers
exports.createSupplier = async (req, res, next) => {
  try {
    const {
      name, email, phone, address,
      category, taxNumber, bankDetails, notes,
    } = req.body;

    // Check duplicate name
    const existing = await Supplier.findOne({ where: { name } });
    if (existing) return errorResponse(res, 'Supplier with this name already exists', 400);

    const supplier = await Supplier.create({
      name, email, phone, address,
      category, taxNumber, bankDetails, notes,
      isActive: true,
    });

    await audit({
      userId: req.userId, action: 'create_supplier',
      resource: 'supplier', resourceId: supplier.id, req,
    });

    return successResponse(res, { supplier }, 'Supplier created', 201);
  } catch (err) { next(err); }
};

// PUT /api/suppliers/:supplierId
exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.supplierId);
    if (!supplier) return errorResponse(res, 'Supplier not found', 404);

    // Check duplicate name (exclude current)
    if (req.body.name && req.body.name !== supplier.name) {
      const existing = await Supplier.findOne({ where: { name: req.body.name } });
      if (existing) return errorResponse(res, 'Supplier with this name already exists', 400);
    }

    await supplier.update(req.body);

    await audit({
      userId: req.userId, action: 'update_supplier',
      resource: 'supplier', resourceId: supplier.id, req,
    });

    return successResponse(res, { supplier }, 'Supplier updated');
  } catch (err) { next(err); }
};

// DELETE /api/suppliers/:supplierId  (soft delete)
exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.supplierId);
    if (!supplier) return errorResponse(res, 'Supplier not found', 404);

    // Check if supplier has purchase orders
    const poCount = await PurchaseOrder.count({ where: { supplierId: supplier.id } });
    if (poCount > 0) {
      return errorResponse(
        res,
        `Cannot delete: ${poCount} purchase order(s) linked to this supplier.`,
        400
      );
    }

    await supplier.update({ isActive: false });

    await audit({
      userId: req.userId, action: 'delete_supplier',
      resource: 'supplier', resourceId: supplier.id, req,
    });

    return successResponse(res, null, 'Supplier deactivated');
  } catch (err) { next(err); }
};

// GET /api/suppliers/categories  — list unique categories
exports.listCategories = async (req, res, next) => {
  try {
    const rows = await Supplier.findAll({
      attributes: ['category'],
      where: { isActive: true, category: { [Op.ne]: null } },
      group: ['category'],
      order: [['category', 'ASC']],
    });
    const categories = rows.map(r => r.category).filter(Boolean);
    return successResponse(res, { categories });
  } catch (err) { next(err); }
};
