const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// Contact-form submissions from the public website ("Wasiliana Nasi")
const Inquiry = sequelize.define(
  "Inquiry",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    subject: { type: DataTypes.STRING(255), allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM("new", "read", "archived"),
      defaultValue: "new",
    },
  },
  {
    tableName: "inquiries",
    timestamps: true,
  }
);

module.exports = { Inquiry };
