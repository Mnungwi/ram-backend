/**
 * @swagger
 * tags:
 *   - name: Stakeholder Types
 *     description: Admin-managed list of stakeholder categories (Consultant, Government, Donor, etc.)
 *   - name: Stakeholders
 *     description: Global directory of individuals and organizations
 *   - name: Project Stakeholders
 *     description: Stakeholders linked to a specific project with roles and signatory flags
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     StakeholderType:
 *       type: object
 *       properties:
 *         id:          { type: string, format: uuid }
 *         name:        { type: string, example: Project Consultant }
 *         description: { type: string, example: Technical or management consultant }
 *         color:       { type: string, example: '#7c3aed' }
 *         isActive:    { type: boolean, example: true }
 *         order:       { type: integer, example: 2 }
 *         createdAt:   { type: string, format: date-time }
 *         updatedAt:   { type: string, format: date-time }
 *
 *     StakeholderTypeRequest:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:        { type: string, example: Project Consultant }
 *         description: { type: string }
 *         color:       { type: string, example: '#7c3aed' }
 *         order:       { type: integer, example: 2 }
 *         isActive:    { type: boolean, example: true }
 *
 *     Stakeholder:
 *       type: object
 *       properties:
 *         id:               { type: string, format: uuid }
 *         name:             { type: string, example: 'Eng. Hassan Juma' }
 *         organization:     { type: string, example: 'Farida Projects Ltd' }
 *         jobTitle:         { type: string, example: 'Senior Project Manager' }
 *         email:            { type: string, format: email, example: hassan@farida.co.tz }
 *         phone:            { type: string, example: '+255 773 100 002' }
 *         phone2:           { type: string, example: '+255 773 100 003' }
 *         address:          { type: string }
 *         city:             { type: string, example: 'Zanzibar City' }
 *         country:          { type: string, example: 'Tanzania' }
 *         stakeholderTypeId:{ type: string, format: uuid }
 *         defaultType:      { $ref: '#/components/schemas/StakeholderType' }
 *         notes:            { type: string }
 *         isActive:         { type: boolean, example: true }
 *         createdAt:        { type: string, format: date-time }
 *         updatedAt:        { type: string, format: date-time }
 *
 *     StakeholderRequest:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:              { type: string, example: 'Eng. Hassan Juma' }
 *         organization:      { type: string, example: 'Farida Projects Ltd' }
 *         jobTitle:          { type: string, example: 'Senior Project Manager' }
 *         email:             { type: string, format: email, example: hassan@farida.co.tz }
 *         phone:             { type: string, example: '+255 773 100 002' }
 *         phone2:            { type: string }
 *         address:           { type: string }
 *         city:              { type: string, example: 'Zanzibar City' }
 *         country:           { type: string, example: 'Tanzania' }
 *         stakeholderTypeId: { type: string, format: uuid, description: 'Default type UUID' }
 *         notes:             { type: string }
 *
 *     ProjectStakeholder:
 *       type: object
 *       properties:
 *         id:               { type: string, format: uuid }
 *         projectId:        { type: string, format: uuid }
 *         stakeholderId:    { type: string, format: uuid }
 *         stakeholderTypeId:{ type: string, format: uuid }
 *         stakeholder:      { $ref: '#/components/schemas/Stakeholder' }
 *         type:             { $ref: '#/components/schemas/StakeholderType' }
 *         role:             { type: string, example: 'Lead Consultant' }
 *         isSignatory:      { type: boolean, example: true }
 *         isPrimary:        { type: boolean, example: true }
 *         signatureOrder:   { type: integer, example: 1 }
 *         startDate:        { type: string, format: date }
 *         endDate:          { type: string, format: date }
 *         notes:            { type: string }
 *         isActive:         { type: boolean, example: true }
 *
 *     ProjectStakeholderRequest:
 *       type: object
 *       required: [stakeholderId]
 *       properties:
 *         stakeholderId:    { type: string, format: uuid, description: 'UUID of existing Stakeholder' }
 *         stakeholderTypeId:{ type: string, format: uuid, description: 'Type on this project (overrides default)' }
 *         role:             { type: string, example: 'Lead Consultant' }
 *         isSignatory:      { type: boolean, example: true, description: 'Is this person a project signatory?' }
 *         isPrimary:        { type: boolean, example: true, description: 'Primary contact for their type?' }
 *         signatureOrder:   { type: integer, example: 1, description: 'Signing order (1st, 2nd, 3rd...)' }
 *         startDate:        { type: string, format: date }
 *         endDate:          { type: string, format: date }
 *         notes:            { type: string }
 */

// ═══════════════════════════════════════════════════════
// STAKEHOLDER TYPES  /api/stakeholder-types
// ═══════════════════════════════════════════════════════

/**
 * @swagger
 * /stakeholder-types:
 *   get:
 *     summary: List all stakeholder types
 *     tags: [Stakeholder Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: all
 *         schema: { type: boolean }
 *         description: Include inactive types
 *     responses:
 *       200:
 *         description: List of stakeholder types
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
 *                           items: { $ref: '#/components/schemas/StakeholderType' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *
 *   post:
 *     summary: Create a stakeholder type
 *     tags: [Stakeholder Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/StakeholderTypeRequest' }
 *     responses:
 *       201:
 *         description: Stakeholder type created
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
 *                         type: { $ref: '#/components/schemas/StakeholderType' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */

/**
 * @swagger
 * /stakeholder-types/{typeId}:
 *   put:
 *     summary: Update a stakeholder type
 *     tags: [Stakeholder Types]
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
 *           schema: { $ref: '#/components/schemas/StakeholderTypeRequest' }
 *     responses:
 *       200:
 *         description: Stakeholder type updated
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
 *                         type: { $ref: '#/components/schemas/StakeholderType' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *
 *   delete:
 *     summary: Deactivate a stakeholder type
 *     tags: [Stakeholder Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: typeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Stakeholder type deactivated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

// ═══════════════════════════════════════════════════════
// STAKEHOLDERS  /api/stakeholders  (global directory)
// ═══════════════════════════════════════════════════════

/**
 * @swagger
 * /stakeholders:
 *   get:
 *     summary: List all stakeholders (global directory)
 *     tags: [Stakeholders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/search'
 *       - in: query
 *         name: stakeholderTypeId
 *         schema: { type: string, format: uuid }
 *         description: Filter by stakeholder type
 *     responses:
 *       200:
 *         description: Paginated list of stakeholders
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Stakeholder' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 *   post:
 *     summary: Create a stakeholder in the global directory
 *     tags: [Stakeholders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/StakeholderRequest' }
 *     responses:
 *       201:
 *         description: Stakeholder created
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
 *                         stakeholder: { $ref: '#/components/schemas/Stakeholder' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */

/**
 * @swagger
 * /stakeholders/{stakeholderId}:
 *   get:
 *     summary: Get a stakeholder with their project history
 *     tags: [Stakeholders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stakeholderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Stakeholder details with linked projects
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
 *                         stakeholder: { $ref: '#/components/schemas/Stakeholder' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *
 *   put:
 *     summary: Update a stakeholder
 *     tags: [Stakeholders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stakeholderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/StakeholderRequest' }
 *     responses:
 *       200:
 *         description: Stakeholder updated
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
 *                         stakeholder: { $ref: '#/components/schemas/Stakeholder' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *
 *   delete:
 *     summary: Deactivate a stakeholder
 *     tags: [Stakeholders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stakeholderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Stakeholder deactivated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

// ═══════════════════════════════════════════════════════
// PROJECT STAKEHOLDERS  /api/projects/:projectId/stakeholders
// ═══════════════════════════════════════════════════════

/**
 * @swagger
 * /projects/{projectId}/stakeholders:
 *   get:
 *     summary: List all stakeholders on a project
 *     tags: [Project Stakeholders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: query
 *         name: all
 *         schema: { type: boolean }
 *         description: Include inactive/removed stakeholders
 *     responses:
 *       200:
 *         description: List of project stakeholders with roles and signatory status
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
 *                         stakeholders:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/ProjectStakeholder' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *
 *   post:
 *     summary: Link an existing stakeholder to a project
 *     description: The stakeholder must first exist in the global directory (/api/stakeholders). This endpoint links them to the project with a specific role and flags.
 *     tags: [Project Stakeholders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProjectStakeholderRequest' }
 *           example:
 *             stakeholderId: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *             stakeholderTypeId: "3fa85f64-5717-4562-b3fc-2c963f66afa7"
 *             role: "Lead Consultant"
 *             isSignatory: true
 *             isPrimary: true
 *             signatureOrder: 2
 *     responses:
 *       201:
 *         description: Stakeholder linked to project
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
 *                         stakeholder: { $ref: '#/components/schemas/ProjectStakeholder' }
 *       400:
 *         description: Stakeholder already linked to this project
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */

/**
 * @swagger
 * /projects/{projectId}/stakeholders/signatories:
 *   get:
 *     summary: Get project signatories only
 *     description: Returns only stakeholders marked as isSignatory=true, ordered by signatureOrder.
 *     tags: [Project Stakeholders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     responses:
 *       200:
 *         description: List of project signatories in signing order
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
 *                         signatories:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/ProjectStakeholder' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */

/**
 * @swagger
 * /projects/{projectId}/stakeholders/{psId}:
 *   put:
 *     summary: Update a stakeholder's role/flags on this project
 *     tags: [Project Stakeholders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: psId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ProjectStakeholder UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProjectStakeholderRequest' }
 *     responses:
 *       200:
 *         description: Project stakeholder updated
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
 *                         stakeholder: { $ref: '#/components/schemas/ProjectStakeholder' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *
 *   delete:
 *     summary: Remove a stakeholder from this project
 *     tags: [Project Stakeholders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: psId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ProjectStakeholder UUID
 *     responses:
 *       200:
 *         description: Stakeholder removed from project
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
