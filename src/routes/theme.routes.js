// ══════════════════════════════════════════════════════════════
// theme.routes.js — DB-driven appearance settings for the admin panel
// (and, read-only, for the mobile app): theme colors, logo, per-element
// styling. Same key/value pattern as website_settings.
// ══════════════════════════════════════════════════════════════
const express = require("express");
const router = express.Router();
const { sequelize } = require("../config/database");
const { authenticate, authorize } = require("../middleware/auth");
const { PERMISSIONS: P } = require("../config/permissions");
const { successResponse, errorResponse } = require("../utils/response");

sequelize.query(`
  CREATE TABLE IF NOT EXISTS admin_theme_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    \`key\` VARCHAR(100) NOT NULL UNIQUE,
    \`value\` TEXT NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`).catch((err) => console.error("⚠️ admin_theme_settings table migration failed:", err.message));

// Sensible defaults — used to fill in any key the admin hasn't customised yet,
// so both the admin app and mobile always get a complete theme object.
const DEFAULT_THEME = {
  theme_primary: "#1a56db",
  theme_primary_dark: "#1e429f",
  theme_secondary: "#f97316",
  theme_sidebar_bg: "#0f172a",
  theme_sidebar_text: "#94a3b8",
  theme_sidebar_hover_bg: "rgba(255,255,255,0.07)",
  theme_sidebar_active_bg: "#1a56db",
  theme_topbar_bg: "#ffffff",
  theme_body_bg: "#f1f5f9",
  theme_card_bg: "#ffffff",
  theme_border: "#e2e8f0",
  theme_table_header_bg: "#f8fafc",
  theme_table_header_text: "#64748b",
  theme_table_row_hover_bg: "#f8fafc",
  theme_success: "#10b981",
  theme_warning: "#f59e0b",
  theme_danger: "#ef4444",
  theme_logo_url: "",
  theme_app_name: "United Ram Construction",

  // Layout — previously the template's floating "gear" demo widget, now
  // organisation-wide settings controlled from the Appearance page.
  theme_menu_layout: "vertical", // vertical | horizontal
  theme_menu_type: "default", // default | compact | mini
  theme_fixed_header: "true",
  theme_fixed_sidebar: "true",
  theme_fixed_footer: "false",

  // Login page
  theme_login_bg_image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1920&q=80",
  theme_login_overlay: "rgba(15,23,42,0.82)",
  theme_login_card_bg: "rgba(30,41,59,0.7)",
  theme_login_title: "RAM PROJECTS",
  theme_login_subtitle: "Elite Infrastructure Solutions",

  // Splash / preloader — shown before the app itself finishes loading, on
  // admin, website and mobile alike.
  theme_splash_title: "UNITED RAM CONSTRUCTION",
  theme_splash_bg: "#0f172a",
};

// GET /api/theme — public (login page + mobile need it before authenticating)
router.get("/theme", async (req, res, next) => {
  try {
    const [rows] = await sequelize.query("SELECT `key`, `value` FROM admin_theme_settings");
    const dict = { ...DEFAULT_THEME };
    for (const row of rows) {
      if (row.value !== null && row.value !== "") dict[row.key] = row.value;
    }
    return successResponse(res, dict, "Theme settings retrieved successfully");
  } catch (err) {
    next(err);
  }
});

// PUT /api/theme — admin only
router.put("/theme", authenticate, authorize(P.SETTINGS_UPDATE), async (req, res, next) => {
  try {
    const body = req.body || {};
    const allowedKeys = new Set(Object.keys(DEFAULT_THEME));

    for (const [key, val] of Object.entries(body)) {
      if (!allowedKeys.has(key)) continue; // ignore unknown keys — never let the client write arbitrary rows
      await sequelize.query(
        `INSERT INTO admin_theme_settings (\`key\`, \`value\`, createdAt, updatedAt)
         VALUES (?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE \`value\` = ?, updatedAt = NOW()`,
        { replacements: [key, val, val] },
      );
    }
    return successResponse(res, null, "Theme settings updated successfully");
  } catch (err) {
    next(err);
  }
});

// POST /api/theme/reset — admin only, wipes all customisation back to defaults
router.post("/theme/reset", authenticate, authorize(P.SETTINGS_UPDATE), async (req, res, next) => {
  try {
    await sequelize.query("DELETE FROM admin_theme_settings");
    return successResponse(res, DEFAULT_THEME, "Theme reset to defaults");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
