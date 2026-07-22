const fs = require("fs");
const path = require("path");
const { sequelize } = require("../config/database");

exports.runMigrations = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".js") && f !== "index.js");

    for (const file of files) {
      console.log(`🚀 Executing migration: ${file}`);
      const migration = require(path.join(migrationsDir, file));
      if (migration.up) {
        await migration.up(queryInterface, sequelize.Sequelize);
      }
    }
    console.log("✅ All migrations executed successfully.");
  } catch (err) {
    console.error("❌ Migration error:", err);
  }
};
