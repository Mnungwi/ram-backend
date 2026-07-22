/**
 * @swagger
 * tags:
 *   - name: Phases
 *     description: Project phases management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Phase:
 *       type: object
 *       properties:
 *         id:          { type: string, format: uuid }
 *         projectId:   { type: string, format: uuid }
 *         name:        { type: string, example: 'Phase 1: Pre-Construction' }
 *         description: { type: string }
 *         order:       { type: integer, example: 1 }
 *         project:
 *           type: object
 *           properties:
 *             id:          { type: string, format: uuid }
 *             name:        { type: string, example: 'Zanzibar Airport Expansion' }
 *             projectCode: { type: string, example: 'ZAE-2026-001' }
 *         createdAt:   { type: string, format: date-time }
 *         updatedAt:   { type: string, format: date-time }
 *
 *     PhaseRequest:
 *       type: object
 *       required: [name, projectId]
 *       properties:
 *         projectId:   { type: string, format: uuid, description: 'Project this phase belongs to' }
 *         name:        { type: string, example: 'Phase 1: Pre-Construction & Mobilization' }
 *         description: { type: string }
 *         order:       { type: integer, example: 1, description: 'Auto-assigned if not provided' }
 */

/**
 * @swagger
 * /phases:
 *   get:
 *     summary: List all phases (all projects)
 *     tags: [Phases]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all phases with project info
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         phases:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Phase' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *
 *   post:
 *     summary: Create a new phase
 *     tags: [Phases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PhaseRequest' }
 *           example:
 *             projectId: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *             name: "Phase 1: Pre-Construction & Mobilization"
 *             description: "Site preparation, surveys, and contractor mobilization"
 *             order: 1
 *     responses:
 *       201:
 *         description: Phase created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         phase: { $ref: '#/components/schemas/Phase' }
 *       400:
 *         description: projectId is required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */

/**
 * @swagger
 * /phases/{id}:
 *   put:
 *     summary: Update a phase
 *     tags: [Phases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Phase UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PhaseRequest' }
 *     responses:
 *       200:
 *         description: Phase updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         phase: { $ref: '#/components/schemas/Phase' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *
 *   delete:
 *     summary: Delete a phase
 *     description: Cannot delete a phase that has activities linked to it.
 *     tags: [Phases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Phase UUID
 *     responses:
 *       200:
 *         description: Phase deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400:
 *         description: Phase has linked activities
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

/**
 * @swagger
 * /projects/{projectId}/phases:
 *   get:
 *     summary: List phases for a specific project
 *     tags: [Phases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     responses:
 *       200:
 *         description: List of phases for the project
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         phases:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Phase' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */