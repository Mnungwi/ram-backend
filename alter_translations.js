const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('united_ram', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

// Adds Kiswahili sibling columns ("_sw") next to each translatable English
// field, so bilingual content lives as a simple dictionary: <field> (EN,
// default) + <field>_sw (SW, auto-translated on save unless the admin typed
// one manually). website_settings needs no schema change — it is already a
// key/value dictionary, so its Swahili values just live under "<key>_sw".
const ALTERATIONS = [
  { table: 'website_services', columns: ['title_sw TEXT NULL', 'description_sw TEXT NULL', 'overviewText_sw TEXT NULL'] },
  { table: 'website_news', columns: ['title_sw TEXT NULL', 'summary_sw TEXT NULL', 'content_sw TEXT NULL'] },
  { table: 'website_faqs', columns: ['question_sw TEXT NULL', 'answer_sw TEXT NULL'] },
  { table: 'projects', columns: ['name_sw VARCHAR(255) NULL', 'description_sw TEXT NULL'] },
];

async function run() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected!');

    for (const { table, columns } of ALTERATIONS) {
      try {
        await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${columns.join(', ADD COLUMN ')}`);
        console.log(`✅ Altered ${table}: added ${columns.length} column(s).`);
      } catch (err) {
        console.log(`ℹ️  ${table} already altered or columns exist: ${err.message}`);
      }
    }

    console.log('✅ Done.');
  } catch (err) {
    console.error('Error executing alter script:', err);
  } finally {
    await sequelize.close();
  }
}

run();
