require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});
const { sequelize } = require("../models/index");
const { DataTypes } = require("sequelize");

const migrateProjectManager = async () => {
  try {
    console.log("🔄 Adding projectManagerId to projects table...");
    await sequelize.authenticate();

    const qi = sequelize.getQueryInterface();
    const tableDesc = await qi.describeTable("projects");

    if (tableDesc.projectManagerId) {
      console.log("ℹ️  projectManagerId already exists — skipping.");
      process.exit(0);
    }

    await qi.addColumn("projects", "projectManagerId", {
      type: DataTypes.UUID,
      allowNull: true,
    });

    console.log("✅ projectManagerId column added successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
};

migrateProjectManager();
