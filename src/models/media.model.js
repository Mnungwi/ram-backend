const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Media = sequelize.define(
  "Media",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    filename: { type: DataTypes.STRING(255), allowNull: false },
    originalName: { type: DataTypes.STRING(255), allowNull: false },
    mimeType: { type: DataTypes.STRING(100), allowNull: false },
    size: { type: DataTypes.INTEGER, allowNull: false },
    hash: { type: DataTypes.STRING(64), allowNull: false, unique: 'media_hash_unique' },
    title: { type: DataTypes.STRING(255), allowNull: true },
    altText: { type: DataTypes.STRING(255), allowNull: true },
    createdById: { type: DataTypes.UUID, allowNull: true },
  },
  {
    tableName: "media_library",
    timestamps: true,
  }
);

module.exports = { Media };
