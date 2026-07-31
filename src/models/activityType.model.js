const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ─── ACTIVITY TYPE ────────────────────────────────────────────────────────────
// Admin-managed list of activity categories/types
const ActivityType = sequelize.define('ActivityType', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:        { type: DataTypes.STRING(150), allowNull: false, unique: 'activity_types_name_unique' },
  description: { type: DataTypes.TEXT, allowNull: true },
  color:       { type: DataTypes.STRING(20), allowNull: true, defaultValue: '#6b7280' },
  icon:        { type: DataTypes.STRING(50), allowNull: true },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
  order:       { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'activity_types' });

module.exports = { ActivityType };
