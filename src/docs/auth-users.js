/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a new user account. The new user is automatically assigned the **viewer** role.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     description: |
 *       Authenticates a user and returns JWT tokens plus the full list of resolved permissions.
 *
 *       **Demo credentials:**
 *       - `admin@ram.co.tz` / `Admin@1234` (Super Admin)
 *       - `hassan@ram.co.tz` / `Demo@1234` (Site Engineer)
 *       - `fatma@ram.co.tz` / `Demo@1234` (Finance Officer)
 *       - `msaid@ram.co.tz` / `Demo@1234` (Quantity Surveyor)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             admin:
 *               summary: Super Admin
 *               value: { email: 'admin@ram.co.tz', password: 'Admin@1234' }
 *             engineer:
 *               summary: Site Engineer
 *               value: { email: 'hassan@ram.co.tz', password: 'Demo@1234' }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: New token pair issued
 *       401:
 *         description: Invalid or expired refresh token
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout
 *     description: Invalidates the refresh token server-side.
 *     responses:
 *       200:
 *         description: Logged out successfully
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get my profile
 *     description: Returns current user's profile, roles, and full resolved permission list.
 *     responses:
 *       200:
 *         description: Profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *                     permissions:
 *                       type: array
 *                       items: { type: string }
 *   put:
 *     tags: [Auth]
 *     summary: Update my profile
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName:  { type: string }
 *               phone:     { type: string }
 *               jobTitle:  { type: string }
 *               department:{ type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 */

/**
 * @swagger
 * /auth/me/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, example: Admin@1234 }
 *               newPassword:     { type: string, example: NewPass@5678, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Current password incorrect
 */

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List users
 *     description: Requires `user:view` permission.
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/search'
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Paginated user list
 *   post:
 *     tags: [Users]
 *     summary: Create user
 *     description: Requires `user:create` permission.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/RegisterRequest'
 *               - type: object
 *                 properties:
 *                   roleIds:
 *                     type: array
 *                     items: { type: string, format: uuid }
 *                     description: Role UUIDs to assign
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: Email already exists
 */

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User with roles and permissions
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Users]
 *     summary: Update user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName:  { type: string }
 *               phone:     { type: string }
 *               jobTitle:  { type: string }
 *               isActive:  { type: boolean }
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     tags: [Users]
 *     summary: Deactivate user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User deactivated
 */

/**
 * @swagger
 * /users/{userId}/roles:
 *   post:
 *     tags: [Users]
 *     summary: Assign roles to user
 *     description: |
 *       Replaces all roles for the given scope (global or project-scoped).
 *       Requires `user:assign_role` permission.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleIds]
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *                 example: ['uuid-of-project-manager-role']
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: null = global, UUID = project-scoped
 *     responses:
 *       200:
 *         description: Roles assigned
 */

/**
 * @swagger
 * /users/{userId}/permissions:
 *   post:
 *     tags: [Users]
 *     summary: Set direct permission overrides
 *     description: |
 *       Grants or denies specific permissions directly on a user,
 *       overriding role-based permissions. Requires `permission:assign`.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     permissionId: { type: string, format: uuid }
 *                     type:
 *                       type: string
 *                       enum: [grant, deny]
 *                       description: grant = allow, deny = block even if role grants it
 *           example:
 *             projectId: null
 *             permissions:
 *               - permissionId: 'uuid-of-letter:approve'
 *                 type: grant
 *               - permissionId: 'uuid-of-finance:delete'
 *                 type: deny
 *     responses:
 *       200:
 *         description: Permissions updated
 *
 *   get:
 *     tags: [Users]
 *     summary: Get user's effective permissions
 *     description: Returns the fully resolved permission set (role perms + grants − denies).
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: projectId
 *         schema: { type: string, format: uuid }
 *         description: Scope to a specific project
 *     responses:
 *       200:
 *         description: Resolved permissions array
 */
