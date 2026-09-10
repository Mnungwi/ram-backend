const express = require("express");
const router = express.Router();
const nc = require("../controllers/notification.controller");
const { authenticate } = require("../middleware/auth");

// Every route here is scoped to the logged-in user (req.userId) — no extra
// permission needed, a user may always read/clear their own notifications.
router.get("/", authenticate, nc.list);
router.get("/unread-count", authenticate, nc.unreadCount);
router.post("/read-all", authenticate, nc.markAllRead);
router.patch("/:id/read", authenticate, nc.markRead);
router.delete("/:id", authenticate, nc.remove);

module.exports = router;
