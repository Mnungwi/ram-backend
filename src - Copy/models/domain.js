const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// ─── PROJECT ───────────────────────────────────────────────────────────────────
const Project = sequelize.define(
  "Project",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectCode: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    image: { type: DataTypes.STRING(500), allowNull: true },
    status: {
      type: DataTypes.ENUM("active", "on_hold", "completed", "cancelled"),
      defaultValue: "active",
    },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    clientId: { type: DataTypes.UUID, allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    totalBudget: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: "TZS" },
    progress: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "projects" },
);

// ─── PROJECT PHASE ─────────────────────────────────────────────────────────────
const ProjectPhase = sequelize.define(
  "ProjectPhase",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    order: { type: DataTypes.INTEGER, defaultValue: 1 },
  },
  { tableName: "project_phases" },
);

// ─── ACTIVITY ──────────────────────────────────────────────────────────────────
const Activity = sequelize.define(
  "Activity",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    phaseId: { type: DataTypes.UUID, allowNull: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    type: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "Pending",
        "In Progress",
        "Completed",
        "Overdue",
        "on hold",
      ),
      defaultValue: "Pending",
    },
    progress: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false },
    completedDate: { type: DataTypes.DATEONLY, allowNull: true },
    assignedTo: { type: DataTypes.STRING, allowNull: true },
    priority: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "activities" },
);

// ─── CONTRACT ──────────────────────────────────────────────────────────────────
const Contract = sequelize.define(
  "Contract",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    contractNo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    contractor: { type: DataTypes.STRING(255), allowNull: false },
    category: { type: DataTypes.STRING(100), allowNull: true },
    contractValue: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: "TZS" },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "active",
        "pending",
        "completed",
        "terminated",
      ),
      defaultValue: "draft",
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "contracts" },
);

// ─── PURCHASE ORDER ────────────────────────────────────────────────────────────
const PurchaseOrder = sequelize.define(
  "PurchaseOrder",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    contractId: { type: DataTypes.UUID, allowNull: true },
    poNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    supplierId: { type: DataTypes.UUID, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    amount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: "TZS" },
    issuedDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: {
      type: DataTypes.ENUM(
        "open",
        "received",
        "partial",
        "closed",
        "cancelled",
      ),
      defaultValue: "open",
    },
    approvedById: { type: DataTypes.UUID, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "purchase_orders" },
);

// ─── SUPPLIER ──────────────────────────────────────────────────────────────────
const Supplier = sequelize.define(
  "Supplier",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: { isEmail: true },
    },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING(100), allowNull: true },
    taxNumber: { type: DataTypes.STRING(100), allowNull: true },
    bankDetails: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "suppliers" },
);

// ─── CLIENT ──────────────────────────────────────────────────────────────────
const Client = sequelize.define(
  "Client",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    contactPerson: { type: DataTypes.STRING(255), allowNull: true },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: { isEmail: true },
    },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    company: { type: DataTypes.STRING(255), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    city: { type: DataTypes.STRING(150), allowNull: true },
    country: {
      type: DataTypes.STRING(150),
      allowNull: true,
      defaultValue: "Tanzania",
    },
    taxNumber: { type: DataTypes.STRING(100), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "clients" },
);

// ─── INVOICE ───────────────────────────────────────────────────────────────────
const Invoice = sequelize.define(
  "Invoice",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    invoiceNo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    contractId: { type: DataTypes.UUID, allowNull: true },
    supplierId: { type: DataTypes.UUID, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    amount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    tax: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    totalAmount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: "TZS" },
    invoiceDate: { type: DataTypes.DATEONLY, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "pending",
        "approved",
        "paid",
        "overdue",
        "cancelled",
      ),
      defaultValue: "draft",
    },
    approvedById: { type: DataTypes.UUID, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "invoices" },
);

// ─── PAYMENT ───────────────────────────────────────────────────────────────────
const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    paymentRef: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    invoiceId: { type: DataTypes.UUID, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    amount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: "TZS" },
    paymentDate: { type: DataTypes.DATEONLY, allowNull: false },
    paymentMethod: { type: DataTypes.STRING(100), allowNull: true },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "pending_approval",
        "paid",
        "failed",
        "refunded",
      ),
      defaultValue: "pending",
    },
    approvedById: { type: DataTypes.UUID, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "payments" },
);

// ─── REPORT ────────────────────────────────────────────────────────────────────
const Report = sequelize.define(
  "Report",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    phaseId: { type: DataTypes.UUID, allowNull: true },
    reportNo: { type: DataTypes.STRING(50), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    type: {
      type: DataTypes.ENUM(
        "progress_report",
        "test_report",
        "rfi_report",
        "inspection_report",
        "completion_report",
        "financial_report",
        "environmental_report",
        "other",
      ),
      allowNull: false,
    },
    period: { type: DataTypes.STRING(100), allowNull: true },
    content: { type: DataTypes.TEXT("long"), allowNull: true },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "in_progress",
        "completed",
        "approved",
        "pending",
        "overdue",
      ),
      defaultValue: "draft",
    },
    progress: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    submittedById: { type: DataTypes.UUID, allowNull: true },
    submittedOn: { type: DataTypes.DATEONLY, allowNull: true },
    approvedById: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "reports" },
);

// ─── DOCUMENT ──────────────────────────────────────────────────────────────────
const Document = sequelize.define(
  "Document",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    category: { type: DataTypes.STRING(100), allowNull: true },
    filePath: { type: DataTypes.STRING(500), allowNull: false },
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    fileSize: { type: DataTypes.INTEGER, allowNull: true },
    mimeType: { type: DataTypes.STRING(100), allowNull: true },
    version: { type: DataTypes.STRING(20), defaultValue: "1.0" },
    description: { type: DataTypes.TEXT, allowNull: true },
    uploadedById: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "documents" },
);

// ─── TEAM MEMBER ───────────────────────────────────────────────────────────────
const TeamMember = sequelize.define(
  "TeamMember",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    role: { type: DataTypes.STRING(150), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "team_members" },
);

// ─── EXPENSE ───────────────────────────────────────────────────────────────────
const Expense = sequelize.define(
  "Expense",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    category: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    amount: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: "TZS" },
    expenseDate: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.ENUM("draft", "pending", "approved", "rejected"),
      defaultValue: "draft",
    },
    createdById: { type: DataTypes.UUID, allowNull: true },
    approvedById: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "expenses" },
);

// ─── BUDGET ITEM ───────────────────────────────────────────────────────────────
const BudgetItem = sequelize.define(
  "BudgetItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    category: { type: DataTypes.STRING(150), allowNull: false },
    budget: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    committed: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    paid: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: "TZS" },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "budget_items" },
);

// ─── AUDIT LOG ─────────────────────────────────────────────────────────────────
const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: true },
    action: { type: DataTypes.STRING(100), allowNull: false },
    resource: { type: DataTypes.STRING(100), allowNull: false },
    resourceId: { type: DataTypes.STRING(255), allowNull: true },
    oldValues: { type: DataTypes.JSON, allowNull: true },
    newValues: { type: DataTypes.JSON, allowNull: true },
    ipAddress: { type: DataTypes.STRING(50), allowNull: true },
    userAgent: { type: DataTypes.TEXT, allowNull: true },
    projectId: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "audit_logs", updatedAt: false },
);

module.exports = {
  Project,
  ProjectPhase,
  Activity,
  Contract,
  PurchaseOrder,
  Supplier,
  Invoice,
  Payment,
  Expense,
  BudgetItem,
  Report,
  Document,
  TeamMember,
  AuditLog,
  Client,
};
