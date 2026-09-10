// ══════════════════════════════════════════════════════════════
// utils/branding.js — the organisation's display name / contact info,
// read from the DB so nothing user-facing is hardcoded to one tenant.
//
// Source of truth (first non-empty wins):
//   1. admin_theme_settings.theme_app_name   (admin > Appearance page)
//   2. website_settings.site_title           (public site settings)
//   3. process.env.BRAND_NAME
//   4. a neutral literal fallback
//
// Cached for 60s since this is hit on every OTP / reset email.
// ══════════════════════════════════════════════════════════════
const { sequelize } = require("../config/database");

let cache = null;
let cacheAt = 0;
const TTL_MS = 60_000;

async function loadBranding() {
  const out = {
    name: process.env.BRAND_NAME || "United Ram Construction",
    email: null,
    phone: null,
    address: null,
  };
  try {
    const [theme] = await sequelize.query(
      "SELECT `key`, `value` FROM admin_theme_settings WHERE `key` = 'theme_app_name'",
    );
    if (theme?.[0]?.value) out.name = theme[0].value;

    const [ws] = await sequelize.query("SELECT `key`, `value` FROM website_settings");
    const dict = {};
    for (const row of ws || []) dict[row.key] = row.value;
    if (!theme?.[0]?.value && dict.site_title) out.name = dict.site_title;
    out.email = dict.contact_email || null;
    out.phone = dict.contact_phone || null;
    out.address = dict.contact_address || null;
  } catch (e) {
    // keep defaults — email/SMS should still go out with a sensible name
  }
  return out;
}

async function getBranding() {
  if (cache && Date.now() - cacheAt < TTL_MS) return cache;
  cache = await loadBranding();
  cacheAt = Date.now();
  return cache;
}

/** Just the display name — the common case for email subjects / SMS. */
async function getBrandName() {
  return (await getBranding()).name;
}

module.exports = { getBranding, getBrandName };
