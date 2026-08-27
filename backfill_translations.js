// ══════════════════════════════════════════════════════════════
// backfill_translations.js
//
// The auto-translate-on-save feature (see src/routes/admin-website.routes.js
// and src/controllers/projectController.js) only fills "_sw" fields the next
// time a row is SAVED through the admin panel. Everything already sitting in
// the database (seeded via create_full_cms.js, seed_missing_settings.js,
// migrated from the old database, etc.) was never re-saved, so its "_sw"
// fields are still blank — this is why nothing looked translated yet.
//
// This is the one-time catch-up: walk every translatable row/column and
// key that's missing its Kiswahili sibling, and fill it in now. Safe to
// re-run any time — it only ever fills blanks, never overwrites an existing
// value (manual or previously auto-translated).
//
// Run: node backfill_translations.js
// ══════════════════════════════════════════════════════════════

const { Sequelize } = require('sequelize');
const { translateToSw, TRANSLATABLE_JSON_ARRAY_SETTINGS, translateJsonArrayFields } = require('./src/utils/translate');
const { TRANSLATABLE_SETTING_KEYS } = require('./src/config/translatableSettings');

const sequelize = new Sequelize('united_ram', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false,
});

async function backfillTable(table, idCol, fieldPairs, whereClause = '1=1') {
  const [rows] = await sequelize.query(`SELECT * FROM ${table} WHERE ${whereClause}`);
  let updatedRows = 0;

  for (const row of rows) {
    const updates = {};
    for (const [enField, swField] of fieldPairs) {
      if (row[enField] && !row[swField]) {
        const translated = await translateToSw(row[enField]);
        if (translated) updates[swField] = translated;
      }
    }
    if (Object.keys(updates).length > 0) {
      const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
      await sequelize.query(`UPDATE ${table} SET ${setClause} WHERE ${idCol} = ?`, {
        replacements: [...Object.values(updates), row[idCol]],
      });
      updatedRows++;
      console.log(`  ✓ ${table} "${row[fieldPairs[0][0]] || row[idCol]}" → filled: ${Object.keys(updates).join(', ')}`);
    }
  }
  console.log(`✅ ${table}: ${updatedRows}/${rows.length} row(s) updated.\n`);
}

async function backfillSettings() {
  const [rows] = await sequelize.query('SELECT `key`, `value` FROM website_settings');
  const byKey = {};
  for (const r of rows) byKey[r.key] = r.value;

  let updated = 0;
  for (const key of TRANSLATABLE_SETTING_KEYS) {
    const val = byKey[key];
    const swKey = `${key}_sw`;
    if (val && !byKey[swKey]) {
      const translated = await translateToSw(val);
      if (translated) {
        await sequelize.query(
          `INSERT INTO website_settings (\`key\`, \`value\`, createdAt, updatedAt)
           VALUES (?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE \`value\` = ?, updatedAt = NOW()`,
          { replacements: [swKey, translated, translated] },
        );
        updated++;
        console.log(`  ✓ website_settings "${key}" → "${swKey}" filled`);
      }
    }
  }
  console.log(`✅ website_settings: ${updated}/${TRANSLATABLE_SETTING_KEYS.size} key(s) updated.\n`);
}

async function backfillJsonArraySettings() {
  const keys = Object.keys(TRANSLATABLE_JSON_ARRAY_SETTINGS);
  const [rows] = await sequelize.query(
    `SELECT \`key\`, \`value\` FROM website_settings WHERE \`key\` IN (${keys.map(() => '?').join(',')})`,
    { replacements: keys },
  );

  let updated = 0;
  for (const row of rows) {
    const fields = TRANSLATABLE_JSON_ARRAY_SETTINGS[row.key];
    const enriched = await translateJsonArrayFields(row.value, fields);
    if (enriched && enriched !== row.value) {
      await sequelize.query('UPDATE website_settings SET `value` = ?, updatedAt = NOW() WHERE `key` = ?', {
        replacements: [enriched, row.key],
      });
      updated++;
      console.log(`  ✓ website_settings "${row.key}" → items translated in place`);
    }
  }
  console.log(`✅ JSON array settings (hero slider, showcase accordion): ${updated}/${keys.length} key(s) updated.\n`);
}

async function run() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected! Backfilling missing Kiswahili translations...\n');

    console.log('📁 Projects...');
    await backfillTable('projects', 'id', [
      ['name', 'name_sw'],
      ['description', 'description_sw'],
      ['approachQuality', 'approachQuality_sw'],
      ['approachDelivery', 'approachDelivery_sw'],
      ['contractDuration', 'contractDuration_sw'],
    ]);

    console.log('🛠  Website Services...');
    await backfillTable('website_services', 'id', [
      ['title', 'title_sw'],
      ['description', 'description_sw'],
      ['overviewText', 'overviewText_sw'],
    ]);

    console.log('📰 Website News...');
    await backfillTable('website_news', 'id', [
      ['title', 'title_sw'],
      ['summary', 'summary_sw'],
      ['content', 'content_sw'],
    ]);

    console.log('❓ Website FAQs...');
    await backfillTable('website_faqs', 'id', [
      ['question', 'question_sw'],
      ['answer', 'answer_sw'],
    ]);

    console.log('⚙️  Website Settings...');
    await backfillSettings();

    console.log('🎞  Hero Slider / Showcase Accordion...');
    await backfillJsonArraySettings();

    console.log('🎉 Backfill complete.');
  } catch (err) {
    console.error('Error during backfill:', err);
  } finally {
    await sequelize.close();
  }
}

run();
