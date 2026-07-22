const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const CATEGORY_VALUES = [
  "Contract",
  "Drawing",
  "Report",
  "Specification",
  "Permit",
  "Correspondence",
];

const REPORT_TYPE_VALUES = [
  "Progress",
  "Test",
  "RFI",
  "Inspection",
  "Completion",
  "Environmental",
];

const DRAWING_TYPE_VALUES = [
  "Structural",
  "Architectural",
  "Services",
];

const Document = sequelize.define(
  "ProjectDocument", // jina la model tofauti na "Document" ya awali (documents.model.js ya zamani) ili kuepuka mgongano
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    category: { type: DataTypes.ENUM(...CATEGORY_VALUES), allowNull: false },
    reportType: { type: DataTypes.ENUM(...REPORT_TYPE_VALUES), allowNull: true }, // kwa category='Report' pekee
    drawingType: { type: DataTypes.ENUM(...DRAWING_TYPE_VALUES), allowNull: true }, // kwa category='Drawing' pekee
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    filePath: { type: DataTypes.STRING(500), allowNull: false },
    fileSize: { type: DataTypes.INTEGER, allowNull: true }, // bytes
    mimeType: { type: DataTypes.STRING(100), allowNull: true },
    version: { type: DataTypes.STRING(20), defaultValue: "1.0" },
    uploadedById: { type: DataTypes.UUID, allowNull: true },
    phaseId: { type: DataTypes.UUID, allowNull: true },
    status: { type: DataTypes.STRING(50), defaultValue: "Completed" },
    submittedBy: { type: DataTypes.STRING(255), allowNull: true },
    submittedOn: { type: DataTypes.DATEONLY, allowNull: true },
  },
  { tableName: "project_documents_v2" }, // jina la table tofauti kuepuka mgongano na "documents" ya zamani
);

// ── Version history (kila upload mpya wa toleo huhifadhi ile ya zamani) ──
const DocumentVersion = sequelize.define(
  "DocumentVersion",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    documentId: { type: DataTypes.UUID, allowNull: false },
    version: { type: DataTypes.STRING(20), allowNull: false },
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    filePath: { type: DataTypes.STRING(500), allowNull: false },
    fileSize: { type: DataTypes.INTEGER, allowNull: true },
    uploadedById: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "project_document_versions" },
);

module.exports = { Document, DocumentVersion, CATEGORY_VALUES, REPORT_TYPE_VALUES, DRAWING_TYPE_VALUES };
