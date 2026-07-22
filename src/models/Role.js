const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    color: {
      type: DataTypes.STRING(7),
      defaultValue: "#6366f1",
    },
  },
  {
    tableName: "roles",

    indexes: [
      {
        unique: true,
        name: "roles_name_unique",
        fields: ["name"],
      },
      {
        unique: true,
        name: "roles_slug_unique",
        fields: ["slug"],
      },
    ],

    hooks: {
      beforeValidate: (role) => {
        if (role.name && !role.slug) {
          role.slug = role.name
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "");
        }
      },
    },
  },
);

module.exports = Role;
