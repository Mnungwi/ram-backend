const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('united_ram', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

async function run() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected!');

    // Add per-service Overview text + Key Benefits (used by the public Service
    // Detail page, previously the same generic copy for every service).
    try {
      await sequelize.query(`
        ALTER TABLE website_services
        ADD COLUMN overviewText TEXT NULL,
        ADD COLUMN benefitsJson TEXT NULL
      `);
      console.log('✅ Successfully altered website_services to add overviewText and benefitsJson.');
    } catch (err) {
      console.log('website_services table already altered or columns exist:', err.message);
    }

  } catch (err) {
    console.error('Error executing alter script:', err);
  } finally {
    await sequelize.close();
  }
}

run();
