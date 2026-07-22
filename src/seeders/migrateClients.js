require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize, Client, Project } = require('../models/index');
const { QueryInterface, DataTypes } = require('sequelize');

const migrateClients = async () => {
  try {
    console.log('🔄 Starting client migration...');
    await sequelize.authenticate();

    const qi = sequelize.getQueryInterface();
    const tableDesc = await qi.describeTable('projects');

    // ── 1. Sync Client table (creates it if missing) ──
    await Client.sync({ alter: true });
    console.log('✅ Clients table ready');

    // ── 2. If projects.client (string) still exists, migrate it ──
    if (tableDesc.client && !tableDesc.clientId) {
      console.log('📦 Migrating existing project.client string values...');

      // Add clientId column (nullable for now)
      await qi.addColumn('projects', 'clientId', {
        type: DataTypes.UUID,
        allowNull: true,
      });
      console.log('  ✅ clientId column added');

      // Pull distinct client name strings from projects
      const [rows] = await sequelize.query(
        `SELECT DISTINCT client FROM projects WHERE client IS NOT NULL AND client != ''`
      );

      const nameToId = {};
      for (const row of rows) {
        const name = row.client.trim();
        if (!name) continue;
        const [client] = await Client.findOrCreate({
          where: { name },
          defaults: { name, isActive: true },
        });
        nameToId[name] = client.id;
      }
      console.log(`  ✅ ${Object.keys(nameToId).length} unique clients created from existing data`);

      // Update each project row to set clientId based on its old client string
      for (const [name, clientId] of Object.entries(nameToId)) {
        await sequelize.query(
          `UPDATE projects SET clientId = :clientId WHERE client = :name`,
          { replacements: { clientId, name } }
        );
      }
      console.log('  ✅ projects.clientId populated');

      // Drop the old string column
      await qi.removeColumn('projects', 'client');
      console.log('  ✅ old projects.client (string) column removed');
    } else if (tableDesc.clientId) {
      console.log('ℹ️  projects.clientId already exists — migration already applied, skipping.');
    } else {
      console.log('ℹ️  No projects.client column found — nothing to migrate.');
    }

    console.log('\n🎉 Client migration complete!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
};

migrateClients();
