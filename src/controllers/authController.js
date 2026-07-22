const { body } = require('express-validator');
const { User, Role, UserRole } = require('../models/index');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { resolveUserPermissions } = require('../utils/permissionResolver');
const { successResponse, errorResponse } = require('../utils/response');
const { audit } = require('../utils/audit');

// ─── VALIDATION RULES ────────────────────────────────────────────────────────

const registerRules = [
  body('firstName').trim().notEmpty().isLength({ min: 2, max: 100 }),
  body('lastName').trim().notEmpty().isLength({ min: 2, max: 100 }),
  body('email').trim().isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional().isMobilePhone(),
  body('jobTitle').optional().trim(),
  body('department').optional().trim(),
];

const loginRules = [
  body('email').trim().isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

// ─── CONTROLLER METHODS ───────────────────────────────────────────────────────

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, jobTitle, department } = req.body;

    const existing = await User.unscoped().findOne({ where: { email } });
    if (existing) {
      return errorResponse(res, 'Email already registered', 409);
    }

    const user = await User.create({ firstName, lastName, email, password, phone, jobTitle, department });

    // Assign default 'viewer' role
    const viewerRole = await Role.findOne({ where: { slug: 'viewer' } });
    if (viewerRole) {
      await UserRole.create({ userId: user.id, roleId: viewerRole.id });
    }

    await audit({ userId: user.id, action: 'register', resource: 'user', resourceId: user.id, req });

    const { accessToken, refreshToken } = generateTokenPair(user);
    await User.update({ refreshToken }, { where: { id: user.id } });

    return successResponse(res, { user, accessToken, refreshToken }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.scope('withPassword').findOne({ where: { email, isActive: true } });
    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const { accessToken, refreshToken } = generateTokenPair(user);

    await User.update(
      { refreshToken, lastLoginAt: new Date() },
      { where: { id: user.id } }
    );

    // Load roles for response
    const userWithRoles = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
    });

    // Load permissions
    const perms = await resolveUserPermissions(user.id);

    await audit({ userId: user.id, action: 'login', resource: 'user', resourceId: user.id, req });

    return successResponse(res, {
      user: userWithRoles,
      permissions: Array.from(perms),
      accessToken,
      refreshToken,
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, 'Refresh token required', 400);

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return errorResponse(res, 'Invalid or expired refresh token', 401);
    }

    const user = await User.scope('withTokens').findOne({
      where: { id: decoded.sub, refreshToken, isActive: true },
    });

    if (!user) return errorResponse(res, 'Invalid refresh token', 401);

    const tokens = generateTokenPair(user);
    await User.update({ refreshToken: tokens.refreshToken }, { where: { id: user.id } });

    return successResponse(res, tokens, 'Token refreshed');
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await User.update({ refreshToken: null }, { where: { id: req.userId } });
    await audit({ userId: req.userId, action: 'logout', resource: 'user', resourceId: req.userId, req });
    return successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
    });
    const perms = await resolveUserPermissions(req.userId);
    return successResponse(res, { user, permissions: Array.from(perms) });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['firstName', 'lastName', 'phone', 'jobTitle', 'department', 'avatar'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    await User.update(updates, { where: { id: req.userId } });
    const updated = await User.findByPk(req.userId);

    await audit({ userId: req.userId, action: 'update_profile', resource: 'user', resourceId: req.userId, req });
    return successResponse(res, { user: updated }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.scope('withPassword').findByPk(req.userId);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return errorResponse(res, 'Current password is incorrect', 400);

    await User.update({ password: newPassword }, { where: { id: req.userId } });
    await audit({ userId: req.userId, action: 'change_password', resource: 'user', resourceId: req.userId, req });
    return successResponse(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout, getProfile, updateProfile, changePassword, registerRules, loginRules };
