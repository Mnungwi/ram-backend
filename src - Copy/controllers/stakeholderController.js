const { Stakeholder, StakeholderType, ProjectStakeholder, Project } = require('../models/index');
const { successResponse, errorResponse, paginatedResponse, getPagination } = require('../utils/response');
const { audit } = require('../utils/audit');
const { Op } = require('sequelize');

const INCLUDE = [
  { model: StakeholderType, as: 'defaultType', attributes: ['id', 'name', 'color'] },
];

// GET /api/stakeholders
exports.listStakeholders = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search, stakeholderTypeId } = req.query;
    const where = { isActive: true };

    if (stakeholderTypeId) where.stakeholderTypeId = stakeholderTypeId;
    if (search) {
      where[Op.or] = [
        { name:         { [Op.like]: `%${search}%` } },
        { organization: { [Op.like]: `%${search}%` } },
        { email:        { [Op.like]: `%${search}%` } },
        { jobTitle:     { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Stakeholder.findAndCountAll({
      where,
      include: INCLUDE,
      order: [['name', 'ASC']],
      limit,
      offset,
    });
    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

// GET /api/stakeholders/:stakeholderId
exports.getStakeholder = async (req, res, next) => {
  try {
    const stakeholder = await Stakeholder.findByPk(req.params.stakeholderId, {
      include: [
        ...INCLUDE,
        {
          model: ProjectStakeholder,
          as: 'projectLinks',
          where: { isActive: true },
          required: false,
          include: [
            { model: Project, as: 'project', attributes: ['id', 'projectCode', 'name', 'status'] },
            { model: StakeholderType, as: 'type', attributes: ['id', 'name', 'color'] },
          ],
        },
      ],
    });
    if (!stakeholder) return errorResponse(res, 'Stakeholder not found', 404);
    return successResponse(res, { stakeholder });
  } catch (err) { next(err); }
};

// POST /api/stakeholders
exports.createStakeholder = async (req, res, next) => {
  try {
    const stakeholder = await Stakeholder.create({ ...req.body, createdById: req.userId });
    await audit({ userId: req.userId, action: 'create_stakeholder', resource: 'stakeholder', resourceId: stakeholder.id, req });
    const full = await Stakeholder.findByPk(stakeholder.id, { include: INCLUDE });
    return successResponse(res, { stakeholder: full }, 'Stakeholder created', 201);
  } catch (err) { next(err); }
};

// PUT /api/stakeholders/:stakeholderId
exports.updateStakeholder = async (req, res, next) => {
  try {
    const stakeholder = await Stakeholder.findByPk(req.params.stakeholderId);
    if (!stakeholder) return errorResponse(res, 'Stakeholder not found', 404);
    await stakeholder.update(req.body);
    const full = await Stakeholder.findByPk(stakeholder.id, { include: INCLUDE });
    return successResponse(res, { stakeholder: full }, 'Stakeholder updated');
  } catch (err) { next(err); }
};

// DELETE /api/stakeholders/:stakeholderId
exports.deleteStakeholder = async (req, res, next) => {
  try {
    const stakeholder = await Stakeholder.findByPk(req.params.stakeholderId);
    if (!stakeholder) return errorResponse(res, 'Stakeholder not found', 404);
    await stakeholder.update({ isActive: false });
    return successResponse(res, null, 'Stakeholder deactivated');
  } catch (err) { next(err); }
};
