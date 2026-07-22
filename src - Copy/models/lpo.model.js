const { DataTypes } = require("sequelize");

const { sequelize } = require("../config/database");
// ─── LOCAL PURCHASE ORDER ─────────────────────────────────────────────────────
const LocalPurchaseOrder = sequelize.define(
  "LocalPurchaseOrder",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lpoNo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    requisitionId: { type: DataTypes.UUID, allowNull: true },
    supplierId: { type: DataTypes.UUID, allowNull: false },
    preparedById: { type: DataTypes.UUID, allowNull: false },
    approvedById: { type: DataTypes.UUID, allowNull: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    deliveryDate: { type: DataTypes.DATEONLY, allowNull: true },
    deliveryAddress: { type: DataTypes.STRING(500), allowNull: true },
    currency: { type: DataTypes.STRING(10), defaultValue: "TZS" },
    subtotal: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    tax: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    taxRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 18 },
    total: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "submitted",
        "approved",
        "sent",
        "partial",
        "received",
        "invoiced",
        "paid",
        "cancelled",
      ),
      defaultValue: "draft",
    },
    paymentTerms: { type: DataTypes.STRING(100), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    sentAt: { type: DataTypes.DATE, allowNull: true },
    receivedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "local_purchase_orders" },
);

// ─── LPO ITEM ─────────────────────────────────────────────────────────────────
const LPOItem = sequelize.define(
  "LPOItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lpoId: { type: DataTypes.UUID, allowNull: false },
    productId: { type: DataTypes.UUID, allowNull: true }, // ← link to products table
    requisitionItemId: { type: DataTypes.UUID, allowNull: true },
    serialNo: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: false },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    unitPrice: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    quantityReceived: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    notes: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: "lpo_items" },
);

// ─── LPO COMMENT ──────────────────────────────────────────────────────────────
const LPOComment = sequelize.define(
  "LPOComment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lpoId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    step: { type: DataTypes.STRING(50), allowNull: true },
    comment: { type: DataTypes.TEXT, allowNull: false },
    isInternal: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "lpo_comments" },
);

module.exports = { LocalPurchaseOrder, LPOItem, LPOComment };
