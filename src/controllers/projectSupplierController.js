const { Supplier, Project } = require('../models/index');
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');
const { successResponse, errorResponse } = require('../utils/response');
const { audit } = require('../utils/audit');

// ProjectSupplier junction model (inline - no separate file needed)
const ProjectSupplier = sequelize.define('ProjectSupplier', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  projectId:  { type: DataTypes.UUID, allowNull: false },
  supplierId: { type: DataTypes.UUID, allowNull: false },
  role:       { type: DataTypes.STRING(100), allowNull: true },  // e.g. Main Contractor, Sub-Contractor
  notes:      { type: DataTypes.TEXT, allowNull: true },
  isActive:   { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'project_suppliers' });

// Associations
ProjectSupplier.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
ProjectSupplier.belongsTo(Project,  { foreignKey: 'projectId',  as: 'project'  });

// GET /api/projects/:projectId/suppliers
exports.listProjectSuppliers = async (req, res, next) => {
  try {
    await ProjectSupplier.sync({ alter: true });
    const rows = await ProjectSupplier.findAll({
      where: { projectId: req.params.projectId, isActive: true },
      include: [{
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'name', 'email', 'phone', 'category', 'taxNumber', 'isActive'],
      }],
      order: [['createdAt', 'ASC']],
    });
    return successResponse(res, { suppliers: rows });
  } catch (err) { next(err); }
};

// POST /api/projects/:projectId/suppliers
exports.addProjectSupplier = async (req, res, next) => {
  try {
    await ProjectSupplier.sync({ alter: true });
    const { supplierId, role, notes } = req.body;
    if (!supplierId) return errorResponse(res, 'supplierId is required', 400);

    // Check supplier exists
    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) return errorResponse(res, 'Supplier not found', 404);

    // Check already added
    const existing = await ProjectSupplier.findOne({
      where: { projectId: req.params.projectId, supplierId, isActive: true }
    });
    if (existing) return errorResponse(res, 'Supplier already added to this project', 400);

    const ps = await ProjectSupplier.create({
      projectId: req.params.projectId, supplierId, role, notes
    });

    const full = await ProjectSupplier.findByPk(ps.id, {
      include: [{ model: Supplier, as: 'supplier' }]
    });

    await audit({
      userId: req.userId, action: 'add_project_supplier',
      resource: 'project_supplier', resourceId: ps.id,
      req, projectId: req.params.projectId,
    });

    return successResponse(res, { supplier: full }, 'Supplier added to project', 201);
  } catch (err) { next(err); }
};

// PUT /api/projects/:projectId/suppliers/:psId
exports.updateProjectSupplier = async (req, res, next) => {
  try {
    const ps = await ProjectSupplier.findOne({
      where: { id: req.params.psId, projectId: req.params.projectId }
    });
    if (!ps) return errorResponse(res, 'Not found', 404);
    await ps.update({ role: req.body.role, notes: req.body.notes });
    const full = await ProjectSupplier.findByPk(ps.id, {
      include: [{ model: Supplier, as: 'supplier' }]
    });
    return successResponse(res, { supplier: full }, 'Updated');
  } catch (err) { next(err); }
};

// DELETE /api/projects/:projectId/suppliers/:psId
exports.removeProjectSupplier = async (req, res, next) => {
  try {
    const ps = await ProjectSupplier.findOne({
      where: { id: req.params.psId, projectId: req.params.projectId }
    });
    if (!ps) return errorResponse(res, 'Not found', 404);
    await ps.update({ isActive: false });
    await audit({
      userId: req.userId, action: 'remove_project_supplier',
      resource: 'project_supplier', resourceId: ps.id,
      req, projectId: req.params.projectId,
    });
    return successResponse(res, null, 'Supplier removed from project');
  } catch (err) { next(err); }
};
