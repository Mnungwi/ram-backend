/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product catalog management
 *   - name: Units
 *     description: Units of measure management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     Unit:
 *       type: object
 *       properties:
 *         id:           { type: string, format: uuid }
 *         name:         { type: string, example: 'Litres' }
 *         abbreviation: { type: string, example: 'L' }
 *         category:
 *           type: string
 *           enum: [volume, weight, length, area, count, time, other]
 *           example: volume
 *         description:  { type: string }
 *         isActive:     { type: boolean }
 *         createdAt:    { type: string, format: date-time }
 *
 *     UnitRequest:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:         { type: string, example: 'Litres' }
 *         abbreviation: { type: string, example: 'L' }
 *         category:
 *           type: string
 *           enum: [volume, weight, length, area, count, time, other]
 *         description:  { type: string }
 *
 *     ProductCategory:
 *       type: object
 *       properties:
 *         id:          { type: string, format: uuid }
 *         name:        { type: string, example: 'Steel & Metal' }
 *         description: { type: string }
 *         isActive:    { type: boolean }
 *
 *     Product:
 *       type: object
 *       properties:
 *         id:          { type: string, format: uuid }
 *         code:        { type: string, example: 'PRD-008' }
 *         name:        { type: string, example: 'Nondo mm12' }
 *         description: { type: string }
 *         unitId:      { type: string, format: uuid }
 *         unitPrice:   { type: number, example: 1200000 }
 *         isActive:    { type: boolean }
 *         category:
 *           type: object
 *           properties:
 *             id:   { type: string, format: uuid }
 *             name: { type: string, example: 'Steel & Metal' }
 *         uom:
 *           type: object
 *           properties:
 *             id:           { type: string, format: uuid }
 *             name:         { type: string, example: 'Tonne' }
 *             abbreviation: { type: string, example: 'T' }
 *         createdAt: { type: string, format: date-time }
 *
 *     ProductRequest:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:        { type: string, example: 'Nondo mm12' }
 *         code:        { type: string, example: 'PRD-008' }
 *         description: { type: string }
 *         categoryId:  { type: string, format: uuid }
 *         unitId:      { type: string, format: uuid }
 *         unitPrice:   { type: number, example: 1200000 }
 */

// ══════════════════════════════════════════════════════════════
// UNITS
// ══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /units:
 *   get:
 *     summary: List all units of measure
 *     tags: [Units]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or abbreviation
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [volume, weight, length, area, count, time, other]
 *     responses:
 *       200:
 *         description: List of units
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
 *                         units:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Unit' }
 *             example:
 *               success: true
 *               data:
 *                 units:
 *                   - { id: "uuid", name: "Litres", abbreviation: "L", category: "volume" }
 *                   - { id: "uuid", name: "Kilograms", abbreviation: "Kg", category: "weight" }
 *                   - { id: "uuid", name: "Tonnes", abbreviation: "T", category: "weight" }
 *                   - { id: "uuid", name: "Bags", abbreviation: "Bags", category: "weight" }
 *                   - { id: "uuid", name: "Pieces", abbreviation: "Pcs", category: "count" }
 *
 *   post:
 *     summary: Create a new unit
 *     tags: [Units]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UnitRequest' }
 *           example:
 *             name: "Cubic Metres"
 *             abbreviation: "m³"
 *             category: "volume"
 *             description: "Used for concrete and bulk materials"
 *     responses:
 *       201:
 *         description: Unit created
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
 *                         unit: { $ref: '#/components/schemas/Unit' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */

/**
 * @swagger
 * /units/{unitId}:
 *   get:
 *     summary: Get a single unit
 *     tags: [Units]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Unit details
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
 *                         unit: { $ref: '#/components/schemas/Unit' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *
 *   put:
 *     summary: Update a unit
 *     tags: [Units]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UnitRequest' }
 *     responses:
 *       200:
 *         description: Unit updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *
 *   delete:
 *     summary: Deactivate a unit
 *     tags: [Units]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Unit deactivated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */

// ══════════════════════════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List products (paginated)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or code
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       200:
 *         description: Paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Product' }
 *
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductRequest' }
 *           example:
 *             name: "Nondo mm12"
 *             code: "PRD-010"
 *             categoryId: "uuid-steel-category"
 *             unitId: "uuid-tonne-unit"
 *             unitPrice: 1200000
 *             description: "Steel reinforcement bar 12mm diameter"
 *     responses:
 *       201:
 *         description: Product created
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
 *                         product: { $ref: '#/components/schemas/Product' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */

/**
 * @swagger
 * /products/all:
 *   get:
 *     summary: List all products without pagination (for dropdowns)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: All active products
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
 *                         products:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Product' }
 *             example:
 *               success: true
 *               data:
 *                 products:
 *                   - id: "uuid"
 *                     code: "PRD-001"
 *                     name: "Diesel"
 *                     unitPrice: 3500
 *                     uom: { name: "Litres", abbreviation: "L" }
 *                     category: { name: "Fuel" }
 *                   - id: "uuid"
 *                     code: "PRD-010"
 *                     name: "Nondo mm12"
 *                     unitPrice: 1200000
 *                     uom: { name: "Tonne", abbreviation: "T" }
 *                     category: { name: "Steel & Metal" }
 */

/**
 * @swagger
 * /products/categories:
 *   get:
 *     summary: List all product categories
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of categories
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
 *                         categories:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/ProductCategory' }
 *
 *   post:
 *     summary: Create a product category
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:        { type: string, example: 'Electrical' }
 *               description: { type: string, example: 'Cables, switches, panels' }
 *     responses:
 *       201:
 *         description: Category created
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
 *                         category: { $ref: '#/components/schemas/ProductCategory' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */

/**
 * @swagger
 * /products/{productId}:
 *   get:
 *     summary: Get a single product
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Product details
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
 *                         product: { $ref: '#/components/schemas/Product' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductRequest' }
 *     responses:
 *       200:
 *         description: Product updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *
 *   delete:
 *     summary: Deactivate a product (soft delete)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Product deactivated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
