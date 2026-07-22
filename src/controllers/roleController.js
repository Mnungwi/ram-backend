const { Role, Permission, RolePermission } = require("../models/index");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPagination,
} = require("../utils/response");
const { audit } = require("../utils/audit");

// ─── ROLES ───────────────────────────────────────────────────────────────────

const listRoles = async (req, res, next) => {
  try {
    const roles = await Role.findAll({
      where: { isActive: true },
      include: [
        { model: Permission, as: "permissions", through: { attributes: [] } },
      ],
      order: [["name", "ASC"]],
    });
    return successResponse(res, { roles });
  } catch (err) {
    next(err);
  }
};

const getRole = async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.roleId, {
      include: [
        { model: Permission, as: "permissions", through: { attributes: [] } },
      ],
    });
    if (!role) return errorResponse(res, "Role not found", 404);
    return successResponse(res, { role });
  } catch (err) {
    next(err);
  }
};

const createRole = async (req, res, next) => {
  try {
    const { name, description, color, permissionIds } = req.body;

    const role = await Role.create({ name, description, color });

    if (permissionIds && permissionIds.length > 0) {
      const perms = await Permission.findAll({ where: { id: permissionIds } });
      await RolePermission.bulkCreate(
        perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
        { ignoreDuplicates: true },
      );
    }

    await audit({
      userId: req.userId,
      action: "create_role",
      resource: "role",
      resourceId: role.id,
      newValues: { name },
      req,
    });
    const fullRole = await Role.findByPk(role.id, {
      include: [
        { model: Permission, as: "permissions", through: { attributes: [] } },
      ],
    });
    return successResponse(res, { role: fullRole }, "Role created", 201);
  } catch (err) {
    next(err);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.roleId);
    if (!role) return errorResponse(res, "Role not found", 404);
    if (role.isSystem)
      return errorResponse(res, "Cannot modify system roles", 403);

    const { name, description, color, permissionIds } = req.body;
    await role.update({ name, description, color });

    if (permissionIds !== undefined) {
      // Replace all permissions
      await RolePermission.destroy({ where: { roleId: role.id } });
      if (permissionIds.length > 0) {
        const perms = await Permission.findAll({
          where: { id: permissionIds },
        });
        await RolePermission.bulkCreate(
          perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
          { ignoreDuplicates: true },
        );
      }
    }

    await audit({
      userId: req.userId,
      action: "update_role",
      resource: "role",
      resourceId: role.id,
      req,
    });
    const updated = await Role.findByPk(role.id, {
      include: [
        { model: Permission, as: "permissions", through: { attributes: [] } },
      ],
    });
    return successResponse(res, { role: updated }, "Role updated");
  } catch (err) {
    next(err);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.roleId);
    if (!role) return errorResponse(res, "Role not found", 404);
    if (role.isSystem)
      return errorResponse(res, "Cannot delete system roles", 403);

    await role.update({ isActive: false });
    await audit({
      userId: req.userId,
      action: "delete_role",
      resource: "role",
      resourceId: role.id,
      req,
    });
    return successResponse(res, null, "Role deleted");
  } catch (err) {
    next(err);
  }
};

// ─── PERMISSIONS ──────────────────────────────────────────────────────────────

const listPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.findAll({
      order: [
        ["group", "ASC"],
        ["resource", "ASC"],
        ["action", "ASC"],
      ],
    });

    // Group by group/resource for easier UI consumption
    const grouped = permissions.reduce((acc, p) => {
      const key = p.group || p.resource;
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});

    return successResponse(res, { permissions, grouped });
  } catch (err) {
    next(err);
  }
};

const syncRolePermissions = async (req, res, next) => {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body;

    const role = await Role.findByPk(roleId);
    if (!role) return errorResponse(res, "Role not found", 404);
    // if (
    //   role.isSystem &&
    //   role.slug === "super_admin" &&
    //   req.userRole !== "super_admin"
    // ) {
    //   return errorResponse(res, "Cannot modify system role permissions", 403);
    // }

    
    // if (role.isSystem && !req.user?.isSuperAdmin) {
    //   return errorResponse(res, "Cannot modify system role permissions", 403);
    // }

    await RolePermission.destroy({ where: { roleId } });

    if (permissionIds && permissionIds.length > 0) {
      const perms = await Permission.findAll({ where: { id: permissionIds } });
      await RolePermission.bulkCreate(
        perms.map((p) => ({ roleId, permissionId: p.id })),
        { ignoreDuplicates: true },
      );
    }

    await audit({
      userId: req.userId,
      action: "sync_role_permissions",
      resource: "role",
      resourceId: roleId,
      newValues: { permissionIds },
      req,
    });
    return successResponse(res, null, "Role permissions updated");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  listPermissions,
  syncRolePermissions,
};

// const { Role, Permission, RolePermission } = require('../models/index');
// const { successResponse, errorResponse, paginatedResponse, getPagination } = require('../utils/response');
// const { audit } = require('../utils/audit');

// // ─── ROLES ───────────────────────────────────────────────────────────────────

// const listRoles = async (req, res, next) => {
//   try {
//     const roles = await Role.findAll({
//       where: { isActive: true },
//       include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
//       order: [['name', 'ASC']],
//     });
//     return successResponse(res, { roles });
//   } catch (err) {
//     next(err);
//   }
// };

// const getRole = async (req, res, next) => {
//   try {
//     const role = await Role.findByPk(req.params.roleId, {
//       include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
//     });
//     if (!role) return errorResponse(res, 'Role not found', 404);
//     return successResponse(res, { role });
//   } catch (err) {
//     next(err);
//   }
// };

// const createRole = async (req, res, next) => {
//   try {
//     const { name, description, color, permissionIds } = req.body;

//     const role = await Role.create({ name, description, color });

//     if (permissionIds && permissionIds.length > 0) {
//       const perms = await Permission.findAll({ where: { id: permissionIds } });
//       await RolePermission.bulkCreate(
//         perms.map(p => ({ roleId: role.id, permissionId: p.id })),
//         { ignoreDuplicates: true }
//       );
//     }

//     await audit({ userId: req.userId, action: 'create_role', resource: 'role', resourceId: role.id, newValues: { name }, req });
//     const fullRole = await Role.findByPk(role.id, {
//       include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
//     });
//     return successResponse(res, { role: fullRole }, 'Role created', 201);
//   } catch (err) {
//     next(err);
//   }
// };

// const updateRole = async (req, res, next) => {
//   try {
//     const role = await Role.findByPk(req.params.roleId);
//     if (!role) return errorResponse(res, 'Role not found', 404);
//     if (role.isSystem) return errorResponse(res, 'Cannot modify system roles', 403);

//     const { name, description, color, permissionIds } = req.body;
//     await role.update({ name, description, color });

//     if (permissionIds !== undefined) {
//       // Replace all permissions
//       await RolePermission.destroy({ where: { roleId: role.id } });
//       if (permissionIds.length > 0) {
//         const perms = await Permission.findAll({ where: { id: permissionIds } });
//         await RolePermission.bulkCreate(
//           perms.map(p => ({ roleId: role.id, permissionId: p.id })),
//           { ignoreDuplicates: true }
//         );
//       }
//     }

//     await audit({ userId: req.userId, action: 'update_role', resource: 'role', resourceId: role.id, req });
//     const updated = await Role.findByPk(role.id, {
//       include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
//     });
//     return successResponse(res, { role: updated }, 'Role updated');
//   } catch (err) {
//     next(err);
//   }
// };

// const deleteRole = async (req, res, next) => {
//   try {
//     const role = await Role.findByPk(req.params.roleId);
//     if (!role) return errorResponse(res, 'Role not found', 404);
//     if (role.isSystem) return errorResponse(res, 'Cannot delete system roles', 403);

//     await role.update({ isActive: false });
//     await audit({ userId: req.userId, action: 'delete_role', resource: 'role', resourceId: role.id, req });
//     return successResponse(res, null, 'Role deleted');
//   } catch (err) {
//     next(err);
//   }
// };

// // ─── PERMISSIONS ──────────────────────────────────────────────────────────────

// const listPermissions = async (req, res, next) => {
//   try {
//     const permissions = await Permission.findAll({ order: [['group', 'ASC'], ['resource', 'ASC'], ['action', 'ASC']] });

//     // Group by group/resource for easier UI consumption
//     const grouped = permissions.reduce((acc, p) => {
//       const key = p.group || p.resource;
//       if (!acc[key]) acc[key] = [];
//       acc[key].push(p);
//       return acc;
//     }, {});

//     return successResponse(res, { permissions, grouped });
//   } catch (err) {
//     next(err);
//   }
// };

// const syncRolePermissions = async (req, res, next) => {
//   try {
//     const { roleId } = req.params;
//     const { permissionIds } = req.body;

//     const role = await Role.findByPk(roleId);
//     if (!role) return errorResponse(res, 'Role not found', 404);
//     if (role.isSystem && !req.user?.isSuperAdmin) {
//       return errorResponse(res, 'Cannot modify system role permissions', 403);
//     }

//     await RolePermission.destroy({ where: { roleId } });

//     if (permissionIds && permissionIds.length > 0) {
//       const perms = await Permission.findAll({ where: { id: permissionIds } });
//       await RolePermission.bulkCreate(
//         perms.map(p => ({ roleId, permissionId: p.id })),
//         { ignoreDuplicates: true }
//       );
//     }

//     await audit({ userId: req.userId, action: 'sync_role_permissions', resource: 'role', resourceId: roleId, newValues: { permissionIds }, req });
//     return successResponse(res, null, 'Role permissions updated');
//   } catch (err) {
//     next(err);
//   }
// };

// module.exports = {
//   listRoles, getRole, createRole, updateRole, deleteRole,
//   listPermissions, syncRolePermissions,
// };
