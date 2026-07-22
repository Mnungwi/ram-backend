const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// ─── REQUISITION NOTE ─────────────────────────────────────────────────────────
const Requisition = sequelize.define(
  "Requisition",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    requisitionNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    siteLocation: { type: DataTypes.STRING(255), allowNull: true },
    requestedById: { type: DataTypes.UUID, allowNull: false },
    designation: { type: DataTypes.STRING(100), allowNull: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "submitted",
        "reviewed",
        "approved",
        "issued",
        "completed",
        "rejected",
        "cancelled",
      ),
      defaultValue: "draft",
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
    reviewedById: { type: DataTypes.UUID, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    approvedById: { type: DataTypes.UUID, allowNull: true },
    issuedAt: { type: DataTypes.DATE, allowNull: true },
    issuedById: { type: DataTypes.UUID, allowNull: true },
    rejectedAt: { type: DataTypes.DATE, allowNull: true },
    rejectedById: { type: DataTypes.UUID, allowNull: true },
    rejectionReason: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "requisitions" },
);

// ─── REQUISITION ITEM ─────────────────────────────────────────────────────────
const RequisitionItem = sequelize.define(
  "RequisitionItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    requisitionId: { type: DataTypes.UUID, allowNull: false },
    productId: { type: DataTypes.UUID, allowNull: true }, // ← NEW: link to products table
    serialNo: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: false },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    quantityOrdered: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    quantityIssued: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    unitPrice: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    notes: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: "requisition_items" },
);

// ─── REQUISITION COMMENT ──────────────────────────────────────────────────────
const RequisitionComment = sequelize.define(
  "RequisitionComment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    requisitionId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    step: { type: DataTypes.STRING(50), allowNull: true },
    comment: { type: DataTypes.TEXT, allowNull: false },
    isInternal: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "requisition_comments" },
);

module.exports = { Requisition, RequisitionItem, RequisitionComment };
