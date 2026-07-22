const { Role, Permission, UserPermission, UserRole } = require('../models/index');

/**
 * Resolve all effective permissions for a user.
 * Returns a Set<string> of permission name strings, e.g. {"project:view", "finance:approve"}.
 *
 * Resolution order:
 *  1. Collect permissions from all applicable roles (global + project-scoped)
 *  2. Apply direct user permission grants (add to set)
 *  3. Apply direct user permission denies (remove from set)
 */
const resolveUserPermissions = async (userId, projectId = null) => {
  const permSet = new Set();

  // ── 1. Role permissions ─────────────────────────────────────────────────────
  // Load all UserRole rows for this user (no eager-loading Role here to avoid the
  // broken intermediate include; we do a separate Role lookup per row instead)
  const userRoles = await UserRole.findAll({ where: { userId } });

  // Keep only rows that apply to this scope:
  //   - projectId is NULL  → global role, always applies
  //   - projectId matches  → project-scoped role, applies when scope matches
  const applicableRoles = userRoles.filter(ur =>
    ur.projectId === null || (projectId && ur.projectId === projectId)
  );

  for (const ur of applicableRoles) {
    const role = await Role.findByPk(ur.roleId, {
      include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
    });
    if (role && role.permissions) {
      role.permissions.forEach(p => permSet.add(p.name));
    }
  }

  // ── 2 & 3. Direct user permission overrides ──────────────────────────────────
  const directPerms = await UserPermission.findAll({
    where: { userId },
    include: [{ model: Permission, as: 'permission' }],  // alias must match belongsTo alias
  });

  for (const up of directPerms) {
    // Apply only if it's global (null) or matches the requested projectId scope
    const scopeApplies = up.projectId === null || (projectId && up.projectId === projectId);
    if (!scopeApplies) continue;

    const permName = up.permission && up.permission.name;
    if (!permName) continue;

    if (up.type === 'grant') {
      permSet.add(permName);
    } else if (up.type === 'deny') {
      permSet.delete(permName);
    }
  }

  return permSet;
};

/**
 * Check if a user has a single specific permission.
 */
const userHasPermission = async (userId, permissionName, projectId = null) => {
  const perms = await resolveUserPermissions(userId, projectId);
  return perms.has(permissionName);
};

module.exports = { resolveUserPermissions, userHasPermission };
