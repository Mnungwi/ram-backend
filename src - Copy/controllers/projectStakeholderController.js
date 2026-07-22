const { ProjectStakeholder, Stakeholder, StakeholderType } = require('../models/index');
const { successResponse, errorResponse } = require('../utils/response');
const { audit } = require('../utils/audit');

const INCLUDE = [
  {
    model: Stakeholder,
    as: 'stakeholder',
    attributes: ['id', 'name', 'organization', 'jobTitle', 'email', 'phone', 'phone2', 'city', 'country'],
  },
  {
    model: StakeholderType,
    as: 'type',
    attributes: ['id', 'name', 'color'],
  },
];

// GET /api/projects/:projectId/stakeholders
exports.listProjectStakeholders = async (req, res, next) => {
  try {
    const where = { projectId: req.params.projectId };
    if (!req.query.all) where.isActive = true;

    const stakeholders = await ProjectStakeholder.findAll({
      where,
      include: INCLUDE,
      order: [
        ['isSignatory', 'DESC'],
        ['isPrimary', 'DESC'],
        ['signatureOrder', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
    return successResponse(res, { stakeholders });
  } catch (err) { next(err); }
};

// GET /api/projects/:projectId/stakeholders/signatories
exports.getSignatories = async (req, res, next) => {
  try {
    const signatories = await ProjectStakeholder.findAll({
      where: { projectId: req.params.projectId, isSignatory: true, isActive: true },
      include: INCLUDE,
      order: [['signatureOrder', 'ASC'], ['isPrimary', 'DESC']],
    });
    return successResponse(res, { signatories });
  } catch (err) { next(err); }
};

// POST /api/projects/:projectId/stakeholders
// Links an existing Stakeholder to this project
exports.addProjectStakeholder = async (req, res, next) => {
  try {
    const { stakeholderId, stakeholderTypeId, role, isSignatory, isPrimary, signatureOrder, startDate, endDate, notes } = req.body;

    // Check if already linked
    const existing = await ProjectStakeholder.findOne({
      where: { projectId: req.params.projectId, stakeholderId, isActive: true },
    });
    if (existing) return errorResponse(res, 'This stakeholder is already linked to this project', 400);

    const ps = await ProjectStakeholder.create({
      projectId: req.params.projectId,
      stakeholderId,
      stakeholderTypeId,
      role,
      isSignatory: isSignatory ?? false,
      isPrimary:   isPrimary   ?? false,
      signatureOrder,
      startDate,
      endDate,
      notes,
      isActive: true,
    });

    await audit({ userId: req.userId, action: 'add_project_stakeholder', resource: 'project_stakeholder', resourceId: ps.id, req, projectId: req.params.projectId });

    const full = await ProjectStakeholder.findByPk(ps.id, { include: INCLUDE });
    return successResponse(res, { stakeholder: full }, 'Stakeholder added to project', 201);
  } catch (err) { next(err); }
};

// PUT /api/projects/:projectId/stakeholders/:psId
// Update the project-specific role/flags
exports.updateProjectStakeholder = async (req, res, next) => {
  try {
    const ps = await ProjectStakeholder.findOne({
      where: { id: req.params.psId, projectId: req.params.projectId },
    });
    if (!ps) return errorResponse(res, 'Project stakeholder not found', 404);
    await ps.update(req.body);
    const full = await ProjectStakeholder.findByPk(ps.id, { include: INCLUDE });
    return successResponse(res, { stakeholder: full }, 'Project stakeholder updated');
  } catch (err) { next(err); }
};

// DELETE /api/projects/:projectId/stakeholders/:psId
exports.removeProjectStakeholder = async (req, res, next) => {
  try {
    const ps = await ProjectStakeholder.findOne({
      where: { id: req.params.psId, projectId: req.params.projectId },
    });
    if (!ps) return errorResponse(res, 'Project stakeholder not found', 404);
    await ps.update({ isActive: false });
    await audit({ userId: req.userId, action: 'remove_project_stakeholder', resource: 'project_stakeholder', resourceId: ps.id, req, projectId: req.params.projectId });
    return successResponse(res, null, 'Stakeholder removed from project');
  } catch (err) { next(err); }
};
