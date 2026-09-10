const { body } = require('express-validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Role, UserRole } = require('../models/index');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { resolveUserPermissions } = require('../utils/permissionResolver');
const { successResponse, errorResponse } = require('../utils/response');
const { audit } = require('../utils/audit');
const { sendMail } = require('../utils/mailer');
const { sendSms } = require('../utils/sms');

// Login OTP (email 2FA step) — off by default so local/dev environments
// without working SMTP aren't locked out. Set OTP_LOGIN_ENABLED=true once
// SMTP is configured to require it for every login (admin + mobile).
const OTP_LOGIN_ENABLED = process.env.OTP_LOGIN_ENABLED === 'true';
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

// Sends the login OTP to BOTH the user's email and their phone (SMS), in
// parallel. Returns { emailSent, smsSent, delivered } — `delivered` is true
// if the code went out on at least one channel, so the caller can still
// let the user proceed as long as one worked.
const generateAndSendOtp = async (user) => {
  const code = String(crypto.randomInt(100000, 999999)); // 6-digit
  const hashedCode = await bcrypt.hash(code, 10);

  await User.update(
    { otpCode: hashedCode, otpExpiresAt: new Date(Date.now() + OTP_TTL_MS), otpAttempts: 0 },
    { where: { id: user.id } },
  );

  const emailBody = `
    <p>Hi ${user.firstName},</p>
    <p>Your login verification code is:</p>
    <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>
    <p>This code expires in 10 minutes. If you did not try to log in, you can ignore this message.</p>
  `;
  const smsText = `${code} is your United Ram login verification code. It expires in 10 minutes. Do not share it with anyone.`;

  const [emailRes, smsRes] = await Promise.allSettled([
    sendMail({ to: user.email, subject: 'Your United Ram login code', html: emailBody }),
    user.phone
      ? sendSms(user.phone, smsText)
      : Promise.resolve({ ok: false, error: 'user has no phone number on file' }),
  ]);

  const emailSent = emailRes.status === 'fulfilled';
  if (!emailSent) console.error('generateAndSendOtp: OTP email failed —', emailRes.reason?.message);

  const smsSent = smsRes.status === 'fulfilled' && smsRes.value?.ok === true;
  if (!smsSent && user.phone) {
    console.error('generateAndSendOtp: OTP SMS failed —', smsRes.status === 'fulfilled' ? smsRes.value?.error : smsRes.reason?.message);
  }

  return { emailSent, smsSent, delivered: emailSent || smsSent };
};

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

    if (OTP_LOGIN_ENABLED) {
      const { emailSent, smsSent, delivered } = await generateAndSendOtp(user);
      await audit({ userId: user.id, action: 'login_otp_requested', resource: 'user', resourceId: user.id, req });

      const channels = [];
      if (emailSent) channels.push('email');
      if (smsSent) channels.push('phone');
      const message = delivered
        ? `Verification code sent to your ${channels.join(' and ')}`
        : 'Verification code generated, but it could not be delivered by email or SMS — contact an administrator';

      return successResponse(res, {
        requiresOtp: true,
        email: user.email,
        emailSent,
        smsSent,
      }, message);
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

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return errorResponse(res, 'email and otp are required', 400);

    const user = await User.scope('withOtp').findOne({ where: { email, isActive: true } });
    if (!user || !user.otpCode) {
      return errorResponse(res, 'No pending login verification for this account', 400);
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return errorResponse(res, 'Verification code has expired, please log in again', 400);
    }

    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      return errorResponse(res, 'Too many incorrect attempts, please log in again', 429);
    }

    const isMatch = await user.compareOtp(otp);
    if (!isMatch) {
      await User.update({ otpAttempts: user.otpAttempts + 1 }, { where: { id: user.id } });
      return errorResponse(res, 'Incorrect verification code', 400);
    }

    const { accessToken, refreshToken } = generateTokenPair(user);

    await User.update(
      { refreshToken, lastLoginAt: new Date(), otpCode: null, otpExpiresAt: null, otpAttempts: 0 },
      { where: { id: user.id } },
    );

    const userWithRoles = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
    });
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

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return errorResponse(res, 'Email is required', 400);

    const user = await User.findOne({ where: { email, isActive: true } });
    if (!user) return successResponse(res, null, 'If that account exists, a new code has been sent.');

    const { emailSent, smsSent, delivered } = await generateAndSendOtp(user);
    const channels = [];
    if (emailSent) channels.push('email');
    if (smsSent) channels.push('phone');
    return successResponse(res, { emailSent, smsSent }, delivered
      ? `A new verification code has been sent to your ${channels.join(' and ')}`
      : 'Could not send the verification code by email or SMS — contact an administrator');
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

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'No image file uploaded', 400);

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await User.update({ avatar: avatarUrl }, { where: { id: req.userId } });
    const updated = await User.findByPk(req.userId);

    await audit({ userId: req.userId, action: 'update_avatar', resource: 'user', resourceId: req.userId, req });
    return successResponse(res, { user: updated, avatar: avatarUrl }, 'Profile picture updated');
  } catch (err) {
    next(err);
  }
};

// A stored signature image lets someone else pick this user as the
// "Signing As" identity on Letters > Compose without them having to log in
// and personally approve every letter — the signature is stamped onto the
// PDF/preview automatically. Only the user themselves can upload their own
// (reuses the avatarUpload middleware — same size/type limits, same dir).
const uploadSignature = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'No image file uploaded', 400);

    const signatureUrl = `/uploads/avatars/${req.file.filename}`;
    await User.update({ signatureImage: signatureUrl }, { where: { id: req.userId } });
    const updated = await User.findByPk(req.userId);

    await audit({ userId: req.userId, action: 'update_signature', resource: 'user', resourceId: req.userId, req });
    return successResponse(res, { user: updated, signatureImage: signatureUrl }, 'Signature updated');
  } catch (err) {
    next(err);
  }
};

const deleteSignature = async (req, res, next) => {
  try {
    await User.update({ signatureImage: null }, { where: { id: req.userId } });
    const updated = await User.findByPk(req.userId);
    await audit({ userId: req.userId, action: 'delete_signature', resource: 'user', resourceId: req.userId, req });
    return successResponse(res, { user: updated }, 'Signature removed');
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

    // NOTE: individualHooks is required so the beforeUpdate hook (bcrypt hashing)
    // actually runs — Sequelize's static/bulk .update() skips instance hooks otherwise.
    await User.update(
      { password: newPassword, mustChangePassword: false },
      { where: { id: req.userId }, individualHooks: true },
    );
    await audit({ userId: req.userId, action: 'change_password', resource: 'user', resourceId: req.userId, req });
    return successResponse(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

// ─── FORGOT / RESET PASSWORD ───────────────────────────────────────────────────

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return errorResponse(res, 'Email is required', 400);

    const user = await User.unscoped().findOne({ where: { email, isActive: true } });
    // Always respond with the same message, whether or not the email exists,
    // so this endpoint can't be used to enumerate registered accounts.
    const genericMessage = 'If that email is registered, a password reset link has been sent.';
    if (!user) return successResponse(res, null, genericMessage);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await User.update(
      {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
      { where: { id: user.id } },
    );

    const resetUrl = `${process.env.APP_URL || 'http://localhost:4200'}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    try {
      await sendMail({
        to: email,
        subject: 'Reset your RAM Project Management password',
        html: `
          <p>Hi ${user.firstName},</p>
          <p>We received a request to reset your password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}">Reset your password</a></p>
          <p>If you did not request this, you can safely ignore this email.</p>
        `,
      });
    } catch (mailErr) {
      console.error('forgotPassword: failed to send reset email —', mailErr.message);
    }

    await audit({ userId: user.id, action: 'forgot_password_request', resource: 'user', resourceId: user.id, req });
    return successResponse(res, null, genericMessage);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return errorResponse(res, 'email, token and newPassword are required', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.unscoped().findOne({
      where: {
        email,
        passwordResetToken: hashedToken,
        passwordResetExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) return errorResponse(res, 'Invalid or expired reset link', 400);

    await User.update(
      {
        password: newPassword,
        mustChangePassword: false,
        passwordResetToken: null,
        passwordResetExpires: null,
        refreshToken: null, // force re-login everywhere
      },
      { where: { id: user.id }, individualHooks: true },
    );

    await audit({ userId: user.id, action: 'reset_password', resource: 'user', resourceId: user.id, req });
    return successResponse(res, null, 'Password has been reset. You can now log in.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register, login, verifyOtp, resendOtp, refresh, logout, getProfile, updateProfile, uploadAvatar, uploadSignature, deleteSignature, changePassword,
  forgotPassword, resetPassword,
  registerRules, loginRules,
};
