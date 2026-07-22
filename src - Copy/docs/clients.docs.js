/**
 * @swagger
 * tags:
 *   - name: Clients
 *     description: Client management — CRUD for project clients
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: Zanzibar Government
 *         contactPerson:
 *           type: string
 *           example: Hon. Said Ali Mbarouk
 *         email:
 *           type: string
 *           format: email
 *           example: info@zanzibargov.go.tz
 *         phone:
 *           type: string
 *           example: '+255 24 223 0000'
 *         company:
 *           type: string
 *           example: Revolutionary Government of Zanzibar
 *         address:
 *           type: string
 *           example: Mji Mkongwe, Zanzibar
 *         city:
 *           type: string
 *           example: Zanzibar City
 *         country:
 *           type: string
 *           example: Tanzania
 *         taxNumber:
 *           type: string
 *           example: TIN-0012345
 *         notes:
 *           type: string
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ClientRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Zanzibar Government
 *         contactPerson:
 *           type: string
 *           example: Hon. Said Ali Mbarouk
 *         email:
 *           type: string
 *           format: email
 *           example: info@zanzibargov.go.tz
 *         phone:
 *           type: string
 *           example: '+255 24 223 0000'
 *         company:
 *           type: string
 *           example: Revolutionary Government of Zanzibar
 *         address:
 *           type: string
 *           example: Mji Mkongwe, Zanzibar
 *         city:
 *           type: string
 *           example: Zanzibar City
 *         country:
 *           type: string
 *           example: Tanzania
 *         taxNumber:
 *           type: string
 *           example: TIN-0012345
 *         notes:
 *           type: string
 *         isActive:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /clients:
 *   get:
 *     summary: List all clients
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/search'
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Paginated list of clients
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Client'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientRequest'
 *     responses:
 *       201:
 *         description: Client created successfully
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
 *                         client:
 *                           $ref: '#/components/schemas/Client'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /clients/{clientId}:
 *   get:
 *     summary: Get a single client with linked projects
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client UUID
 *     responses:
 *       200:
 *         description: Client details including linked projects
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
 *                         client:
 *                           allOf:
 *                             - $ref: '#/components/schemas/Client'
 *                             - type: object
 *                               properties:
 *                                 projects:
 *                                   type: array
 *                                   items:
 *                                     $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     summary: Update a client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientRequest'
 *     responses:
 *       200:
 *         description: Client updated successfully
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
 *                         client:
 *                           $ref: '#/components/schemas/Client'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a client
 *     description: Cannot delete a client that has linked projects. Reassign or remove those projects first.
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client UUID
 *     responses:
 *       200:
 *         description: Client deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Client has linked projects and cannot be deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
