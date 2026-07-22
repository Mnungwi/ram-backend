const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ─── LETTER ────────────────────────────────────────────────────────────────────
const Letter = sequelize.define('Letter', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  projectId:    { type: DataTypes.UUID, allowNull: true },
  letterNo:     { type: DataTypes.STRING(50), allowNull: false, unique: true },
  subject:      { type: DataTypes.STRING(500), allowNull: false },
  body:         { type: DataTypes.TEXT('long'), allowNull: false },
  letterDate:   { type: DataTypes.DATEONLY, allowNull: false },
  type: {
    type: DataTypes.ENUM('incoming', 'outgoing', 'internal', 'memo'),
    defaultValue: 'outgoing',
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal',
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'sent', 'received', 'archived'),
    defaultValue: 'draft',
  },
  fromName:     { type: DataTypes.STRING(255), allowNull: true },
  fromTitle:    { type: DataTypes.STRING(255), allowNull: true },
  fromOrg:      { type: DataTypes.STRING(255), allowNull: true },
  toName:       { type: DataTypes.STRING(255), allowNull: false },
  toTitle:      { type: DataTypes.STRING(255), allowNull: true },
  toOrg:        { type: DataTypes.STRING(255), allowNull: true },
  toEmail:      { type: DataTypes.STRING(255), allowNull: true },
  ccRecipients: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  attachmentPath:       { type: DataTypes.STRING(500), allowNull: true },
  attachmentName:       { type: DataTypes.STRING(255), allowNull: true },
  sentAt:               { type: DataTypes.DATE, allowNull: true },
  sentById:             { type: DataTypes.UUID, allowNull: true },
  approvedById:         { type: DataTypes.UUID, allowNull: true },
  approvedAt:           { type: DataTypes.DATE, allowNull: true },
  createdById:          { type: DataTypes.UUID, allowNull: true },
  referenceLetterId:    { type: DataTypes.UUID, allowNull: true },
  referenceNo:          { type: DataTypes.STRING(100), allowNull: true },
  letterheadConfig:     { type: DataTypes.JSON, allowNull: true },
  notes:                { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'letters' });

const LetterRead = sequelize.define('LetterRead', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  letterId: { type: DataTypes.UUID, allowNull: false },
  userId:   { type: DataTypes.UUID, allowNull: false },
  readAt:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'letter_reads', updatedAt: false });

// ─── STORE ITEM ─────────────────────────────────────────────────────────────────
const StoreItem = sequelize.define('StoreItem', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  projectId:    { type: DataTypes.UUID, allowNull: true },
  itemCode:     { type: DataTypes.STRING(50), allowNull: false },
  name:         { type: DataTypes.STRING(255), allowNull: false },
  description:  { type: DataTypes.TEXT, allowNull: true },
  category:     { type: DataTypes.STRING(100), allowNull: true },
  unit:         { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'pcs' },
  unitCost:     { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  currency:     { type: DataTypes.STRING(10), defaultValue: 'TZS' },
  stockOnHand:   { type: DataTypes.DECIMAL(18, 3), defaultValue: 0 },
  stockReserved: { type: DataTypes.DECIMAL(18, 3), defaultValue: 0 },
  reorderLevel:  { type: DataTypes.DECIMAL(18, 3), defaultValue: 0 },
  maxLevel:      { type: DataTypes.DECIMAL(18, 3), allowNull: true },
  location:      { type: DataTypes.STRING(255), allowNull: true },
  supplierId:    { type: DataTypes.UUID, allowNull: true },
  isActive:      { type: DataTypes.BOOLEAN, defaultValue: true },
  notes:         { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'store_items' });

// ─── STORE RECEIPT (GRN) ────────────────────────────────────────────────────────
const StoreReceipt = sequelize.define('StoreReceipt', {
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  projectId:       { type: DataTypes.UUID, allowNull: true },
  receiptNo:       { type: DataTypes.STRING(50), allowNull: false, unique: true },
  purchaseOrderId: { type: DataTypes.UUID, allowNull: true },
  supplierId:      { type: DataTypes.UUID, allowNull: true },
  receivedDate:    { type: DataTypes.DATEONLY, allowNull: false },
  deliveryNote:    { type: DataTypes.STRING(100), allowNull: true },
  invoiceRef:      { type: DataTypes.STRING(100), allowNull: true },
  status: {
    type: DataTypes.ENUM('draft', 'received', 'partial', 'rejected'),
    defaultValue: 'draft',
  },
  notes:         { type: DataTypes.TEXT, allowNull: true },
  receivedById:  { type: DataTypes.UUID, allowNull: true },
  verifiedById:  { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'store_receipts' });

const StoreReceiptLine = sequelize.define('StoreReceiptLine', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  receiptId:   { type: DataTypes.UUID, allowNull: false },
  storeItemId: { type: DataTypes.UUID, allowNull: false },
  qtyOrdered:  { type: DataTypes.DECIMAL(18, 3), defaultValue: 0 },
  qtyReceived: { type: DataTypes.DECIMAL(18, 3), defaultValue: 0 },
  qtyRejected: { type: DataTypes.DECIMAL(18, 3), defaultValue: 0 },
  unitCost:    { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  totalCost:   { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  batchNo:     { type: DataTypes.STRING(100), allowNull: true },
  expiryDate:  { type: DataTypes.DATEONLY, allowNull: true },
  notes:       { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'store_receipt_lines' });

// ─── STORE ISSUE (MIN) ──────────────────────────────────────────────────────────
const StoreIssue = sequelize.define('StoreIssue', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  projectId:    { type: DataTypes.UUID, allowNull: true },
  issueNo:      { type: DataTypes.STRING(50), allowNull: false, unique: true },
  issueDate:    { type: DataTypes.DATEONLY, allowNull: false },
  issuedToId:   { type: DataTypes.UUID, allowNull: true },
  issuedToName: { type: DataTypes.STRING(255), allowNull: true },
  activityId:   { type: DataTypes.UUID, allowNull: true },
  purpose:      { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'issued', 'returned'),
    defaultValue: 'draft',
  },
  notes:          { type: DataTypes.TEXT, allowNull: true },
  requestedById:  { type: DataTypes.UUID, allowNull: true },
  approvedById:   { type: DataTypes.UUID, allowNull: true },
  approvedAt:     { type: DataTypes.DATE, allowNull: true },
  issuedById:     { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'store_issues' });

const StoreIssueLine = sequelize.define('StoreIssueLine', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  issueId:      { type: DataTypes.UUID, allowNull: false },
  storeItemId:  { type: DataTypes.UUID, allowNull: false },
  qtyRequested: { type: DataTypes.DECIMAL(18, 3), defaultValue: 0 },
  qtyIssued:    { type: DataTypes.DECIMAL(18, 3), defaultValue: 0 },
  qtyReturned:  { type: DataTypes.DECIMAL(18, 3), defaultValue: 0 },
  unitCost:     { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  totalCost:    { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  notes:        { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'store_issue_lines' });

// ─── STOCK TRANSACTION LOG ──────────────────────────────────────────────────────
const StockTransaction = sequelize.define('StockTransaction', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  storeItemId:   { type: DataTypes.UUID, allowNull: false },
  projectId:     { type: DataTypes.UUID, allowNull: true },
  type: {
    type: DataTypes.ENUM('receipt', 'issue', 'return', 'adjustment', 'transfer'),
    allowNull: false,
  },
  referenceType: { type: DataTypes.STRING(50), allowNull: true },
  referenceId:   { type: DataTypes.UUID, allowNull: true },
  qty:           { type: DataTypes.DECIMAL(18, 3), allowNull: false },
  balanceAfter:  { type: DataTypes.DECIMAL(18, 3), allowNull: false },
  unitCost:      { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  notes:         { type: DataTypes.TEXT, allowNull: true },
  createdById:   { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'stock_transactions', updatedAt: false });

module.exports = {
  Letter, LetterRead,
  StoreItem, StoreReceipt, StoreReceiptLine,
  StoreIssue, StoreIssueLine, StockTransaction,
};
