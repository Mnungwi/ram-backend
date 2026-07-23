const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('mysql', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

async function run() {
  try {
    const [dbs] = await sequelize.query('SHOW DATABASES');
    for (const d of dbs) {
      console.log(`DB: "${d.Database}", Length: ${d.Database.length}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

run();
