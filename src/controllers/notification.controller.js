const { Notification } = require("../models/index");
const { successResponse, errorResponse } = require("../utils/response");

// GET /api/notifications?unreadOnly=true&limit=20
exports.list = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const where = { userId: req.userId };
    if (req.query.unreadOnly === "true") where.isRead = false;

    const rows = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
    });
    const unreadCount = await Notification.count({
      where: { userId: req.userId, isRead: false },
    });

    return successResponse(res, { notifications: rows, unreadCount }, "OK");
  } catch (err) {
    next(err);
  }
};

// GET /api/notifications/unread-count
exports.unreadCount = async (req, res, next) => {
  try {
    const count = await Notification.count({
      where: { userId: req.userId, isRead: false },
    });
    return successResponse(res, { count }, "OK");
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res, next) => {
  try {
    const n = await Notification.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!n) return errorResponse(res, "Notification not found", 404);
    if (!n.isRead) await n.update({ isRead: true, readAt: new Date() });
    return successResponse(res, { notification: n }, "Marked read");
  } catch (err) {
    next(err);
  }
};

// POST /api/notifications/read-all
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId: req.userId, isRead: false } },
    );
    return successResponse(res, {}, "All notifications marked read");
  } catch (err) {
    next(err);
  }
};

// DELETE /api/notifications/:id
exports.remove = async (req, res, next) => {
  try {
    const n = await Notification.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!n) return errorResponse(res, "Notification not found", 404);
    await n.destroy();
    return successResponse(res, {}, "Notification removed");
  } catch (err) {
    next(err);
  }
};
