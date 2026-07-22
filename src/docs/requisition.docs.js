/**
 * @swagger
 * tags:
 *   - name: Requisitions
 *     description: Requisition Note workflow
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RequisitionItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         serialNo:
 *           type: integer
 *         productId:
 *           type: string
 *           format: uuid
 *         description:
 *           type: string
 *         unit:
 *           type: string
 *         quantityOrdered:
 *           type: number
 *         quantityIssued:
 *           type: number
 *         unitPrice:
 *           type: number
 *
 *     Requisition:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         requisitionNo:
 *           type: string
 *           example: RN-2026-001
 *         projectId:
 *           type: string
 *           format: uuid
 *         siteLocation:
 *           type: string
 *         designation:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [draft, submitted, reviewed, approved, issued, rejected, cancelled]
 *         notes:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RequisitionItem'
 *         requestedBy:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     RequisitionRequest:
 *       type: object
 *       required:
 *         - date
 *         - items
 *       properties:
 *         siteLocation:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         designation:
 *           type: string
 *         notes:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - description
 *               - quantityOrdered
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *               unit:
 *                 type: string
 *               quantityOrdered:
 *                 type: number
 *               unitPrice:
 *                 type: number
 */

/**
 * @swagger
 * /projects/{projectId}/requisitions:
 *   get:
 *     summary: List requisitions
 *     tags: [Requisitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, reviewed, approved, issued, rejected, cancelled]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list
 *   post:
 *     summary: Create requisition
 *     tags: [Requisitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequisitionRequest'
 *     responses:
 *       201:
 *         description: Created
 *
 * /projects/{projectId}/requisitions/{reqId}:
 *   get:
 *     summary: Get requisition
 *     tags: [Requisitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Requisition details
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
 *                     requisition:
 *                       $ref: '#/components/schemas/Requisition'
 *   put:
 *     summary: Update requisition
 *     tags: [Requisitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequisitionRequest'
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Delete requisition
 *     tags: [Requisitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deleted
 *
 * /projects/{projectId}/requisitions/{reqId}/submit:
 *   post:
 *     summary: Submit requisition
 *     tags: [Requisitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Submitted
 *
 * /projects/{projectId}/requisitions/{reqId}/review:
 *   post:
 *     summary: Review requisition
 *     tags: [Requisitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reviewed
 *
 * /projects/{projectId}/requisitions/{reqId}/approve:
 *   post:
 *     summary: Approve requisition
 *     tags: [Requisitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approved
 *
 * /projects/{projectId}/requisitions/{reqId}/issue:
 *   post:
 *     summary: Issue requisition from store
 *     tags: [Requisitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *               issuedItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     quantityIssued:
 *                       type: number
 *     responses:
 *       200:
 *         description: Issued and store updated
 *
 * /projects/{projectId}/requisitions/{reqId}/reject:
 *   post:
 *     summary: Reject requisition
 *     tags: [Requisitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: reqId
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
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rejected
 *
 * /projects/{projectId}/requisitions/{reqId}/comments:
 *   post:
 *     summary: Add comment
 *     tags: [Requisitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: reqId
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
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *               isInternal:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Comment added
 */
