const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('united_ram', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

// Website Project Detail page had 3 things that looked "constant" across
// every project because there was nowhere for admin to set them per project:
//   - "Our Engineering Approach" text (was hardcoded, identical everywhere)
//   - Contract Valuation / Duration (were computed from totalBudget/dates,
//     which is correct, but many migrated projects share the same
//     placeholder budget/dates — admin needs an explicit override)
// This adds the columns that make all of it per-project and admin-editable.
const COLUMNS = [
  'approachQuality TEXT NULL',
  'approachQuality_sw TEXT NULL',
  'approachDelivery TEXT NULL',
  'approachDelivery_sw TEXT NULL',
  'contractValue VARCHAR(255) NULL',
  'contractDuration VARCHAR(255) NULL',
  'contractDuration_sw VARCHAR(255) NULL',
];

async function run() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected!');

    try {
      await sequelize.query(`ALTER TABLE projects ADD COLUMN ${COLUMNS.join(', ADD COLUMN ')}`);
      console.log(`✅ Altered projects: added ${COLUMNS.length} column(s).`);
    } catch (err) {
      console.log(`ℹ️  projects table already altered or columns exist: ${err.message}`);
    }

    console.log('✅ Done.');
  } catch (err) {
    console.error('Error executing alter script:', err);
  } finally {
    await sequelize.close();
  }
}

run();
