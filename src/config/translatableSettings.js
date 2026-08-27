// Only these website_settings keys are free-text prose worth auto-translating —
// everything else (JSON blobs, image paths, emails, phones, URLs, addresses)
// must never be run through a translator.
const TRANSLATABLE_SETTING_KEYS = new Set([
  "site_title",
  "about_company_name",
  "about_who_we_are",
  "about_vision",
  "about_mission",
  "about_core_values",
  "about_md_quote",
  "home_cta_title",
  "home_cta_subtitle",
  "home_showcase_subtitle",
  "home_showcase_title",
  "home_services_subtitle",
  "home_services_title",
  "home_projects_subtitle",
  "home_projects_title",
  "footer_about_text",
  "footer_copyright",
]);

module.exports = { TRANSLATABLE_SETTING_KEYS };
