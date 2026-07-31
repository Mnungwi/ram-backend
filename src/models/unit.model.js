const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ─── UNIT OF MEASURE ──────────────────────────────────────────────────────────
const Unit = sequelize.define('Unit', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:         { type: DataTypes.STRING(50), allowNull: false, unique: 'units_name_unique' }, // e.g. Litres
  abbreviation: { type: DataTypes.STRING(20), allowNull: true },                // e.g. L
  category:     {
    type: DataTypes.ENUM('volume','weight','length','area','count','time','other'),
    defaultValue: 'count',
  },
  description:  { type: DataTypes.STRING(255), allowNull: true },
  isActive:     { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'units' });

module.exports = { Unit };
