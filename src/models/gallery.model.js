const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ProjectGallery = sequelize.define(
  "ProjectGallery",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    mediaId: { type: DataTypes.UUID, allowNull: false },
    displayOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    caption: { type: DataTypes.STRING(255), allowNull: true },
    type: { type: DataTypes.STRING(50), defaultValue: 'photo' },
    visibility: { type: DataTypes.ENUM('public', 'private'), defaultValue: 'public' },
  },
  {
    tableName: "project_gallery",
    timestamps: true,
  }
);

module.exports = { ProjectGallery };
