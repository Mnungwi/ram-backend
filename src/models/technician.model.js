const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// ─── TECHNICIAN CATEGORY ──────────────────────────────────────────────────────
const TechnicianCategory = sequelize.define(
  "TechnicianCategory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: 'technician_categories_name_unique' }, // e.g. Fundi Maji, Umeme, Ujenzi
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "technician_categories" },
);

// ─── TECHNICIAN (Global) ──────────────────────────────────────────────────────
const Technician = sequelize.define(
  "Technician",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    categoryId: { type: DataTypes.UUID, allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    idType: {
      type: DataTypes.ENUM(
        "NIDA",
        "Passport",
        "Driving License",
        "Voter ID",
        "Other",
      ),
      allowNull: true,
    },
    idNumber: { type: DataTypes.STRING(50), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "technicians" },
);

// ─── TECHNICIAN RECEIPT (Per Project) ─────────────────────────────────────────
const TechnicianReceipt = sequelize.define(
  "TechnicianReceipt",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    technicianId: { type: DataTypes.UUID, allowNull: false },
    projectId: { type: DataTypes.UUID, allowNull: false },
    requisitionId: { type: DataTypes.UUID, allowNull: true },
    storeTransactionId: { type: DataTypes.UUID, allowNull: true },
    productId: { type: DataTypes.UUID, allowNull: true },
    description: { type: DataTypes.STRING(500), allowNull: false },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    issuedById: { type: DataTypes.UUID, allowNull: false },
    issuedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    receiptNo: { type: DataTypes.STRING(50), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    signature: { type: DataTypes.TEXT, allowNull: true }, // base64 signature image
    acknowledged: { type: DataTypes.BOOLEAN, defaultValue: false },
    acknowledgedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "technician_receipts" },
);

// ── Associations ──────────────────────────────────────────
TechnicianCategory.hasMany(Technician, {
  foreignKey: "categoryId",
  as: "technicians",
});
Technician.belongsTo(TechnicianCategory, {
  foreignKey: "categoryId",
  as: "category",
});

Technician.hasMany(TechnicianReceipt, {
  foreignKey: "technicianId",
  as: "receipts",
});
TechnicianReceipt.belongsTo(Technician, {
  foreignKey: "technicianId",
  as: "technician",
});

// ─── PROJECT TECHNICIAN ───────────────────────────────────────────────────────
const ProjectTechnician = sequelize.define(
  "ProjectTechnician",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    technicianId: { type: DataTypes.UUID, allowNull: false },
    assignedById: { type: DataTypes.UUID, allowNull: true },
    assignedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    role: { type: DataTypes.STRING(100), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "project_technicians" },
);

// Associations
Technician.hasMany(ProjectTechnician, {
  foreignKey: "technicianId",
  as: "projectAssignments",
});
ProjectTechnician.belongsTo(Technician, {
  foreignKey: "technicianId",
  as: "technician",
});

module.exports = {
  Technician,
  TechnicianCategory,
  TechnicianReceipt,
  ProjectTechnician,
};
