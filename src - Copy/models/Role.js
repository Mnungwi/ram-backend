const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { notEmpty: true },
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { notEmpty: true },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isSystem: {
    // System roles cannot be deleted
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  color: {
    // UI badge color hex
    type: DataTypes.STRING(7),
    defaultValue: '#6366f1',
  },
}, {
  tableName: 'roles',
  hooks: {
    beforeValidate: (role) => {
      if (role.name && !role.slug) {
        role.slug = role.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      }
    },
  },
});

module.exports = Role;
