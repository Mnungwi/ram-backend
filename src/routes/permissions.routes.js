const express = require('express');
const router = express.Router();
const roleCtrl = require('../controllers/roleController');
const { authenticate, authorize } = require('../middleware/auth');
const { PERMISSIONS: P } = require('../config/permissions');
const { Permission } = require('../models/index');
const { successResponse, errorResponse } = require('../utils/response');

router.use(authenticate);

// GET /api/permissions
router.get('/', authorize(P.ROLE_VIEW), roleCtrl.listPermissions);

// POST /api/permissions — create new permission
router.post('/', authorize(P.PERMISSION_ASSIGN), async (req, res, next) => {
  try {
    const { name, resource, action, description, group } = req.body;
    if (!name) return errorResponse(res, 'Name is required', 400);
    const existing = await Permission.findOne({ where: { name } });
    if (existing) return errorResponse(res, 'Permission already exists', 400);
    const permission = await Permission.create({ name, resource, action, description, group });
    return successResponse(res, { permission }, 'Permission created', 201);
  } catch (err) { next(err); }
});

// PUT /api/permissions/:permissionId — update permission
router.put('/:permissionId', authorize(P.PERMISSION_ASSIGN), async (req, res, next) => {
  try {
    const permission = await Permission.findByPk(req.params.permissionId);
    if (!permission) return errorResponse(res, 'Permission not found', 404);
    await permission.update(req.body);
    return successResponse(res, { permission }, 'Permission updated');
  } catch (err) { next(err); }
});

// DELETE /api/permissions/:permissionId — delete permission
router.delete('/:permissionId', authorize(P.PERMISSION_ASSIGN), async (req, res, next) => {
  try {
    const permission = await Permission.findByPk(req.params.permissionId);
    if (!permission) return errorResponse(res, 'Permission not found', 404);
    await permission.destroy();
    return successResponse(res, null, 'Permission deleted');
  } catch (err) { next(err); }
});

module.exports = router;
