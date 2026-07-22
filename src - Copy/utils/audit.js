const { AuditLog } = require('../models/index');

const audit = async ({ userId, action, resource, resourceId, oldValues, newValues, req, projectId } = {}) => {
  try {
    await AuditLog.create({
      userId:     userId || null,
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : null,
      oldValues:  oldValues  || null,
      newValues:  newValues  || null,
      ipAddress:  req ? (req.ip || req.headers['x-forwarded-for']) : null,
      userAgent:  req ? req.headers['user-agent'] : null,
      projectId:  projectId || null,
    });
  } catch (err) {
    // Non-fatal — log but don't crash request
    console.error('[AuditLog Error]', err.message);
  }
};

module.exports = { audit };
