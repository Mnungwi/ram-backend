const { Supplier, PurchaseOrder, LocalPurchaseOrder, LPOItem, Invoice, InvoicePayment, Product, Project } = require('../models/index');
const { successResponse, errorResponse, paginatedResponse, getPagination } = require('../utils/response');
const { audit } = require('../utils/audit');
const { Op } = require('sequelize');

const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;

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

// GET /api/suppliers/:supplierId/ledger?projectId=&productId=&startDate=&endDate=
// Everything one supplier has ever supplied (via LPOs) and everything
// they've been invoiced/paid for (via Invoices + InvoicePayment), in one
// place — filterable by project, product and a date range. Project/Product
// names are looked up manually (not via a Sequelize include) because
// LPOItem<->Product and Invoice<->Project associations were never wired in
// models/index.js — adding a new belongsTo() there risks the same FK
// collation failure (errno 150) documented on SiteFundDisbursement/
// Subcontractor/SafetyRecord if either table's default collation doesn't
// already match; a plain findAll-by-id lookup sidesteps that entirely.
exports.getSupplierLedger = async (req, res, next) => {
  try {
    const { supplierId } = req.params;
    const { projectId, productId, startDate, endDate } = req.query;

    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) return errorResponse(res, 'Supplier not found', 404);

    const dateRange = {};
    if (startDate) dateRange[Op.gte] = startDate;
    if (endDate) dateRange[Op.lte] = endDate;

    // ── Items supplied (via LPOs) ──────────────────────────────
    const lpoWhere = { supplierId };
    if (projectId) lpoWhere.projectId = projectId;
    if (startDate || endDate) lpoWhere.date = dateRange;

    const lpos = await LocalPurchaseOrder.findAll({
      where: lpoWhere,
      include: [{ model: LPOItem, as: 'items' }],
      order: [['date', 'DESC']],
    });

    const lpoProjectIds = [...new Set(lpos.map((l) => l.projectId).filter(Boolean))];
    const lpoProjects = lpoProjectIds.length
      ? await Project.findAll({ where: { id: lpoProjectIds }, attributes: ['id', 'name', 'projectCode'] })
      : [];
    const projectMap = Object.fromEntries(lpoProjects.map((p) => [p.id, p]));

    let items = [];
    for (const lpo of lpos) {
      for (const it of lpo.items || []) {
        if (productId && it.productId !== productId) continue;
        items.push({
          lpoId: lpo.id,
          lpoNo: lpo.lpoNo,
          date: lpo.date,
          status: lpo.status,
          project: projectMap[lpo.projectId] || null,
          productId: it.productId,
          description: it.description,
          unit: it.unit,
          quantity: it.quantity,
          quantityReceived: it.quantityReceived,
          unitPrice: it.unitPrice,
          amount: it.amount,
        });
      }
    }

    const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))];
    const products = productIds.length
      ? await Product.findAll({ where: { id: productIds }, attributes: ['id', 'name', 'code'] })
      : [];
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
    items = items.map((i) => ({ ...i, product: i.productId ? productMap[i.productId] || null : null }));

    // ── Payments (via Invoices + their payment history) ────────
    const invWhere = { supplierId };
    if (projectId) invWhere.projectId = projectId;
    if (startDate || endDate) invWhere.date = dateRange;

    const invoices = await Invoice.findAll({
      where: invWhere,
      include: [{ model: InvoicePayment, as: 'paymentHistory' }],
      order: [['date', 'DESC']],
    });

    const invProjectIds = [...new Set(invoices.map((i) => i.projectId).filter(Boolean))];
    const invProjects = invProjectIds.length
      ? await Project.findAll({ where: { id: invProjectIds }, attributes: ['id', 'name', 'projectCode'] })
      : [];
    const invProjectMap = Object.fromEntries(invProjects.map((p) => [p.id, p]));

    const invoicesOut = invoices.map((inv) => {
      const paid = (inv.paymentHistory || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0);
      return {
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        date: inv.date,
        dueDate: inv.dueDate,
        status: inv.status,
        description: inv.description,
        amount: inv.amount,
        paid: round2(paid),
        balance: round2(parseFloat(inv.amount || 0) - paid),
        project: invProjectMap[inv.projectId] || null,
        paymentHistory: inv.paymentHistory || [],
      };
    });

    const totalSupplied = round2(items.reduce((s, i) => s + parseFloat(i.amount || 0), 0));
    const totalInvoiced = round2(invoicesOut.reduce((s, i) => s + parseFloat(i.amount || 0), 0));
    const totalPaid = round2(invoicesOut.reduce((s, i) => s + i.paid, 0));

    return successResponse(res, {
      supplier,
      items,
      invoices: invoicesOut,
      summary: {
        totalSupplied,
        totalInvoiced,
        totalPaid,
        balance: round2(totalInvoiced - totalPaid),
      },
    }, 'Supplier ledger retrieved');
  } catch (err) { next(err); }
};
