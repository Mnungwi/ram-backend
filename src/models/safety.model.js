const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// NOTE on collation: see subcontractor.model.js — every new table with a
// UUID FK into an existing utf8mb4_bin-collated table (projects.id,
// users.id, or one of this file's own tables) must itself be
// utf8mb4_bin, or sync({alter:true}) fails at boot with errno 150.

// ─── SAFETY RECORD (incidents, near-misses, inspections, toolbox talks,
//     drills, audits — one log covers both "records" and "events") ───────
const SafetyRecord = sequelize.define(
  "SafetyRecord",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    type: {
      type: DataTypes.ENUM("incident", "near_miss", "inspection", "toolbox_talk", "drill", "audit", "other"),
      allowNull: false,
      defaultValue: "inspection",
    },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    eventDate: { type: DataTypes.DATEONLY, allowNull: false },
    severity: {
      type: DataTypes.ENUM("low", "medium", "high", "critical"),
      allowNull: true,
    },
    location: { type: DataTypes.STRING(200), allowNull: true }, // e.g. "3rd floor, east wing"
    actionTaken: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("open", "resolved", "closed"),
      defaultValue: "open",
    },
    reportedById: { type: DataTypes.UUID, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "safety_records", charset: "utf8mb4", collate: "utf8mb4_bin" },
);

// ─── SAFETY DOCUMENT ────────────────────────────────────────────────────────
// projectId is always set (e.g. the project's Safety Plan/Policy);
// safetyRecordId is set when the document belongs to one specific
// incident/inspection/etc rather than being a general project safety file.
const SafetyDocument = sequelize.define(
  "SafetyDocument",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    safetyRecordId: { type: DataTypes.UUID, allowNull: true },
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    filePath: { type: DataTypes.STRING(500), allowNull: false }, // relative to DOCUMENTS_DIR
    fileType: { type: DataTypes.STRING(100), allowNull: true },
    fileSize: { type: DataTypes.INTEGER, allowNull: true },
    category: { type: DataTypes.STRING(100), allowNull: true }, // e.g. "Safety Plan", "Incident Report", "Photo"
    uploadedById: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "safety_documents", charset: "utf8mb4", collate: "utf8mb4_bin" },
);

SafetyRecord.hasMany(SafetyDocument, { foreignKey: "safetyRecordId", as: "documents" });
SafetyDocument.belongsTo(SafetyRecord, { foreignKey: "safetyRecordId", as: "safetyRecord" });

module.exports = { SafetyRecord, SafetyDocument };
