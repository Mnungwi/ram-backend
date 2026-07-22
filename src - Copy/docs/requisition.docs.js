/**
 * @swagger
 * tags:
 *   - name: Requisitions
 *     description: Requisition Notes (RN) management and workflow
 *   - name: LPO
 *     description: Local Purchase Orders management and workflow
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     RequisitionItem:
 *       type: object
 *       properties:
 *         id:              { type: string, format: uuid }
 *         serialNo:        { type: integer, example: 1 }
 *         description:     { type: string, example: 'Diesel' }
 *         unit:            { type: string, example: 'Litres' }
 *         quantityOrdered: { type: number, example: 10 }
 *         quantityIssued:  { type: number, example: 0 }
 *         unitPrice:       { type: number, example: 3500 }
 *         notes:           { type: string }
 *
 *     RequisitionComment:
 *       type: object
 *       properties:
 *         id:         { type: string, format: uuid }
 *         step:       { type: string, example: 'submitted' }
 *         comment:    { type: string }
 *         isInternal: { type: boolean }
 *         user:
 *           type: object
 *           properties:
 *             id:        { type: string, format: uuid }
 *             firstName: { type: string }
 *             lastName:  { type: string }
 *             jobTitle:  { type: string }
 *         createdAt: { type: string, format: date-time }
 *
 *     Requisition:
 *       type: object
 *       properties:
 *         id:            { type: string, format: uuid }
 *         requisitionNo: { type: string, example: 'RN-2026-001' }
 *         projectId:     { type: string, format: uuid }
 *         siteLocation:  { type: string, example: 'WGLEZO SITE' }
 *         date:          { type: string, format: date }
 *         designation:   { type: string, example: 'Storekeeper' }
 *         status:
 *           type: string
 *           enum: [draft, submitted, reviewed, approved, issued, rejected, cancelled]
 *         notes:         { type: string }
 *         requestedBy:
 *           type: object
 *           properties:
 *             id: { type: string }, firstName: { type: string }, lastName: { type: string }
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/RequisitionItem' }
 *         comments:
 *           type: array
 *           items: { $ref: '#/components/schemas/RequisitionComment' }
 *         submittedAt: { type: string, format: date-time }
 *         reviewedAt:  { type: string, format: date-time }
 *         approvedAt:  { type: string, format: date-time }
 *         issuedAt:    { type: string, format: date-time }
 *         createdAt:   { type: string, format: date-time }
 *
 *     RequisitionRequest:
 *       type: object
 *       required: [date, items]
 *       properties:
 *         siteLocation: { type: string, example: 'WGLEZO SITE' }
 *         date:         { type: string, format: date, example: '2026-06-27' }
 *         designation:  { type: string, example: 'Storekeeper' }
 *         notes:        { type: string }
 *         items:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required: [description, quantityOrdered]
 *             properties:
 *               description:     { type: string, example: 'Diesel' }
 *               unit:            { type: string, example: 'Litres' }
 *               quantityOrdered: { type: number, example: 10 }
 *               unitPrice:       { type: number, example: 3500 }
 *               notes:           { type: string }
 *
 *     LPOItem:
 *       type: object
 *       properties:
 *         id:               { type: string, format: uuid }
 *         serialNo:         { type: integer, example: 1 }
 *         description:      { type: string, example: 'Nondo mm12' }
 *         unit:             { type: string, example: 'Tonne' }
 *         quantity:         { type: number, example: 4 }
 *         unitPrice:        { type: number, example: 1200000 }
 *         amount:           { type: number, example: 4800000 }
 *         quantityReceived: { type: number, example: 0 }
 *         requisitionItemId: { type: string, format: uuid }
 *
 *     LPO:
 *       type: object
 *       properties:
 *         id:             { type: string, format: uuid }
 *         lpoNo:          { type: string, example: 'LPO-2026-001' }
 *         projectId:      { type: string, format: uuid }
 *         requisitionId:  { type: string, format: uuid }
 *         date:           { type: string, format: date }
 *         deliveryDate:   { type: string, format: date }
 *         deliveryAddress:{ type: string }
 *         currency:       { type: string, example: 'TZS' }
 *         taxRate:        { type: number, example: 18 }
 *         subtotal:       { type: number, example: 4800000 }
 *         tax:            { type: number, example: 864000 }
 *         total:          { type: number, example: 5664000 }
 *         paymentTerms:   { type: string, example: '30 days net' }
 *         status:
 *           type: string
 *           enum: [draft, submitted, approved, sent, partial, received, invoiced, paid, cancelled]
 *         supplier:
 *           type: object
 *           properties:
 *             id: { type: string }, name: { type: string },
 *             email: { type: string }, phone: { type: string },
 *             address: { type: string }, taxNumber: { type: string }
 *         preparedBy:
 *           type: object
 *           properties:
 *             id: { type: string }, firstName: { type: string }, lastName: { type: string }
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/LPOItem' }
 *         requisition:
 *           type: object
 *           properties:
 *             id: { type: string }, requisitionNo: { type: string }, status: { type: string }
 *         createdAt: { type: string, format: date-time }
 *
 *     LPORequest:
 *       type: object
 *       required: [supplierId, date, items]
 *       properties:
 *         supplierId:      { type: string, format: uuid }
 *         requisitionId:   { type: string, format: uuid }
 *         date:            { type: string, format: date, example: '2026-06-27' }
 *         deliveryDate:    { type: string, format: date }
 *         deliveryAddress: { type: string }
 *         currency:        { type: string, example: 'TZS' }
 *         taxRate:         { type: number, example: 18 }
 *         paymentTerms:    { type: string, example: '30 days net' }
 *         notes:           { type: string }
 *         items:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required: [description, quantity, unitPrice]
 *             properties:
 *               description:       { type: string, example: 'Nondo mm12' }
 *               unit:              { type: string, example: 'Tonne' }
 *               quantity:          { type: number, example: 4 }
 *               unitPrice:         { type: number, example: 1200000 }
 *               requisitionItemId: { type: string, format: uuid }
 *               notes:             { type: string }
 */

// ══════════════════════════════════════════════════════════════
// REQUISITION NOTES
// ══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /projects/{projectId}/requisitions:
 *   get:
 *     summary: List all requisitions for a project
 *     tags: [Requisitions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, reviewed, approved, issued, rejected, cancelled]
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       200:
 *         description: Paginated list of requisitions
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Requisition' }
 *
 *   post:
 *     summary: Create a new requisition note
 *     tags: [Requisitions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RequisitionRequest' }
 *           example:
 *             siteLocation: "WGLEZO SITE"
 *             date: "2026-06-27"
 *             designation: "Storekeeper"
 *             items:
 *               - description: "Diesel"
 *                 unit: "Litres"
 *                 quantityOrdered: 10
 *               - description: "Petrol"
 *                 unit: "Litres"
 *                 quantityOrdered: 5
 *               - description: "Tofali za 8 inch"
 *                 unit: "Pcs"
 *                 quantityOrdered: 5000
 *               - description: "Saruji"
 *                 unit: "Bags"
 *                 quantityOrdered: 200
 *               - description: "Nondo mm12"
 *                 unit: "Tonne"
 *                 quantityOrdered: 4
 *     responses:
 *       201:
 *         description: Requisition created
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
 *                         requisition: { $ref: '#/components/schemas/Requisition' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

/**
 * @swagger
 * /projects/{projectId}/requisitions/{reqId}:
 *   get:
 *     summary: Get a single requisition with items and comments
 *     tags: [Requisitions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Requisition details with items and comments
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
 *                         requisition: { $ref: '#/components/schemas/Requisition' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *
 *   put:
 *     summary: Update requisition (draft or rejected only)
 *     tags: [Requisitions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RequisitionRequest' }
 *     responses:
 *       200:
 *         description: Requisition updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *
 *   delete:
 *     summary: Delete requisition (draft, rejected, cancelled only)
 *     tags: [Requisitions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Requisition deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

/**
 * @swagger
 * /projects/{projectId}/requisitions/{reqId}/submit:
 *   post:
 *     summary: Submit requisition to Procurement Officer
 *     tags: [Requisitions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment: { type: string, example: 'Kindly process urgently for site works.' }
 *     responses:
 *       200:
 *         description: Requisition submitted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */

/**
 * @swagger
 * /projects/{projectId}/requisitions/{reqId}/review:
 *   post:
 *     summary: Review requisition (Procurement Officer)
 *     tags: [Requisitions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment: { type: string, example: 'Reviewed. Forwarding for Engineer approval.' }
 *     responses:
 *       200:
 *         description: Requisition reviewed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */

/**
 * @swagger
 * /projects/{projectId}/requisitions/{reqId}/approve:
 *   post:
 *     summary: Approve requisition (Engineer/Manager)
 *     tags: [Requisitions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment: { type: string, example: 'Approved. Proceed with issuing.' }
 *     responses:
 *       200:
 *         description: Requisition approved
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */

/**
 * @swagger
 * /projects/{projectId}/requisitions/{reqId}/issue:
 *   post:
 *     summary: Issue goods from store
 *     tags: [Requisitions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment: { type: string, example: 'All items issued to site.' }
 *               issuedItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:             { type: string, format: uuid }
 *                     quantityIssued: { type: number, example: 10 }
 *     responses:
 *       200:
 *         description: Goods issued
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */

/**
 * @swagger
 * /projects/{projectId}/requisitions/{reqId}/reject:
 *   post:
 *     summary: Reject requisition with reason
 *     tags: [Requisitions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string, example: 'Budget exceeded for this category.' }
 *     responses:
 *       200:
 *         description: Requisition rejected
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */

/**
 * @swagger
 * /projects/{projectId}/requisitions/{reqId}/cancel:
 *   post:
 *     summary: Cancel requisition
 *     tags: [Requisitions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: 'No longer needed.' }
 *     responses:
 *       200:
 *         description: Requisition cancelled
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */

/**
 * @swagger
 * /projects/{projectId}/requisitions/{reqId}/comments:
 *   post:
 *     summary: Add comment to requisition
 *     tags: [Requisitions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [comment]
 *             properties:
 *               comment:    { type: string, example: 'Please expedite — site is running low.' }
 *               isInternal: { type: boolean, example: false }
 *     responses:
 *       201:
 *         description: Comment added
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
 *                         comment: { $ref: '#/components/schemas/RequisitionComment' }
 */

// ══════════════════════════════════════════════════════════════
// LOCAL PURCHASE ORDERS
// ══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /projects/{projectId}/lpos:
 *   get:
 *     summary: List all LPOs for a project
 *     tags: [LPO]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, approved, sent, partial, received, invoiced, paid, cancelled]
 *       - in: query
 *         name: supplierId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       200:
 *         description: Paginated list of LPOs
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/LPO' }
 *
 *   post:
 *     summary: Create a new LPO from scratch
 *     tags: [LPO]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LPORequest' }
 *           example:
 *             supplierId: "uuid-supplier"
 *             date: "2026-06-27"
 *             deliveryDate: "2026-07-05"
 *             deliveryAddress: "WGLEZO SITE, Zanzibar"
 *             currency: "TZS"
 *             taxRate: 18
 *             paymentTerms: "30 days net"
 *             items:
 *               - description: "Nondo mm12"
 *                 unit: "Tonne"
 *                 quantity: 4
 *                 unitPrice: 1200000
 *               - description: "Binding Wire"
 *                 unit: "Kg"
 *                 quantity: 50
 *                 unitPrice: 8000
 *     responses:
 *       201:
 *         description: LPO created
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
 *                         lpo: { $ref: '#/components/schemas/LPO' }
 */

/**
 * @swagger
 * /projects/{projectId}/lpos/from-requisition/{reqId}:
 *   post:
 *     summary: Create LPO directly from a Requisition Note
 *     description: Auto-populates LPO items from the requisition. Procurement officer adds unit prices.
 *     tags: [LPO]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Requisition Note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [supplierId]
 *             properties:
 *               supplierId:      { type: string, format: uuid }
 *               deliveryDate:    { type: string, format: date }
 *               deliveryAddress: { type: string }
 *               taxRate:         { type: number, example: 18 }
 *               paymentTerms:    { type: string, example: '30 days net' }
 *               notes:           { type: string }
 *               unitPrices:
 *                 type: object
 *                 description: Map of requisitionItemId to unit price
 *                 example:
 *                   "uuid-item-1": 3500
 *                   "uuid-item-2": 3200
 *                   "uuid-item-3": 450
 *     responses:
 *       201:
 *         description: LPO created from requisition
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
 *                         lpo: { $ref: '#/components/schemas/LPO' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

/**
 * @swagger
 * /projects/{projectId}/lpos/{lpoId}:
 *   get:
 *     summary: Get single LPO with items and comments
 *     tags: [LPO]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: lpoId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: LPO details
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
 *                         lpo: { $ref: '#/components/schemas/LPO' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *
 *   put:
 *     summary: Update LPO (draft only)
 *     tags: [LPO]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: lpoId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LPORequest' }
 *     responses:
 *       200:
 *         description: LPO updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *
 *   delete:
 *     summary: Delete LPO (draft or cancelled only)
 *     tags: [LPO]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: lpoId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: LPO deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */

/**
 * @swagger
 * /projects/{projectId}/lpos/{lpoId}/submit:
 *   post:
 *     summary: Submit LPO for approval
 *     tags: [LPO]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: lpoId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment: { type: string }
 *     responses:
 *       200:
 *         description: LPO submitted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */

/**
 * @swagger
 * /projects/{projectId}/lpos/{lpoId}/approve:
 *   post:
 *     summary: Approve LPO
 *     tags: [LPO]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: lpoId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment: { type: string, example: 'Approved. Send to supplier.' }
 *     responses:
 *       200:
 *         description: LPO approved
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */

/**
 * @swagger
 * /projects/{projectId}/lpos/{lpoId}/send:
 *   post:
 *     summary: Mark LPO as sent to supplier
 *     tags: [LPO]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: lpoId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment: { type: string, example: 'LPO sent via email to supplier.' }
 *     responses:
 *       200:
 *         description: LPO marked as sent
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */

/**
 * @swagger
 * /projects/{projectId}/lpos/{lpoId}/receive:
 *   post:
 *     summary: Record goods received (partial or full)
 *     tags: [LPO]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: lpoId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment: { type: string, example: 'Nondo zimefikia site.' }
 *               receivedItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:               { type: string, format: uuid }
 *                     quantityReceived: { type: number, example: 4 }
 *     responses:
 *       200:
 *         description: Delivery recorded
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
 *                         status: { type: string, enum: [partial, received] }
 */

/**
 * @swagger
 * /projects/{projectId}/lpos/{lpoId}/cancel:
 *   post:
 *     summary: Cancel LPO
 *     tags: [LPO]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: lpoId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: 'Found cheaper supplier.' }
 *     responses:
 *       200:
 *         description: LPO cancelled
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */

/**
 * @swagger
 * /projects/{projectId}/lpos/{lpoId}/comments:
 *   post:
 *     summary: Add comment to LPO
 *     tags: [LPO]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: lpoId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [comment]
 *             properties:
 *               comment:    { type: string, example: 'Supplier confirmed delivery for Monday.' }
 *               isInternal: { type: boolean, example: false }
 *     responses:
 *       201:
 *         description: Comment added
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */
