const { ActivityType } = require('../models/index');
const { successResponse, errorResponse } = require('../utils/response');
const { audit } = require('../utils/audit');

// GET /api/activity-types
exports.listTypes = async (req, res, next) => {
  try {
    const where = req.query.all ? {} : { isActive: true };
    const types = await ActivityType.findAll({
      where,
      order: [['order', 'ASC'], ['name', 'ASC']],
    });
    return successResponse(res, { types });
  } catch (err) { next(err); }
};

// GET /api/activity-types/:typeId
exports.getType = async (req, res, next) => {
  try {
    const type = await ActivityType.findByPk(req.params.typeId);
    if (!type) return errorResponse(res, 'Activity type not found', 404);
    return successResponse(res, { type });
  } catch (err) { next(err); }
};

// POST /api/activity-types
exports.createType = async (req, res, next) => {
  try {
    const type = await ActivityType.create(req.body);
    await audit({
      userId: req.userId, action: 'create_activity_type',
      resource: 'activity_type', resourceId: type.id, req,
    });
    return successResponse(res, { type }, 'Activity type created', 201);
  } catch (err) { next(err); }
};

// PUT /api/activity-types/:typeId
exports.updateType = async (req, res, next) => {
  try {
    const type = await ActivityType.findByPk(req.params.typeId);
    if (!type) return errorResponse(res, 'Activity type not found', 404);
    await type.update(req.body);
    await audit({
      userId: req.userId, action: 'update_activity_type',
      resource: 'activity_type', resourceId: type.id, req,
    });
    return successResponse(res, { type }, 'Activity type updated');
  } catch (err) { next(err); }
};

// DELETE /api/activity-types/:typeId  (soft delete)
exports.deleteType = async (req, res, next) => {
  try {
    const type = await ActivityType.findByPk(req.params.typeId);
    if (!type) return errorResponse(res, 'Activity type not found', 404);
    await type.update({ isActive: false });
    await audit({
      userId: req.userId, action: 'delete_activity_type',
      resource: 'activity_type', resourceId: type.id, req,
    });
    return successResponse(res, null, 'Activity type deactivated');
  } catch (err) { next(err); }
};
