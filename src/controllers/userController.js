const { Op } = require('sequelize');
const { User, Role, Permission, UserRole, UserPermission } = require('../models/index');
const { resolveUserPermissions } = require('../utils/permissionResolver');
const { successResponse, errorResponse, paginatedResponse, getPagination } = require('../utils/response');
const { audit } = require('../utils/audit');

const listUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search, isActive } = req.query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName:  { [Op.like]: `%${search}%` } },
        { email:     { [Op.like]: `%${search}%` } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return paginatedResponse(res, rows, count, page, limit);
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
    });
    if (!user) return errorResponse(res, 'User not found', 404);

    const perms = await resolveUserPermissions(user.id);
    return successResponse(res, { user, permissions: Array.from(perms) });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, jobTitle, department, roleIds } = req.body;

    const existing = await User.unscoped().findOne({ where: { email } });
    if (existing) return errorResponse(res, 'Email already exists', 409);

    const user = await User.create({ firstName, lastName, email, password, phone, jobTitle, department });

    // Assign roles
    if (roleIds && roleIds.length > 0) {
      const roles = await Role.findAll({ where: { id: roleIds } });
      const entries = roles.map(r => ({ userId: user.id, roleId: r.id, assignedById: req.userId }));
      await UserRole.bulkCreate(entries, { ignoreDuplicates: true });
    }

    await audit({ userId: req.userId, action: 'create_user', resource: 'user', resourceId: user.id, newValues: { email }, req });
    return successResponse(res, { user }, 'User created', 201);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) return errorResponse(res, 'User not found', 404);

    const allowed = ['firstName', 'lastName', 'phone', 'jobTitle', 'department', 'isActive'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const old = user.toJSON();
    await User.update(updates, { where: { id: userId } });

    await audit({ userId: req.userId, action: 'update_user', resource: 'user', resourceId: userId, oldValues: old, newValues: updates, req });
    return successResponse(res, { user: await User.findByPk(userId) }, 'User updated');
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return errorResponse(res, 'User not found', 404);
    if (user.id === req.userId) return errorResponse(res, 'Cannot delete your own account', 400);

    await User.update({ isActive: false }, { where: { id: req.params.userId } });
    await audit({ userId: req.userId, action: 'delete_user', resource: 'user', resourceId: req.params.userId, req });
    return successResponse(res, null, 'User deactivated');
  } catch (err) {
    next(err);
  }
};

// ─── ROLE ASSIGNMENT ──────────────────────────────────────────────────────────

const assignRoles = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { roleIds, projectId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return errorResponse(res, 'User not found', 404);

    const roles = await Role.findAll({ where: { id: roleIds } });
    if (roles.length !== roleIds.length) return errorResponse(res, 'One or more roles not found', 404);

    // Remove existing roles for this scope
    await UserRole.destroy({ where: { userId, projectId: projectId || null } });

    // Re-assign
    const entries = roles.map(r => ({ userId, roleId: r.id, projectId: projectId || null, assignedById: req.userId }));
    await UserRole.bulkCreate(entries);

    await audit({ userId: req.userId, action: 'assign_roles', resource: 'user', resourceId: userId, newValues: { roleIds, projectId }, req });
    return successResponse(res, null, 'Roles assigned successfully');
  } catch (err) {
    next(err);
  }
};

// ─── DIRECT PERMISSION OVERRIDE ───────────────────────────────────────────────

const setDirectPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { permissions, projectId } = req.body;
    // permissions: [{ permissionId, type: 'grant'|'deny' }]

    const user = await User.findByPk(userId);
    if (!user) return errorResponse(res, 'User not found', 404);

    // Clear existing direct perms for this scope
    await UserPermission.destroy({ where: { userId, projectId: projectId || null } });

    if (permissions && permissions.length > 0) {
      const entries = permissions.map(p => ({
        userId,
        permissionId: p.permissionId,
        projectId: projectId || null,
        type: p.type || 'grant',
        grantedById: req.userId,
      }));
      await UserPermission.bulkCreate(entries, { ignoreDuplicates: true });
    }

    await audit({ userId: req.userId, action: 'set_direct_permissions', resource: 'user', resourceId: userId, newValues: { permissions, projectId }, req });
    return successResponse(res, null, 'Permissions updated');
  } catch (err) {
    next(err);
  }
};

const getUserPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { projectId } = req.query;

    const user = await User.findByPk(userId);
    if (!user) return errorResponse(res, 'User not found', 404);

    const perms = await resolveUserPermissions(userId, projectId || null);
    return successResponse(res, { userId, permissions: Array.from(perms) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listUsers, getUser, createUser, updateUser, deleteUser,
  assignRoles, setDirectPermissions, getUserPermissions,
};
