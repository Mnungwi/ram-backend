// ══════════════════════════════════════════════════════════════
// utils/notify.js — create in-app notifications
//
// createNotification({ userId, type, title, message, link, entityType,
//                      entityId, createdById })  -> Notification | null
//
// notifyUsersWithPermission(permissionName, payload, { excludeUserId })
//   -> resolves every active user's effective permissions and creates one
//      notification per user who holds `permissionName`. Best-effort — it
//      never throws, so a failure here can't break the action that
//      triggered it (e.g. registering a letter).
// ══════════════════════════════════════════════════════════════

const { Notification, User } = require("../models/index");
const { resolveUserPermissions } = require("./permissionResolver");

async function createNotification(payload = {}) {
  try {
    if (!payload.userId || !payload.title) return null;
    return await Notification.create({
      userId: payload.userId,
      type: payload.type || "info",
      title: payload.title,
      message: payload.message || null,
      link: payload.link || null,
      entityType: payload.entityType || null,
      entityId: payload.entityId || null,
      createdById: payload.createdById || null,
    });
  } catch (err) {
    console.error("notify.js: createNotification failed —", err.message);
    return null;
  }
}

async function notifyUsersWithPermission(permissionName, payload = {}, opts = {}) {
  try {
    const excludeUserId = opts.excludeUserId || null;
    const users = await User.findAll({
      where: { isActive: true },
      attributes: ["id"],
    });

    const recipients = [];
    for (const u of users) {
      if (excludeUserId && u.id === excludeUserId) continue;
      const perms = await resolveUserPermissions(u.id);
      if (perms.has(permissionName)) recipients.push(u.id);
    }

    await Promise.all(
      recipients.map((userId) => createNotification({ ...payload, userId })),
    );
    return recipients.length;
  } catch (err) {
    console.error("notify.js: notifyUsersWithPermission failed —", err.message);
    return 0;
  }
}

module.exports = { createNotification, notifyUsersWithPermission };
