const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ─── CENTRAL STORE ────────────────────────────────────────────────────────────
// Global warehouse - receives from LPOs, transfers to projects
const CentralStoreItem = sequelize.define('CentralStoreItem', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  productId:   { type: DataTypes.UUID, allowNull: false },
  description: { type: DataTypes.STRING(500), allowNull: false }, // product name snapshot
  unit:        { type: DataTypes.STRING(50), allowNull: true },
  quantity:    { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  minQuantity: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // reorder level
  unitCost:    { type: DataTypes.DECIMAL(15, 2), allowNull: true },  // average cost
  location:    { type: DataTypes.STRING(100), allowNull: true },     // shelf/bin location
  notes:       { type: DataTypes.TEXT, allowNull: true },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'central_store_items' });

// ─── PROJECT STORE ────────────────────────────────────────────────────────────
// Per-project store - receives from central store or direct LPO
const ProjectStoreItem = sequelize.define('ProjectStoreItem', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  projectId:   { type: DataTypes.UUID, allowNull: false },
  productId:   { type: DataTypes.UUID, allowNull: true },
  description: { type: DataTypes.STRING(500), allowNull: false },
  unit:        { type: DataTypes.STRING(50), allowNull: true },
  quantity:    { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  reservedQty: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // reserved for approved RNs
  unitCost:    { type: DataTypes.DECIMAL(15, 2), allowNull: true },
  notes:       { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'project_store_items' });

// ─── STORE TRANSACTION ────────────────────────────────────────────────────────
// Audit trail for all stock movements
const StoreTransaction = sequelize.define('StoreTransaction', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  storeType:     {
    type: DataTypes.ENUM('central', 'project'),
    allowNull: false,
  },
  transactionType: {
    type: DataTypes.ENUM(
      'lpo_receive',       // LPO received → central store
      'transfer_out',      // Central → project store
      'transfer_in',       // Project receives from central
      'rn_issue',          // Project store → site (requisition issued)
      'return_to_store',   // Site returns to project store
      'return_to_central', // Project returns to central
      'adjustment_in',     // Manual adjustment +
      'adjustment_out',    // Manual adjustment -
      'direct_receive',    // LPO received directly to project store
    ),
    allowNull: false,
  },
  storeItemId:   { type: DataTypes.UUID, allowNull: true },  // central or project store item
  projectId:     { type: DataTypes.UUID, allowNull: true },
  productId:     { type: DataTypes.UUID, allowNull: true },
  description:   { type: DataTypes.STRING(500), allowNull: false },
  unit:          { type: DataTypes.STRING(50), allowNull: true },
  quantityIn:    { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  quantityOut:   { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  balanceAfter:  { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  unitCost:      { type: DataTypes.DECIMAL(15, 2), allowNull: true },
  referenceType: { type: DataTypes.STRING(50), allowNull: true },  // 'lpo', 'requisition', 'transfer', 'manual'
  referenceId:   { type: DataTypes.UUID, allowNull: true },        // lpoId, requisitionId
  referenceNo:   { type: DataTypes.STRING(100), allowNull: true }, // LPO-2026-001, RN-2026-001
  performedById: { type: DataTypes.UUID, allowNull: false },
  notes:         { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'store_transactions' });

module.exports = { CentralStoreItem, ProjectStoreItem, StoreTransaction };
