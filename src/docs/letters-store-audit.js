// ─────────────────────────────────────────────────────────────────────────────
// LETTERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /letters/inbox:
 *   get:
 *     tags: [Letters]
 *     summary: My inbox
 *     description: Returns letters addressed to the currently logged-in user (by name or email).
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       200:
 *         description: Letters addressed to me
 */

/**
 * @swagger
 * /letters:
 *   get:
 *     tags: [Letters]
 *     summary: List all letters
 *     description: Requires `letter:view`.
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/search'
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [incoming, outgoing, internal, memo] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, pending_approval, approved, sent, received, archived] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, normal, high, urgent] }
 *     responses:
 *       200:
 *         description: Paginated letters
 *   post:
 *     tags: [Letters]
 *     summary: Compose a new letter
 *     description: |
 *       Creates a letter in **draft** status.
 *       `fromName`, `fromTitle`, `fromOrg` are auto-filled from the current user if not provided.
 *       A unique letter number (`LTR-YYYY-NNNN`) is auto-generated.
 *       Requires `letter:create`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LetterRequest'
 *           example:
 *             subject: "Re: Site Inspection Schedule – June 2026"
 *             body: "Dear Sir,\n\nWith reference to the above subject, we confirm the inspection will proceed on 30 June 2026.\n\nYours faithfully,"
 *             letterDate: "2026-06-29"
 *             type: outgoing
 *             priority: high
 *             toName: "Hassan Juma"
 *             toTitle: "Site Engineer"
 *             toOrg: "RAM Projects Ltd"
 *             toEmail: "hassan@ram.co.tz"
 *             ccRecipients:
 *               - name: "Fatma Salum"
 *                 title: "Finance Officer"
 *                 email: "fatma@ram.co.tz"
 *               - name: "Mohamed Said"
 *                 title: "QS"
 *                 email: "msaid@ram.co.tz"
 *             referenceNo: "ZAE-2026-001"
 *     responses:
 *       201:
 *         description: Letter created (draft)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     letter: { $ref: '#/components/schemas/Letter' }
 */

/**
 * @swagger
 * /letters/{letterId}:
 *   get:
 *     tags: [Letters]
 *     summary: Get letter by ID
 *     description: Automatically marks the letter as read for the current user.
 *     parameters:
 *       - $ref: '#/components/parameters/letterId'
 *     responses:
 *       200:
 *         description: Letter detail with CC recipients and read receipts
 *   put:
 *     tags: [Letters]
 *     summary: Update letter
 *     description: Only allowed when status is **draft** or **pending_approval**. Requires `letter:update`.
 *     parameters:
 *       - $ref: '#/components/parameters/letterId'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LetterRequest'
 *     responses:
 *       200:
 *         description: Letter updated
 *       400:
 *         description: Cannot edit a sent or archived letter
 *   delete:
 *     tags: [Letters]
 *     summary: Delete letter
 *     description: Only allowed for **draft** letters. Requires `letter:delete`.
 *     parameters:
 *       - $ref: '#/components/parameters/letterId'
 *     responses:
 *       200:
 *         description: Letter deleted
 *       400:
 *         description: Cannot delete a sent letter
 */

/**
 * @swagger
 * /letters/{letterId}/submit:
 *   post:
 *     tags: [Letters]
 *     summary: Submit for approval
 *     description: |
 *       Status transition: `draft` → `pending_approval`.
 *       Requires `letter:send`.
 *     parameters:
 *       - $ref: '#/components/parameters/letterId'
 *     responses:
 *       200:
 *         description: Letter submitted
 *       400:
 *         description: Only draft letters can be submitted
 */

/**
 * @swagger
 * /letters/{letterId}/approve:
 *   post:
 *     tags: [Letters]
 *     summary: Approve letter
 *     description: |
 *       Status transition: `pending_approval` → `approved`.
 *       Requires `letter:approve`.
 *     parameters:
 *       - $ref: '#/components/parameters/letterId'
 *     responses:
 *       200:
 *         description: Letter approved
 *       400:
 *         description: Letter is not pending approval
 */

/**
 * @swagger
 * /letters/{letterId}/send:
 *   post:
 *     tags: [Letters]
 *     summary: Send letter
 *     description: |
 *       Marks the letter as **sent** and records the sender.
 *       CC list can be updated at send time.
 *       Status transition: `draft` or `approved` → `sent`.
 *       Requires `letter:send`.
 *     parameters:
 *       - $ref: '#/components/parameters/letterId'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               toEmail:
 *                 type: string
 *                 format: email
 *                 description: Override or confirm recipient email
 *               ccRecipients:
 *                 type: array
 *                 items: { $ref: '#/components/schemas/CcRecipient' }
 *                 description: Update CC list at send time
 *     responses:
 *       200:
 *         description: Letter sent
 */

/**
 * @swagger
 * /letters/{letterId}/archive:
 *   post:
 *     tags: [Letters]
 *     summary: Archive letter
 *     description: Moves letter to archived status. Requires `letter:update`.
 *     parameters:
 *       - $ref: '#/components/parameters/letterId'
 *     responses:
 *       200:
 *         description: Letter archived
 */

/**
 * @swagger
 * /letters/{letterId}/preview:
 *   get:
 *     tags: [Letters]
 *     summary: Preview letter as HTML
 *     description: |
 *       Returns a **full HTML letterhead** ready for browser rendering.
 *       Includes organization header, To/CC block, priority badge, letter body, signature block.
 *       Open this URL directly in your browser (use Postman "Send and Download" or a browser extension).
 *       Requires `letter:view`.
 *     parameters:
 *       - $ref: '#/components/parameters/letterId'
 *     responses:
 *       200:
 *         description: HTML letterhead
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */

/**
 * @swagger
 * /letters/{letterId}/download:
 *   get:
 *     tags: [Letters]
 *     summary: Download letter as PDF
 *     description: |
 *       Downloads the letter as a **PDF file** (if puppeteer is installed via `npm install puppeteer`).
 *       Without puppeteer, returns print-ready HTML that auto-triggers `window.print()`.
 *
 *       In Postman: click **Send and Download** to save the file.
 *       Requires `letter:download`.
 *     parameters:
 *       - $ref: '#/components/parameters/letterId'
 *     responses:
 *       200:
 *         description: PDF file or print-ready HTML
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           text/html:
 *             schema:
 *               type: string
 */

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /store/overview:
 *   get:
 *     tags: [Store]
 *     summary: Store dashboard / overview
 *     description: |
 *       Returns total items, total stock value, this month's receipt and issue counts,
 *       and a list of items at or below their reorder level.
 *       Requires `store:view`.
 *     responses:
 *       200:
 *         description: Store overview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalItems:         { type: integer, example: 42 }
 *                     totalValue:         { type: number,  example: 18500000 }
 *                     receiptsThisMonth:  { type: integer, example: 8 }
 *                     issuesThisMonth:    { type: integer, example: 15 }
 *                     lowStockItems:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/StoreItem' }
 */

/**
 * @swagger
 * /store:
 *   get:
 *     tags: [Store]
 *     summary: List store items
 *     description: Requires `store:view`.
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/search'
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: belowReorder
 *         schema: { type: boolean }
 *         description: Filter items at or below reorder level
 *     responses:
 *       200:
 *         description: Paginated store items
 *   post:
 *     tags: [Store]
 *     summary: Create store item
 *     description: Requires `store:create`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoreItemRequest'
 *     responses:
 *       201:
 *         description: Item created
 */

/**
 * @swagger
 * /store/items/{itemId}:
 *   get:
 *     tags: [Store]
 *     summary: Get store item
 *     description: Returns item detail plus last 20 stock transactions.
 *     parameters:
 *       - $ref: '#/components/parameters/itemId'
 *     responses:
 *       200:
 *         description: Item with transaction ledger
 *   put:
 *     tags: [Store]
 *     summary: Update store item
 *     description: Requires `store:update`.
 *     parameters:
 *       - $ref: '#/components/parameters/itemId'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoreItemRequest'
 *     responses:
 *       200:
 *         description: Item updated
 *   delete:
 *     tags: [Store]
 *     summary: Deactivate store item
 *     description: Soft-delete (sets isActive = false). Requires `store:delete`.
 *     parameters:
 *       - $ref: '#/components/parameters/itemId'
 *     responses:
 *       200:
 *         description: Item deactivated
 */

/**
 * @swagger
 * /store/items/{itemId}/adjust:
 *   post:
 *     tags: [Store]
 *     summary: Manual stock adjustment
 *     description: |
 *       Adjusts stock by a positive (correction) or negative (write-off/damage) quantity.
 *       Posts an **adjustment** transaction to the immutable stock ledger.
 *       Requires `store:adjust`.
 *     parameters:
 *       - $ref: '#/components/parameters/itemId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [qty]
 *             properties:
 *               qty:    { type: number, example: -5, description: 'Positive = add, Negative = remove' }
 *               reason: { type: string, example: 'Damaged – broken bags' }
 *     responses:
 *       200:
 *         description: Stock adjusted
 *       400:
 *         description: Qty cannot be zero
 */

/**
 * @swagger
 * /store/items/{itemId}/ledger:
 *   get:
 *     tags: [Store]
 *     summary: Stock transaction ledger
 *     description: Full immutable history of all stock movements for this item.
 *     parameters:
 *       - $ref: '#/components/parameters/itemId'
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       200:
 *         description: Transaction history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:            { type: string, format: uuid }
 *                       type:          { type: string, enum: [receipt, issue, return, adjustment, transfer] }
 *                       qty:           { type: number, description: '+ve = in, -ve = out' }
 *                       balanceAfter:  { type: number }
 *                       unitCost:      { type: number }
 *                       referenceType: { type: string }
 *                       notes:         { type: string }
 *                       createdAt:     { type: string, format: date-time }
 */

/**
 * @swagger
 * /store/receipts:
 *   get:
 *     tags: [Store]
 *     summary: List Goods Received Notes (GRN)
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, received, partial, rejected] }
 *     responses:
 *       200:
 *         description: Paginated GRNs
 *   post:
 *     tags: [Store]
 *     summary: Create GRN — receive items into stock
 *     description: |
 *       Creates a Goods Received Note and **immediately posts all lines to the stock ledger**
 *       in a single atomic database transaction. Stock on hand increases by `qtyReceived - qtyRejected`.
 *       Auto-generates a receipt number: `GRN-YYYY-NNNN`.
 *       Requires `store:receive`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoreReceiptRequest'
 *           example:
 *             receivedDate: "2026-06-29"
 *             deliveryNote: "DN-2026-055"
 *             notes: "Partial delivery from ZanBuild Ltd"
 *             lines:
 *               - storeItemId: "uuid-of-cement-item"
 *                 qtyOrdered: 100
 *                 qtyReceived: 90
 *                 qtyRejected: 0
 *                 unitCost: 25000
 *                 batchNo: "B2026-06"
 *     responses:
 *       201:
 *         description: GRN created, stock updated
 *       400:
 *         description: At least one line item required
 */

/**
 * @swagger
 * /store/receipts/{receiptId}:
 *   get:
 *     tags: [Store]
 *     summary: Get GRN detail
 *     parameters:
 *       - $ref: '#/components/parameters/receiptId'
 *     responses:
 *       200:
 *         description: GRN with all lines
 */

/**
 * @swagger
 * /store/issues:
 *   get:
 *     tags: [Store]
 *     summary: List Material Issue Notes (MIN)
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, pending_approval, approved, issued, returned] }
 *     responses:
 *       200:
 *         description: Paginated MINs
 *   post:
 *     tags: [Store]
 *     summary: Create MIN — request items from store
 *     description: |
 *       Creates a Material Issue Note in **draft** status.
 *       Stock is NOT yet deducted — that happens at the **dispatch** step.
 *       Auto-generates issue number: `MIN-YYYY-NNNN`.
 *       Requires `store:issue`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoreIssueRequest'
 *           example:
 *             issueDate: "2026-06-29"
 *             issuedToName: "Hassan Juma"
 *             purpose: "Foundation works – Block C"
 *             lines:
 *               - storeItemId: "uuid-of-cement-item"
 *                 qtyRequested: 20
 *                 unitCost: 25000
 *     responses:
 *       201:
 *         description: MIN created
 */

/**
 * @swagger
 * /store/issues/{issueId}:
 *   get:
 *     tags: [Store]
 *     summary: Get MIN detail
 *     parameters:
 *       - $ref: '#/components/parameters/issueId'
 *     responses:
 *       200:
 *         description: Issue with all lines, approver, activity
 */

/**
 * @swagger
 * /store/issues/{issueId}/approve:
 *   post:
 *     tags: [Store]
 *     summary: Approve MIN
 *     description: |
 *       Status transition: `draft`/`pending_approval` → `approved`.
 *       Requires `store:issue`.
 *     parameters:
 *       - $ref: '#/components/parameters/issueId'
 *     responses:
 *       200:
 *         description: Issue approved
 */

/**
 * @swagger
 * /store/issues/{issueId}/dispatch:
 *   post:
 *     tags: [Store]
 *     summary: Dispatch items — deducts from stock
 *     description: |
 *       Physically issues items from the store. For each line, stock is **reduced atomically**
 *       in a database transaction. Insufficient stock raises an error.
 *       Status transition: `approved` → `issued`.
 *       Requires `store:issue`.
 *     parameters:
 *       - $ref: '#/components/parameters/issueId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lines]
 *             properties:
 *               lines:
 *                 type: array
 *                 items: { $ref: '#/components/schemas/DispatchLine' }
 *           example:
 *             lines:
 *               - issueLineId: "uuid-of-issue-line"
 *                 qtyIssued: 20
 *     responses:
 *       200:
 *         description: Items dispatched, stock reduced
 *       400:
 *         description: Insufficient stock
 */

/**
 * @swagger
 * /store/issues/{issueId}/return:
 *   post:
 *     tags: [Store]
 *     summary: Return unused items to store
 *     description: |
 *       Returns items back to stock. Posts a **return** transaction.
 *       Status transition: `issued` → `returned`.
 *       Requires `store:issue`.
 *     parameters:
 *       - $ref: '#/components/parameters/issueId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lines]
 *             properties:
 *               lines:
 *                 type: array
 *                 items: { $ref: '#/components/schemas/ReturnLine' }
 *           example:
 *             lines:
 *               - issueLineId: "uuid-of-issue-line"
 *                 qtyReturned: 5
 *     responses:
 *       200:
 *         description: Items returned to store
 *       400:
 *         description: Only issued items can be returned
 */

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /audit:
 *   get:
 *     tags: [Audit]
 *     summary: Audit log
 *     description: Returns all system audit entries. Admin-only (requires super_admin or admin role).
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: uuid }
 *         description: Filter by user
 *       - in: query
 *         name: resource
 *         schema: { type: string }
 *         description: Filter by resource type (e.g. letter, store, project)
 *       - in: query
 *         name: projectId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Paginated audit entries
 *       403:
 *         description: Admin access required
 */
