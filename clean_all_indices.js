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

    // Show all tables
    const [tables] = await sequelize.query("SHOW TABLES");
    console.log(`Found ${tables.length} tables. Scanning for duplicate indexes...`);

    for (const row of tables) {
      const tableName = Object.values(row)[0];
      const [indexes] = await sequelize.query(`SHOW INDEX FROM \`${tableName}\``);
      
      // Filter duplicate keys (e.g., ending in _2, _3, _4, etc., or having duplicate names)
      const duplicateKeys = new Set();
      for (const idx of indexes) {
        const keyName = idx.Key_name;
        // Check for common sequelize naming patterns for duplicate unique indexes: e.g. name_2, slug_3, etc.
        if (keyName !== 'PRIMARY' && /_[0-9]+$/.test(keyName)) {
          duplicateKeys.add(keyName);
        }
      }

      for (const keyName of duplicateKeys) {
        try {
          await sequelize.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${keyName}\``);
          console.log(`Table \`${tableName}\`: dropped index \`${keyName}\``);
        } catch (err) {
          console.error(`Table \`${tableName}\`: failed to drop index \`${keyName}\`:`, err.message);
        }
      }
    }

    console.log('✅ Finished cleaning duplicate indexes across all tables.');
  } catch (err) {
    console.error('Error running setup:', err);
  } finally {
    await sequelize.close();
  }
}

run();
