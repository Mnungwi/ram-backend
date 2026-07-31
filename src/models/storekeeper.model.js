const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// ─── PROJECT STOREKEEPER ──────────────────────────────────────────────────────
// A Storekeeper is an existing User assigned to manage a project's store.
const ProjectStorekeeper = sequelize.define(
  "ProjectStorekeeper",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    assignedById: { type: DataTypes.UUID, allowNull: true },
    assignedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    notes: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "project_storekeepers" },
);

module.exports = {
  ProjectStorekeeper,
};
