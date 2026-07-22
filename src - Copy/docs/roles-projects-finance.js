// ─────────────────────────────────────────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /roles:
 *   get:
 *     tags: [Roles]
 *     summary: List all roles
 *     description: Returns all active roles with their permissions. Requires `role:view`.
 *     responses:
 *       200:
 *         description: List of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     roles:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Role' }
 *   post:
 *     tags: [Roles]
 *     summary: Create a custom role
 *     description: Requires `role:create`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:          { type: string, example: 'Inspector' }
 *               description:   { type: string, example: 'Site inspection role' }
 *               color:         { type: string, example: '#16a34a' }
 *               permissionIds:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Role created
 */

/**
 * @swagger
 * /roles/{roleId}:
 *   get:
 *     tags: [Roles]
 *     summary: Get role by ID
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Role detail with permissions
 *   put:
 *     tags: [Roles]
 *     summary: Update role
 *     description: Cannot update system roles' names. Requires `role:update`.
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:          { type: string }
 *               description:   { type: string }
 *               color:         { type: string }
 *               permissionIds:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Role updated
 *   delete:
 *     tags: [Roles]
 *     summary: Delete role
 *     description: Cannot delete system roles. Requires `role:delete`.
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Role deleted
 *       403:
 *         description: Cannot delete a system role
 */

/**
 * @swagger
 * /roles/{roleId}/permissions:
 *   put:
 *     tags: [Roles]
 *     summary: Sync role permissions
 *     description: Replaces all permissions on the role. Requires `permission:assign`.
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Role permissions updated
 */

/**
 * @swagger
 * /permissions:
 *   get:
 *     tags: [Permissions]
 *     summary: List all permissions
 *     description: Returns permissions grouped by module. Requires `permission:view`.
 *     responses:
 *       200:
 *         description: All permissions with grouping
 */

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: List projects
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/search'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, on_hold, completed, cancelled]
 *     responses:
 *       200:
 *         description: Paginated projects
 *   post:
 *     tags: [Projects]
 *     summary: Create project
 *     description: Requires `project:create`. Creator is auto-added as team member.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectRequest'
 *     responses:
 *       201:
 *         description: Project created
 */

/**
 * @swagger
 * /projects/{projectId}:
 *   get:
 *     tags: [Projects]
 *     summary: Get project
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     responses:
 *       200:
 *         description: Project with phases, team, budget items
 *   put:
 *     tags: [Projects]
 *     summary: Update project
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectRequest'
 *     responses:
 *       200:
 *         description: Project updated
 *   delete:
 *     tags: [Projects]
 *     summary: Cancel project
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     responses:
 *       200:
 *         description: Project cancelled
 */

/**
 * @swagger
 * /projects/{projectId}/overview:
 *   get:
 *     tags: [Projects]
 *     summary: Project overview / dashboard
 *     description: Returns stats — total activities, completion counts, budget summary, days remaining.
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     responses:
 *       200:
 *         description: Overview stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     project: { $ref: '#/components/schemas/Project' }
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalActivities: { type: integer }
 *                         completed:       { type: integer }
 *                         inProgress:      { type: integer }
 *                         pending:         { type: integer }
 *                         totalBudget:     { type: number }
 *                         totalPaid:       { type: number }
 *                         daysRemaining:   { type: integer }
 */

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /projects/{projectId}/activities:
 *   get:
 *     tags: [Activities]
 *     summary: List project activities
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, in_progress, completed, cancelled, on_hold] }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [procurement, construction, mep, finishing, site_works, testing, closeout, other] }
 *     responses:
 *       200:
 *         description: Paginated activities
 *   post:
 *     tags: [Activities]
 *     summary: Create activity
 *     description: Requires `activity:create`.
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityRequest'
 *     responses:
 *       201:
 *         description: Activity created
 */

/**
 * @swagger
 * /projects/{projectId}/activities/{activityId}:
 *   put:
 *     tags: [Activities]
 *     summary: Update activity
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityRequest'
 *     responses:
 *       200:
 *         description: Activity updated
 *   delete:
 *     tags: [Activities]
 *     summary: Delete activity
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Activity deleted
 */

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /projects/{projectId}/finance:
 *   get:
 *     tags: [Finance]
 *     summary: Finance overview
 *     description: Returns totalBudget, totalCommitted, totalPaid, balance, overdue count, pending approval amount.
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     responses:
 *       200:
 *         description: Finance summary
 */

/**
 * @swagger
 * /projects/{projectId}/finance/budget:
 *   get:
 *     tags: [Finance]
 *     summary: Get budget breakdown
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     responses:
 *       200:
 *         description: Budget items with summary totals
 *   post:
 *     tags: [Finance]
 *     summary: Create or update a budget line
 *     description: Uses findOrCreate — updating the same category updates the existing line.
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, budget]
 *             properties:
 *               category:    { type: string, example: 'Civil Works' }
 *               budget:      { type: number, example: 180000000 }
 *               committed:   { type: number, example: 128000000 }
 *               paid:        { type: number, example: 82500000 }
 *               description: { type: string }
 *               currency:    { type: string, example: 'TZS' }
 *     responses:
 *       200:
 *         description: Budget line updated
 *       201:
 *         description: Budget line created
 */

/**
 * @swagger
 * /projects/{projectId}/finance/invoices:
 *   get:
 *     tags: [Finance]
 *     summary: List invoices
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, pending, approved, paid, overdue, cancelled] }
 *     responses:
 *       200:
 *         description: Paginated invoices
 *   post:
 *     tags: [Finance]
 *     summary: Create invoice
 *     description: Requires `invoice:create`.
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceRequest'
 *     responses:
 *       201:
 *         description: Invoice created
 */

/**
 * @swagger
 * /projects/{projectId}/finance/invoices/{invoiceId}/approve:
 *   post:
 *     tags: [Finance]
 *     summary: Approve invoice
 *     description: Requires `invoice:approve`. Status must be draft or pending.
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Invoice approved
 *       400:
 *         description: Cannot approve in current state
 */

/**
 * @swagger
 * /projects/{projectId}/finance/payments:
 *   get:
 *     tags: [Finance]
 *     summary: List payments
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       200:
 *         description: Paginated payments
 *   post:
 *     tags: [Finance]
 *     summary: Create payment
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentRef, amount, paymentDate]
 *             properties:
 *               paymentRef:    { type: string, example: 'PAY-2026-018' }
 *               amount:        { type: number, example: 25000000 }
 *               currency:      { type: string, example: 'TZS' }
 *               paymentDate:   { type: string, format: date, example: '2026-05-15' }
 *               paymentMethod: { type: string, example: 'Bank Transfer' }
 *               invoiceId:     { type: string, format: uuid }
 *               description:   { type: string }
 *     responses:
 *       201:
 *         description: Payment created
 */

/**
 * @swagger
 * /projects/{projectId}/finance/expenses:
 *   get:
 *     tags: [Finance]
 *     summary: List expenses
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       200:
 *         description: Paginated expenses
 *   post:
 *     tags: [Finance]
 *     summary: Create expense
 *     parameters:
 *       - $ref: '#/components/parameters/projectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, amount, expenseDate]
 *             properties:
 *               category:    { type: string, example: 'Civil Works' }
 *               description: { type: string }
 *               amount:      { type: number, example: 82500000 }
 *               currency:    { type: string, example: 'TZS' }
 *               expenseDate: { type: string, format: date, example: '2026-05-10' }
 *     responses:
 *       201:
 *         description: Expense created
 */
