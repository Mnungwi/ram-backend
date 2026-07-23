const { sequelize } = require('./config/database');
const { DataTypes } = require('sequelize');

async function run() {
  try {
    console.log("Altering projects table...");
    const qi = sequelize.getQueryInterface();
    
    // Add showOnHomePage
    try {
      await qi.addColumn('projects', 'showOnHomePage', {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      });
      console.log("Added showOnHomePage column.");
    } catch (e) {
      console.log("showOnHomePage column already exists or error:", e.message);
    }
    
    // Add visibility
    try {
      await qi.addColumn('projects', 'visibility', {
        type: DataTypes.ENUM("public", "private"),
        defaultValue: "public"
      });
      console.log("Added visibility column.");
    } catch (e) {
      console.log("visibility column already exists or error:", e.message);
    }

    // Add displayOrder
    try {
      await qi.addColumn('projects', 'displayOrder', {
        type: DataTypes.INTEGER,
        defaultValue: 0
      });
      console.log("Added displayOrder column.");
    } catch (e) {
      console.log("displayOrder column already exists or error:", e.message);
    }

    console.log("Alter complete!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to alter table:", err);
    process.exit(1);
  }
}

run();
