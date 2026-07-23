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

    // Drop index loop from name_2 to name_63
    for (let i = 2; i <= 65; i++) {
      try {
        await sequelize.query(`ALTER TABLE permissions DROP INDEX name_${i}`);
        console.log(`Successfully dropped index name_${i}`);
      } catch (err) {
        // Silently skip if index doesn't exist
      }
    }

    console.log('✅ Finished cleaning duplicate indexes.');
  } catch (err) {
    console.error('Error running setup:', err);
  } finally {
    await sequelize.close();
  }
}

run();
