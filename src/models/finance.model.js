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

// ── Associations (Activity, Technician, User) ────────────────────────────────
// NB: catch blocks zina console.error na ujumbe halisi — baada ya kuanzisha
// server, angalia terminal/console yako kwa "❌" endapo association yoyote
// imeshindwa, na unipe hicho ujumbe kamili.
try {
  const { Activity } = require("./index"); // rekebisha path kama tofauti
  if (!Activity)
    throw new Error("Activity export haikupatikana kwenye ./index");
  Payment.belongsTo(Activity, { foreignKey: "activityId", as: "activity" });
  Invoice.belongsTo(Activity, { foreignKey: "activityId", as: "activity" });
  Budget.belongsTo(Activity, { foreignKey: "activityId", as: "activity" });
  Expense.belongsTo(Activity, { foreignKey: "activityId", as: "activity" });
  console.log("✅ finance.model.js: Activity associations zimeundwa");
} catch (e) {
  console.error(
    "❌ finance.model.js: IMESHINDWA kuunda Activity associations —",
    e.message,
  );
}

try {
  const { Technician } = require("./technician.model"); // rekebisha path kama tofauti
  if (!Technician)
    throw new Error(
      "Technician export haikupatikana kwenye ./technician.model",
    );
  Payment.belongsTo(Technician, {
    foreignKey: "paidToId",
    as: "paidTo",
  });
  console.log("✅ finance.model.js: Technician (paidTo) association imeundwa");
} catch (e) {
  console.error(
    "❌ finance.model.js: IMESHINDWA kuunda Technician association —",
    e.message,
  );
}

try {
  const { Supplier } = require("./index"); // Supplier iko kwenye ./domain, inapatikana kupitia ./index
  if (!Supplier)
    throw new Error("Supplier export haikupatikana kwenye ./index");
  Invoice.belongsTo(Supplier, { foreignKey: "supplierId", as: "supplier" });
  console.log("✅ finance.model.js: Supplier association (Invoice) imeundwa");
} catch (e) {
  console.error(
    "❌ finance.model.js: IMESHINDWA kuunda Supplier association —",
    e.message,
  );
}

try {
  const { LocalPurchaseOrder } = require("./index"); // pia inapatikana kupitia ./index
  if (!LocalPurchaseOrder)
    throw new Error("LocalPurchaseOrder export haikupatikana kwenye ./index");
  Invoice.belongsTo(LocalPurchaseOrder, { foreignKey: "lpoId", as: "lpo" });
  LocalPurchaseOrder.hasMany(Invoice, { foreignKey: "lpoId", as: "invoices" });
  console.log("✅ finance.model.js: LPO association (Invoice) imeundwa");
} catch (e) {
  console.error(
    "❌ finance.model.js: IMESHINDWA kuunda LPO association —",
    e.message,
  );
}

try {
  const { User } = require("./index");
  if (!User) throw new Error("User export haikupatikana kwenye ./index");
  Payment.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });
  Payment.belongsTo(User, { foreignKey: "approvedById", as: "approvedBy" });
  Payment.belongsTo(User, { foreignKey: "signedById", as: "signedBy" });
  Invoice.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });
  Invoice.belongsTo(User, { foreignKey: "approvedById", as: "approvedBy" });
  Expense.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });
  console.log("✅ finance.model.js: User associations zimeundwa");
} catch (e) {
  console.error(
    "❌ finance.model.js: IMESHINDWA kuunda User associations —",
    e.message,
  );
}

module.exports = {
  Budget,
  Payment,
  Invoice,
  InvoicePayment,
  Expense,
  ExpenseCategory,
  FundingSource,
  STATUS_VALUES,
};
