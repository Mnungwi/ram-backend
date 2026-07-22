const { StakeholderType } = require('../models/index');
const { successResponse, errorResponse } = require('../utils/response');
const { audit } = require('../utils/audit');

// GET /api/stakeholder-types
exports.listTypes = async (req, res, next) => {
  try {
    const types = await StakeholderType.findAll({
      where: req.query.all ? {} : { isActive: true },
      order: [['order', 'ASC'], ['name', 'ASC']],
    });
    return successResponse(res, { types });
  } catch (err) { next(err); }
};

// POST /api/stakeholder-types
exports.createType = async (req, res, next) => {
  try {
    const type = await StakeholderType.create(req.body);
    await audit({ userId: req.userId, action: 'create_stakeholder_type', resource: 'stakeholder_type', resourceId: type.id, req });
    return successResponse(res, { type }, 'Stakeholder type created', 201);
  } catch (err) { next(err); }
};

// PUT /api/stakeholder-types/:typeId
exports.updateType = async (req, res, next) => {
  try {
    const type = await StakeholderType.findByPk(req.params.typeId);
    if (!type) return errorResponse(res, 'Stakeholder type not found', 404);
    await type.update(req.body);
    return successResponse(res, { type }, 'Stakeholder type updated');
  } catch (err) { next(err); }
};

// DELETE /api/stakeholder-types/:typeId
exports.deleteType = async (req, res, next) => {
  try {
    const type = await StakeholderType.findByPk(req.params.typeId);
    if (!type) return errorResponse(res, 'Stakeholder type not found', 404);
    // Soft delete
    await type.update({ isActive: false });
    return successResponse(res, null, 'Stakeholder type deactivated');
  } catch (err) { next(err); }
};
