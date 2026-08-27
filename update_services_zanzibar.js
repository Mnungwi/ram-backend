// ══════════════════════════════════════════════════════════════
// One-off content update: rewrite the 4 "Our Services" entries so
// they read as Zanzibar-specific (not generic stock copy), then
// auto-translate the new English text into the "_sw" sibling columns
// — same auto-translate-on-save pipeline as admin-website.routes.js.
// Safe to re-run: it always overwrites description/description_sw for
// exactly these 4 known service titles.
// ══════════════════════════════════════════════════════════════
const { sequelize } = require("./src/config/database");
const { translateToSw } = require("./src/utils/translate");

const UPDATES = [
  {
    title: "Building Construction",
    description:
      "Commercial towers, resort hotels, and luxury residential developments across Zanzibar's coastline and urban centres — from Stone Town to Mbweni and Bwawani.",
  },
  {
    title: "Infrastructure & Roads",
    description:
      "Roads, bridges, and interchanges connecting Unguja and Pemba's towns and tourist corridors, engineered for Zanzibar's coastal terrain and heavy seasonal rains.",
  },
  {
    title: "Water Resources & Pipelines",
    description:
      "Irrigation canals, water supply pipelines, sewerage networks, and treatment plants securing clean water for Zanzibar's communities and coastal hotels.",
  },
  {
    title: "Industrial Construction",
    description:
      "Warehousing, port-support facilities, and light-manufacturing parks built to power Zanzibar's growing trade and tourism economy.",
  },
];

async function run() {
  for (const u of UPDATES) {
    const [rows] = await sequelize.query(
      "SELECT id FROM website_services WHERE title = ?",
      { replacements: [u.title] }
    );
    if (!rows.length) {
      console.log(`⏭️  Skipped (not found): ${u.title}`);
      continue;
    }
    const sw = await translateToSw(u.description);
    await sequelize.query(
      "UPDATE website_services SET description = ?, description_sw = ? WHERE title = ?",
      { replacements: [u.description, sw, u.title] }
    );
    console.log(`✅ Updated: ${u.title}`);
  }
  await sequelize.close();
}

run().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
