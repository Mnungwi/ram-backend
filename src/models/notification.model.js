const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// NOTE on collation: see subcontractor.model.js — this table has a UUID FK
// into users.id (utf8mb4_bin), so it must itself be utf8mb4_bin or
// sync({alter:true}) fails at boot with errno 150.

// ─── IN-APP NOTIFICATION ────────────────────────────────────────────────────
// One row per recipient. `link` is a frontend route the bell dropdown
// navigates to when the item is clicked (e.g. "/letters/<id>").
const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false }, // recipient
    type: { type: DataTypes.STRING(60), allowNull: false, defaultValue: "info" },
    title: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    link: { type: DataTypes.STRING(500), allowNull: true },
    entityType: { type: DataTypes.STRING(60), allowNull: true }, // e.g. "letter"
    entityId: { type: DataTypes.UUID, allowNull: true },
    isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    readAt: { type: DataTypes.DATE, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true }, // who triggered it
  },
  {
    tableName: "notifications",
    charset: "utf8mb4",
    collate: "utf8mb4_bin",
    indexes: [{ fields: ["userId", "isRead"] }],
  },
);

module.exports = { Notification };
