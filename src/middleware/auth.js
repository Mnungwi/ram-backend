const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../models/index');
const { errorResponse } = require('../utils/response');
const { userHasPermission, resolveUserPermissions } = require('../utils/permissionResolver');

/**
 * Authenticate: verify JWT and attach user to req
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return errorResponse(res, 'Authentication required. Please provide a valid token.', 401);
    }
    const decoded = verifyAccessToken(token);

    const user = await User.findOne({
      where: { id: decoded.sub, isActive: true },
    });

    if (!user) {
      return errorResponse(res, 'User not found or account is inactive.', 401);
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token has expired. Please refresh your token.', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token. Please log in again.', 401);
    }
    return errorResponse(res, 'Authentication failed.', 401);
  }
};

/**
 * Authorize by permission name(s).
 * Usage: authorize('project:view') or authorize(['project:view', 'project:update'])
 * Optionally scope to a project: uses req.params.projectId or req.body.projectId
 */
const authorize = (...requiredPermissions) => {
  // Flatten in case array was passed
  const permissions = requiredPermissions.flat();

  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.body.projectId || null;
      const userPerms = await resolveUserPermissions(req.userId, projectId);

      // Check if user has ALL required permissions
      const missing = permissions.filter(p => !userPerms.has(p));

      if (missing.length > 0) {
        return errorResponse(
          res,
          `Access denied. Missing permission(s): ${missing.join(', ')}`,
          403
        );
      }

      // Attach resolved perms to req for downstream use
      req.userPermissions = userPerms;
      next();
    } catch (err) {
      console.error('[Authorize Error]', err);
      return errorResponse(res, 'Authorization check failed.', 500);
    }
  };
};

/**
 * Authorize if user has ANY of the given permissions (OR logic)
 */
const authorizeAny = (...requiredPermissions) => {
  const permissions = requiredPermissions.flat();

  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.body.projectId || null;
      const userPerms = await resolveUserPermissions(req.userId, projectId);

      const hasAny = permissions.some(p => userPerms.has(p));

      if (!hasAny) {
        return errorResponse(
          res,
          `Access denied. Requires one of: ${permissions.join(', ')}`,
          403
        );
      }

      req.userPermissions = userPerms;
      next();
    } catch (err) {
      return errorResponse(res, 'Authorization check failed.', 500);
    }
  };
};

/**
 * Require super_admin or admin role slug
 */
const requireAdmin = async (req, res, next) => {
  try {
    const { User: UserModel, Role } = require('../models/index');
    const user = await UserModel.findByPk(req.userId, {
      include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
    });

    const isAdmin = user.roles.some(r => ['super_admin', 'admin'].includes(r.slug));
    if (!isAdmin) {
      return errorResponse(res, 'Admin access required.', 403);
    }
    next();
  } catch (err) {
    return errorResponse(res, 'Authorization failed.', 500);
  }
};

module.exports = { authenticate, authorize, authorizeAny, requireAdmin };
