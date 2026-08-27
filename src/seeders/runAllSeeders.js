require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { execSync } = require('child_process');
const path = require('path');

const seeders = [
  'index.js',
  'seedDemoData.js',
  'seedAll.js',
  'seedStakeholders.js',
  'seedTechnicians.js',
  'seedActivityTypes.js',
  'seed-expense-categories.js'
];

async function runAll() {
  console.log('🚀 Starting full seed process...\n');
  const seedersDir = __dirname;

  for (const seeder of seeders) {
    const filePath = path.join(seedersDir, seeder);
    console.log(`========================================`);
    console.log(`▶ Running ${seeder}...`);
    console.log(`========================================`);
    try {
      execSync(`node "${filePath}"`, { stdio: 'inherit', cwd: path.join(__dirname, '../..') });
      console.log(`✅ ${seeder} finished successfully.\n`);
    } catch (err) {
      console.error(`❌ ${seeder} failed to execute.`, err.message);
      process.exit(1);
    }
  }

  console.log('========================================');
  console.log('🎉 ALL SEEDERS EXECUTED SUCCESSFULLY!');
  console.log('========================================');
}

runAll();
