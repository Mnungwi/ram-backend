const { Client, Project } = require('../models/index');
const { successResponse, errorResponse, paginatedResponse, getPagination } = require('../utils/response');
const { audit } = require('../utils/audit');
const { Op } = require('sequelize');

// GET /api/clients
exports.listClients = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search, isActive } = req.query;
    const where = {};

    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { contactPerson: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Client.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit,
      offset,
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

// GET /api/clients/:clientId
exports.getClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.clientId, {
      include: [{ model: Project, as: 'projects', attributes: ['id', 'projectCode', 'name', 'status', 'progress', 'totalBudget'] }],
    });
    if (!client) return errorResponse(res, 'Client not found', 404);
    return successResponse(res, { client });
  } catch (err) { next(err); }
};

// POST /api/clients
exports.createClient = async (req, res, next) => {
  try {
    const client = await Client.create({ ...req.body, createdById: req.userId });
    await audit({ userId: req.userId, action: 'create_client', resource: 'client', resourceId: client.id, req });
    return successResponse(res, { client }, 'Client created', 201);
  } catch (err) { next(err); }
};

// PUT /api/clients/:clientId
exports.updateClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.clientId);
    if (!client) return errorResponse(res, 'Client not found', 404);
    await client.update(req.body);
    await audit({ userId: req.userId, action: 'update_client', resource: 'client', resourceId: client.id, req });
    return successResponse(res, { client }, 'Client updated');
  } catch (err) { next(err); }
};

// DELETE /api/clients/:clientId
exports.deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.clientId);
    if (!client) return errorResponse(res, 'Client not found', 404);

    const projectCount = await Project.count({ where: { clientId: client.id } });
    if (projectCount > 0) {
      return errorResponse(res, `Cannot delete client: ${projectCount} project(s) are linked to this client. Reassign or remove those projects first.`, 400);
    }

    await client.destroy();
    await audit({ userId: req.userId, action: 'delete_client', resource: 'client', resourceId: client.id, req });
    return successResponse(res, null, 'Client deleted');
  } catch (err) { next(err); }
};
