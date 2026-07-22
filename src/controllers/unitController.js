const { Unit } = require('../models/unit.model');
const { successResponse, errorResponse } = require('../utils/response');
const { Op } = require('sequelize');

// ── GET /api/units ─────────────────────────────────────────────────────────
exports.listUnits = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const where = { isActive: true };
    if (category) where.category = category;
    if (search) {
      where[Op.or] = [
        { name:         { [Op.like]: `%${search}%` } },
        { abbreviation: { [Op.like]: `%${search}%` } },
      ];
    }
    const units = await Unit.findAll({
      where, order: [['category', 'ASC'], ['name', 'ASC']]
    });
    return successResponse(res, { units });
  } catch (err) { next(err); }
};

// ── GET /api/units/categories ──────────────────────────────────────────────
exports.listUnitCategories = async (req, res, next) => {
  try {
    const rows = await Unit.findAll({
      attributes: ['category'],
      where: { isActive: true },
      group: ['category'],
      order: [['category', 'ASC']],
    });
    const categories = rows.map((r) => r.category).filter(Boolean);
    return successResponse(res, { categories });
  } catch (err) { next(err); }
};

// ── GET /api/units/:unitId ─────────────────────────────────────────────────
exports.getUnit = async (req, res, next) => {
  try {
    const unit = await Unit.findByPk(req.params.unitId);
    if (!unit) return errorResponse(res, 'Unit not found', 404);
    return successResponse(res, { unit });
  } catch (err) { next(err); }
};

// ── POST /api/units ────────────────────────────────────────────────────────
exports.createUnit = async (req, res, next) => {
  try {
    const { name, abbreviation, category, description } = req.body;
    if (!name) return errorResponse(res, 'Unit name is required', 400);
    const existing = await Unit.findOne({ where: { name } });
    if (existing) return errorResponse(res, 'Unit already exists', 400);
    const unit = await Unit.create({ name, abbreviation, category, description });
    return successResponse(res, { unit }, 'Unit created', 201);
  } catch (err) { next(err); }
};

// ── PUT /api/units/:unitId ─────────────────────────────────────────────────
exports.updateUnit = async (req, res, next) => {
  try {
    const unit = await Unit.findByPk(req.params.unitId);
    if (!unit) return errorResponse(res, 'Unit not found', 404);
    if (req.body.name && req.body.name !== unit.name) {
      const existing = await Unit.findOne({ where: { name: req.body.name } });
      if (existing) return errorResponse(res, 'Unit name already exists', 400);
    }
    await unit.update(req.body);
    return successResponse(res, { unit }, 'Unit updated');
  } catch (err) { next(err); }
};

// ── DELETE /api/units/:unitId ──────────────────────────────────────────────
exports.deleteUnit = async (req, res, next) => {
  try {
    const unit = await Unit.findByPk(req.params.unitId);
    if (!unit) return errorResponse(res, 'Unit not found', 404);
    await unit.update({ isActive: false });
    return successResponse(res, null, 'Unit deactivated');
  } catch (err) { next(err); }
};