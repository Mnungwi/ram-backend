const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// ─── PRODUCT CATEGORY ─────────────────────────────────────────────────────────
const ProductCategory = sequelize.define(
  "ProductCategory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: 'product_categories_name_unique' },
    description: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "product_categories" },
);

// ─── PRODUCT ──────────────────────────────────────────────────────────────────
const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    categoryId: { type: DataTypes.UUID, allowNull: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: true, unique: 'products_code_unique' }, // e.g. PRD-001
    description: { type: DataTypes.TEXT, allowNull: true },
    unitId: { type: DataTypes.UUID, allowNull: true }, // e.g. Litres, Kg, Bags, Tonne
    purchaseUnit: { type: DataTypes.STRING(50), allowNull: true }, // e.g. Ton, Roll, Box
    issueUnit: { type: DataTypes.STRING(50), allowNull: true }, // e.g. Pcs, Meter, Sqm
    conversionFactor: { type: DataTypes.DECIMAL(10, 4), defaultValue: 1 }, // e.g. 187 pcs per Ton for 12mm rebar
    unitPrice: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "products" },
);

module.exports = { Product, ProductCategory };
