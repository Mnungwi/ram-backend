const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ─── STAKEHOLDER TYPE ─────────────────────────────────────────────────────────
// Admin-managed list of types: Consultant, Government, Donor, NGO, etc.
const StakeholderType = sequelize.define('StakeholderType', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:        { type: DataTypes.STRING(150), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  color:       { type: DataTypes.STRING(20), allowNull: true, defaultValue: '#6b7280' },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
  order:       { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'stakeholder_types' });

// ─── STAKEHOLDER ──────────────────────────────────────────────────────────────
// Master directory of individuals/organizations (like an address book)
const Stakeholder = sequelize.define('Stakeholder', {
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:            { type: DataTypes.STRING(255), allowNull: false },
  organization:    { type: DataTypes.STRING(255), allowNull: true },
  jobTitle:        { type: DataTypes.STRING(255), allowNull: true },
  email:           { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
  phone:           { type: DataTypes.STRING(50),  allowNull: true },
  phone2:          { type: DataTypes.STRING(50),  allowNull: true },
  address:         { type: DataTypes.TEXT,        allowNull: true },
  city:            { type: DataTypes.STRING(150), allowNull: true },
  country:         { type: DataTypes.STRING(150), allowNull: true, defaultValue: 'Tanzania' },
  stakeholderTypeId: { type: DataTypes.UUID,      allowNull: true }, // default type
  notes:           { type: DataTypes.TEXT,        allowNull: true },
  isActive:        { type: DataTypes.BOOLEAN,     defaultValue: true },
  createdById:     { type: DataTypes.UUID,        allowNull: true },
}, { tableName: 'stakeholders' });

// ─── PROJECT STAKEHOLDER ──────────────────────────────────────────────────────
// Junction: links a Stakeholder to a Project with project-specific role/flags
const ProjectStakeholder = sequelize.define('ProjectStakeholder', {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  projectId:        { type: DataTypes.UUID, allowNull: false },
  stakeholderId:    { type: DataTypes.UUID, allowNull: false },
  stakeholderTypeId:{ type: DataTypes.UUID, allowNull: true }, // type on THIS project (may differ from default)
  role:             { type: DataTypes.STRING(255), allowNull: true }, // e.g. "Lead Consultant", "Site Rep"
  isSignatory:      { type: DataTypes.BOOLEAN, defaultValue: false }, // is this person a signatory?
  isPrimary:        { type: DataTypes.BOOLEAN, defaultValue: false }, // primary contact of their type?
  signatureOrder:   { type: DataTypes.INTEGER, allowNull: true },     // signing order (1st, 2nd, 3rd...)
  startDate:        { type: DataTypes.DATEONLY, allowNull: true },
  endDate:          { type: DataTypes.DATEONLY, allowNull: true },
  notes:            { type: DataTypes.TEXT, allowNull: true },
  isActive:         { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'project_stakeholders' });

module.exports = { StakeholderType, Stakeholder, ProjectStakeholder };
