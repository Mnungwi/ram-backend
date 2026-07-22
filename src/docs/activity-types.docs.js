/**
 * @swagger
 * tags:
 *   - name: Activity Types
 *     description: Admin-managed activity categories (Mobilization, Construction, Testing, etc.)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ActivityType:
 *       type: object
 *       properties:
 *         id:          { type: string, format: uuid }
 *         name:        { type: string, example: Construction }
 *         description: { type: string, example: General construction activities }
 *         color:       { type: string, example: '#dc2626' }
 *         icon:        { type: string, example: fa-building }
 *         isActive:    { type: boolean, example: true }
 *         order:       { type: integer, example: 6 }
 *         createdAt:   { type: string, format: date-time }
 *         updatedAt:   { type: string, format: date-time }
 *
 *     ActivityTypeRequest:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:        { type: string, example: Construction }
 *         description: { type: string }
 *         color:       { type: string, example: '#dc2626' }
 *         icon:        { type: string, example: fa-building }
 *         order:       { type: integer, example: 6 }
 *         isActive:    { type: boolean, example: true }
 */

/**
 * @swagger
 * /activity-types:
 *   get:
 *     summary: List all activity types
 *     tags: [Activity Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: all
 *         schema: { type: boolean }
 *         description: Include inactive types
 *     responses:
 *       200:
 *         description: List of activity types ordered by sequence
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
 *                         types:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/ActivityType' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *
 *   post:
 *     summary: Create a new activity type
 *     tags: [Activity Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ActivityTypeRequest' }
 *           example:
 *             name: "Landscaping"
 *             description: "Landscaping and external works"
 *             color: "#16a34a"
 *             icon: "fa-leaf"
 *             order: 11
 *     responses:
 *       201:
 *         description: Activity type created
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
 *                         type: { $ref: '#/components/schemas/ActivityType' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */

/**
 * @swagger
 * /activity-types/{typeId}:
 *   get:
 *     summary: Get a single activity type
 *     tags: [Activity Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: typeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Activity type details
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
 *                         type: { $ref: '#/components/schemas/ActivityType' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *
 *   put:
 *     summary: Update an activity type
 *     tags: [Activity Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: typeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ActivityTypeRequest' }
 *     responses:
 *       200:
 *         description: Activity type updated
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
 *                         type: { $ref: '#/components/schemas/ActivityType' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *
 *   delete:
 *     summary: Deactivate an activity type (soft delete)
 *     tags: [Activity Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: typeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Activity type deactivated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
