const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// Career-application submissions from the public website ("Omba Kazi")
const JobApplication = sequelize.define(
  "JobApplication",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    position: { type: DataTypes.STRING(255), allowNull: true },
    coverMessage: { type: DataTypes.TEXT, allowNull: true },
    resumeFilename: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM("new", "reviewed", "archived"),
      defaultValue: "new",
    },
  },
  {
    tableName: "job_applications",
    timestamps: true,
  }
);

module.exports = { JobApplication };
