const { Product, ProductCategory } = require("../models/product.model");
const { Unit } = require("../models/unit.model");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPagination,
} = require("../utils/response");
const { Op } = require("sequelize");

const PRODUCT_INCLUDE = [
  { model: ProductCategory, as: "category", attributes: ["id", "name"] },
  { model: Unit, as: "uom", attributes: ["id", "name", "abbreviation"] },
];

// ── GET /api/products/all ─── (no pagination, for dropdowns)
exports.listAllProducts = async (req, res, next) => {
  try {
    const { search, categoryId } = req.query;
    const where = {}; // ← ondoa isActive filter
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ];
    }
    const products = await Product.findAll({
      where,
      include: PRODUCT_INCLUDE,
      order: [["name", "ASC"]],
    });
    return successResponse(res, { products });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/products ──────────────────────────────────────────────────────
exports.listProducts = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search, categoryId } = req.query;
    const where = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows } = await Product.findAndCountAll({
      where,
      include: PRODUCT_INCLUDE,
      order: [["name", "ASC"]],
      limit,
      offset,
    });
    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/products/:productId ──────────────────────────────────────────
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.productId, {
      include: PRODUCT_INCLUDE,
    });
    if (!product) return errorResponse(res, "Product not found", 404);
    return successResponse(res, { product });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/products ────────────────────────────────────────────────────
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      code,
      description,
      unit,
      unitId,
      unitPrice,
      categoryId,
      isActive,
    } = req.body;
    if (!name) return errorResponse(res, "Product name is required", 400);
    if (code) {
      const existing = await Product.findOne({ where: { code } });
      if (existing)
        return errorResponse(res, "Product code already exists", 400);
    }
    const product = await Product.create({
      name,
      code,
      description,
      unitId: unitId || null,
      unitPrice,
      categoryId: categoryId || null,
      isActive: isActive ?? true,
    });
    const full = await Product.findByPk(product.id, {
      include: PRODUCT_INCLUDE,
    });
    return successResponse(res, { product: full }, "Product created", 201);
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/products/:productId ──────────────────────────────────────────
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) return errorResponse(res, "Product not found", 404);
    if (req.body.code && req.body.code !== product.code) {
      const existing = await Product.findOne({
        where: { code: req.body.code },
      });
      if (existing)
        return errorResponse(res, "Product code already exists", 400);
    }
    await product.update(req.body);
    const full = await Product.findByPk(product.id, {
      include: PRODUCT_INCLUDE,
    });
    return successResponse(res, { product: full }, "Product updated");
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/products/:productId ───────────────────────────────────────
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) return errorResponse(res, "Product not found", 404);
    await product.update({ isActive: false });
    return successResponse(res, null, "Product deleted");
  } catch (err) {
    next(err);
  }
};

// ── GET /api/products/categories ──────────────────────────────────────────
exports.listCategories = async (req, res, next) => {
  try {
    const categories = await ProductCategory.findAll({
      where: { isActive: true },
      order: [["name", "ASC"]],
    });
    return successResponse(res, { categories });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/products/categories ─────────────────────────────────────────
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return errorResponse(res, "Category name is required", 400);
    const [cat, created] = await ProductCategory.findOrCreate({
      where: { name },
      defaults: { name, description },
    });
    if (!created) return errorResponse(res, "Category already exists", 400);
    return successResponse(res, { category: cat }, "Category created", 201);
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/products/categories/:catId ───────────────────────────────────
exports.updateCategory = async (req, res, next) => {
  try {
    const cat = await ProductCategory.findByPk(req.params.catId);
    if (!cat) return errorResponse(res, "Category not found", 404);
    await cat.update(req.body);
    return successResponse(res, { category: cat }, "Category updated");
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/products/categories/:catId ─────────────────────────────────
exports.deleteCategory = async (req, res, next) => {
  try {
    const cat = await ProductCategory.findByPk(req.params.catId);
    if (!cat) return errorResponse(res, "Category not found", 404);
    const count = await Product.count({ where: { categoryId: cat.id } });
    if (count > 0)
      return errorResponse(
        res,
        `Cannot delete: ${count} product(s) use this category`,
        400,
      );
    await cat.update({ isActive: false });
    return successResponse(res, null, "Category deleted");
  } catch (err) {
    next(err);
  }
};
