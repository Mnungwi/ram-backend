const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const STATUS_VALUES = [
  "Open",
  "Pending Approval",
  "Approved",
  "Partially Paid",
  "Paid",
  "Overdue",
];

// ─── BUDGET (per category, per project) ──────────────────────────────────────
const Budget = sequelize.define(
  "Budget",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    activityId: { type: DataTypes.UUID, allowNull: false }, // -> Activity.id
    category: { type: DataTypes.STRING(150), allowNull: false }, // jina la activity, limehifadhiwa moja kwa moja
    budgetAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "budgets",
    indexes: [{ unique: true, fields: ["projectId", "activityId"] }],
  },
);

// ─── PAYMENT ──────────────────────────────────────────────────────────────────
const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    activityId: { type: DataTypes.UUID, allowNull: true },
    paidToId: { type: DataTypes.UUID, allowNull: true }, // -> Technician.id
    description: { type: DataTypes.STRING(500), allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    currency: { type: DataTypes.STRING(10), defaultValue: "TZS" },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.ENUM(...STATUS_VALUES), defaultValue: "Open" },
    signatureImage: { type: DataTypes.TEXT, allowNull: true },
    signedAt: { type: DataTypes.DATE, allowNull: true },
    signedById: { type: DataTypes.UUID, allowNull: true },
    biometricVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    biometricHash: { type: DataTypes.STRING, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
    approvedById: { type: DataTypes.UUID, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "payments" },
);

// ─── INVOICE ──────────────────────────────────────────────────────────────────
const Invoice = sequelize.define(
  "Invoice",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    activityId: { type: DataTypes.UUID, allowNull: true },
    supplierId: { type: DataTypes.UUID, allowNull: true }, // -> Supplier.id (nani anadaiwa)
    lpoId: { type: DataTypes.UUID, allowNull: true }, // -> LocalPurchaseOrder.id (HIARI — invoice inaweza kuwa huru)
    invoiceNo: { type: DataTypes.STRING(50), allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    currency: { type: DataTypes.STRING(10), defaultValue: "TZS" },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.ENUM(...STATUS_VALUES), defaultValue: "Open" },
    createdById: { type: DataTypes.UUID, allowNull: true },
    approvedById: { type: DataTypes.UUID, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    paidById: { type: DataTypes.UUID, allowNull: true },
    paidAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "invoices" },
);

// ─── INVOICE PAYMENT (malipo ya sehemu-sehemu dhidi ya Invoice) ──────────────
const InvoicePayment = sequelize.define(
  "InvoicePayment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    invoiceId: { type: DataTypes.UUID, allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "invoice_payments" },
);

Invoice.hasMany(InvoicePayment, {
  foreignKey: "invoiceId",
  as: "paymentHistory",
});
InvoicePayment.belongsTo(Invoice, { foreignKey: "invoiceId", as: "invoice" });

// ─── EXPENSE CATEGORY (global, kama TechnicianCategory) ──────────────────────
const ExpenseCategory = sequelize.define(
  "ExpenseCategory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: 'expense_categories_name_unique' }, // e.g. Transport, Fuel, Office Supplies
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "expense_categories" },
);

// ─── EXPENSE ──────────────────────────────────────────────────────────────────
const Expense = sequelize.define(
  "Expense",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    activityId: { type: DataTypes.UUID, allowNull: true },
    categoryId: { type: DataTypes.UUID, allowNull: false }, // -> ExpenseCategory.id
    description: { type: DataTypes.STRING(500), allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    createdById: { type: DataTypes.UUID, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "expenses" },
);

ExpenseCategory.hasMany(Expense, { foreignKey: "categoryId", as: "expenses" });
Expense.belongsTo(ExpenseCategory, {
  foreignKey: "categoryId",
  as: "category",
});

// ─── FUNDING SOURCE ───────────────────────────────────────────────────────────
const FundingSource = sequelize.define(
  "FundingSource",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    type: { type: DataTypes.STRING(100), allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM("Active", "Partial", "Closed"),
      defaultValue: "Active",
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "funding_sources" },
);

// ─── SITE FUND DISBURSEMENT (cash handed to a project storekeeper for site
// expenses; their expenditure is simply their own Expense records for the
// project — see siteFundController.getBalance) ─────────────────────────────
const SiteFundDisbursement = sequelize.define(
  "SiteFundDisbursement",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    storekeeperUserId: { type: DataTypes.UUID, allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    method: {
      type: DataTypes.ENUM("cash", "bank_transfer", "mobile_money"),
      defaultValue: "cash",
    },
    referenceNo: { type: DataTypes.STRING(100), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    disbursedById: { type: DataTypes.UUID, allowNull: true },
  },
  {
    tableName: "site_fund_disbursements",
    // Match users.id / projects.id (utf8mb4_bin) so the FK constraints Sequelize
    // adds on sync({alter:true}) don't fail with errno 150.
    charset: "utf8mb4",
    collate: "utf8mb4_bin",
  },
);

// Associations defined in models/index.js

module.exports = {
  Budget,
  Payment,
  Invoice,
  InvoicePayment,
  Expense,
  ExpenseCategory,
  FundingSource,
  SiteFundDisbursement,
  STATUS_VALUES,
};
