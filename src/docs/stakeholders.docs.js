/**
 * @swagger
 * tags:
 *   - name: Stakeholders
 *     description: Stakeholder management
 *   - name: StakeholderTypes
 *     description: Stakeholder type management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     StakeholderType:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: Contractor
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
 *
 *     Stakeholder:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: ABC Construction Ltd
 *         stakeholderTypeId:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         isActive:
 *           type: boolean
 *
 *     StakeholderRequest:
 *       type: object
 *       required:
 *         - name
 *         - stakeholderTypeId
 *       properties:
 *         name:
 *           type: string
 *         stakeholderTypeId:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         address:
 *           type: string
 */

/**
 * @swagger
 * /stakeholders/types:
 *   get:
 *     summary: List all stakeholder types
 *     tags: [StakeholderTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of stakeholder types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     types:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StakeholderType'
 *   post:
 *     summary: Create a stakeholder type
 *     tags: [StakeholderTypes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *
 * /stakeholders/types/{id}:
 *   put:
 *     summary: Update a stakeholder type
 *     tags: [StakeholderTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Delete a stakeholder type
 *     tags: [StakeholderTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deleted
 *
 * /stakeholders:
 *   get:
 *     summary: List all stakeholders
 *     tags: [Stakeholders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of stakeholders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stakeholders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Stakeholder'
 *   post:
 *     summary: Create a stakeholder
 *     tags: [Stakeholders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StakeholderRequest'
 *     responses:
 *       201:
 *         description: Created
 *
 * /stakeholders/{id}:
 *   get:
 *     summary: Get a stakeholder
 *     tags: [Stakeholders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Stakeholder details
 *   put:
 *     summary: Update a stakeholder
 *     tags: [Stakeholders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StakeholderRequest'
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Delete a stakeholder
 *     tags: [Stakeholders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deleted
 */
