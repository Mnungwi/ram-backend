const { sequelize } = require('../src/config/database');

async function run() {
  try {
    const [cols] = await sequelize.query('SHOW COLUMNS FROM project_gallery');
    console.log('Columns in project_gallery via backend sequelize config:');
    cols.forEach(c => {
      console.log(`- ${c.Field}: ${c.Type}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

run();
