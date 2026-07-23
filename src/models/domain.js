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
    projectManagerId: {
      type: DataTypes.UUID,
      allowNull: true,
      validate: { isUUID: 4 },
    },
    location: { type: DataTypes.STRING(255), allowNull: true },
    totalBudget: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: "TZS" },
    progress: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    createdById: { type: DataTypes.UUID, allowNull: true },
    showOnHomePage: { type: DataTypes.BOOLEAN, defaultValue: false },
    visibility: { type: DataTypes.ENUM("public", "private"), defaultValue: "public" },
    displayOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
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

// ─── REPORT ────────────────────────────────────────────────────────────────────
const Report = sequelize.define(
  "Report",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    phaseId: { type: DataTypes.UUID, allowNull: true },
    reportNo: { type: DataTypes.STRING(100), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    type: { type: DataTypes.STRING(100), defaultValue: "Progress Report" },
    period: { type: DataTypes.STRING(100), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(50), defaultValue: "Completed" },
    progress: { type: DataTypes.DECIMAL(5, 2), defaultValue: 100 },
    submittedById: { type: DataTypes.UUID, allowNull: true },
    submittedBy: { type: DataTypes.STRING(255), allowNull: true },
    approvedById: { type: DataTypes.UUID, allowNull: true },
    submittedOn: { type: DataTypes.DATE, allowNull: true },
    fileUrl: { type: DataTypes.STRING(500), allowNull: true },
    fileName: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: "project_reports" },
);

module.exports = {
  Project,
  ProjectPhase,
  Activity,
  Supplier,
  BudgetItem,
  Report,
  TeamMember,
  AuditLog,
  Client,
};
