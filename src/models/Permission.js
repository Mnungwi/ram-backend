const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true,
    validate: { notEmpty: true },
    comment: 'e.g. project:create',
  },
  resource: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'e.g. project, finance, report',
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'e.g. view, create, update, delete, approve',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  group: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'UI grouping label',
  },
}, {
  tableName: 'permissions',
});

module.exports = Permission;
