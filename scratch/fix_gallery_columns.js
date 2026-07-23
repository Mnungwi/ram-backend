const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('united_ram', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

async function run() {
  try {
    console.log('Adding type and visibility columns to project_gallery table...');
    
    // Check if type exists
    const [cols] = await sequelize.query('SHOW COLUMNS FROM project_gallery');
    const columnNames = cols.map(c => c.Field);
    
    if (!columnNames.includes('type')) {
      await sequelize.query("ALTER TABLE project_gallery ADD COLUMN type VARCHAR(50) DEFAULT 'photo' AFTER caption");
      console.log('Column "type" added.');
    } else {
      console.log('Column "type" already exists.');
    }

    if (!columnNames.includes('visibility')) {
      await sequelize.query("ALTER TABLE project_gallery ADD COLUMN visibility ENUM('public', 'private') DEFAULT 'public' AFTER type");
      console.log('Column "visibility" added.');
    } else {
      console.log('Column "visibility" already exists.');
    }

    console.log('✅ Success! Columns added and verified.');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
  } finally {
    await sequelize.close();
  }
}

run();
