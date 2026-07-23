const { sequelize } = require('../src/config/database');

async function run() {
  try {
    const [res] = await sequelize.query('SELECT DATABASE() as db');
    console.log('Database currently in use:', res[0].db);
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

run();
