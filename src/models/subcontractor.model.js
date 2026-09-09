const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// NOTE on collation: `charset: "utf8mb4", collate: "utf8mb4_bin"` on BOTH
// tables here is required, not decorative — every UUID primary/foreign key
// in this database (users.id, projects.id, ...) is utf8mb4_bin, but a new
// table created via sequelize.define() without this option defaults to the
// enclosing database's collation (utf8mb4_unicode_ci here). A FK column
// whose collation doesn't match its target column fails sync({alter:true})
// at boot with errno 150 "Foreign key constraint is incorrectly formed" —
// hit (and fixed the same way) for SiteFundDisbursement earlier.

// ─── SUBCONTRACTOR (per project) ───────────────────────────────────────────
const Subcontractor = sequelize.define(
  "Subcontractor",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    companyName: { type: DataTypes.STRING(200), allowNull: false },
    contactPerson: { type: DataTypes.STRING(150), allowNull: true },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    email: { type: DataTypes.STRING(150), allowNull: true },
    address: { type: DataTypes.STRING(255), allowNull: true },
    tradeScope: { type: DataTypes.STRING(150), allowNull: true }, // e.g. "Electrical", "Plumbing", "Steel Works"
    contractValue: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    endDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: {
      type: DataTypes.ENUM("active", "completed", "terminated"),
      defaultValue: "active",
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "subcontractors", charset: "utf8mb4", collate: "utf8mb4_bin" },
);

// ─── SUBCONTRACTOR DOCUMENT ─────────────────────────────────────────────────
const SubcontractorDocument = sequelize.define(
  "SubcontractorDocument",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    subcontractorId: { type: DataTypes.UUID, allowNull: false },
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    filePath: { type: DataTypes.STRING(500), allowNull: false }, // stored relative to DOCUMENTS_DIR, same convention as Document model
    fileType: { type: DataTypes.STRING(100), allowNull: true },
    fileSize: { type: DataTypes.INTEGER, allowNull: true }, // bytes
    category: { type: DataTypes.STRING(100), allowNull: true }, // e.g. "Contract", "Insurance", "License"
    uploadedById: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "subcontractor_documents", charset: "utf8mb4", collate: "utf8mb4_bin" },
);

Subcontractor.hasMany(SubcontractorDocument, { foreignKey: "subcontractorId", as: "documents" });
SubcontractorDocument.belongsTo(Subcontractor, { foreignKey: "subcontractorId", as: "subcontractor" });

module.exports = { Subcontractor, SubcontractorDocument };
