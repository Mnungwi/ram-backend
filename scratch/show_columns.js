const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('united_ram', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

async function run() {
  try {
    const [cols] = await sequelize.query('SHOW COLUMNS FROM project_gallery');
    console.log('Columns in project_gallery:', cols.map(c => `${c.Field} (${c.Type})`));
  } catch (err) {
    console.error('Failed to show columns:', err);
  } finally {
    await sequelize.close();
  }
}

run();
