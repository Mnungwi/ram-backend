const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('united_ram', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

async function run() {
  try {
    console.log('Force adding columns directly to united_ram database...');
    
    try {
      await sequelize.query("ALTER TABLE project_gallery ADD COLUMN type VARCHAR(50) DEFAULT 'photo' AFTER caption");
      console.log('Column "type" added.');
    } catch (e) {
      console.log('Failed to add type (maybe already exists):', e.message);
    }

    try {
      await sequelize.query("ALTER TABLE project_gallery ADD COLUMN visibility ENUM('public', 'private') DEFAULT 'public' AFTER type");
      console.log('Column "visibility" added.');
    } catch (e) {
      console.log('Failed to add visibility (maybe already exists):', e.message);
    }

    const [cols] = await sequelize.query('SHOW COLUMNS FROM project_gallery');
    console.log('Final columns in project_gallery:', cols.map(c => `${c.Field} (${c.Type})`));
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await sequelize.close();
  }
}

run();
