const { ProjectPhase, Activity } = require("../models/index");
const { successResponse, errorResponse } = require("../utils/response");
const { audit } = require("../utils/audit");

// GET /api/phases — phases zote (na project info)
exports.listAllPhases = async (req, res, next) => {
  try {
    const phases = await ProjectPhase.findAll({
      order: [["order", "ASC"]],
    });
    return successResponse(res, { phases });
  } catch (err) {
    next(err);
  }
};

// POST /api/phases
exports.createPhaseGlobal = async (req, res, next) => {
  try {
    if (!req.body.order) {
      const count = await ProjectPhase.count();
      req.body.order = count + 1;
    }
    const phase = await ProjectPhase.create({
      name: req.body.name,
      description: req.body.description || null,
      order: req.body.order,
    });
    return successResponse(res, { phase }, "Phase created", 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/phases/:id
exports.updatePhaseGlobal = async (req, res, next) => {
  try {
    const phase = await ProjectPhase.findByPk(req.params.id);
    if (!phase) return errorResponse(res, 'Phase not found', 404);
    await phase.update({
      name:        req.body.name        ?? phase.name,
      description: req.body.description ?? phase.description,
      order:       req.body.order       ?? phase.order,
    });
    return successResponse(res, { phase }, 'Phase updated');
  } catch (err) { next(err); }
};

// DELETE /api/phases/:id
exports.deletePhaseGlobal = async (req, res, next) => {
  try {
    const phase = await ProjectPhase.findByPk(req.params.id);
    if (!phase) return errorResponse(res, 'Phase not found', 404);
    const activityCount = await Activity.count({ where: { phaseId: phase.id } });
    if (activityCount > 0) {
      return errorResponse(res, `Cannot delete: ${activityCount} activity(ies) linked.`, 400);
    }
    await phase.destroy();
    return successResponse(res, null, 'Phase deleted');
  } catch (err) { next(err); }
};