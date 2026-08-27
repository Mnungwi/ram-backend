const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RAM Projects API",
      version: "2.0.0",
      description: `
## RAM Projects — Construction Management System

Full REST API for managing construction projects including:
- **Authentication** with JWT (access + refresh tokens)
- **Role-Based Access Control** — 7 built-in roles, 60+ permissions, direct user overrides
- **Projects** — phases, activities, team, documents
- **Procurement** — contracts, purchase orders, suppliers
- **Finance** — budget, invoices, payments, expenses
- **Reports** — multi-type with approval workflow
- **Letter Processing** — compose, CC, approve, send, preview, PDF download
- **Store Management** — GRN (receive), MIN (issue), stock ledger

### Authentication
All protected endpoints require a **Bearer token** in the Authorization header.
Use \`POST /auth/login\` to get your token, then click **Authorize** above.

### Demo Credentials
| Email | Password | Role |
|-------|----------|------|
| admin@ram.co.tz | Admin@1234 | Super Admin |
| hassan@ram.co.tz | Demo@1234 | Site Engineer |
| fatma@ram.co.tz | Demo@1234 | Finance Officer |
| msaid@ram.co.tz | Demo@1234 | Quantity Surveyor |
      `,
      contact: {
        name: "RAM Projects",
        email: "info@ram.co.tz",
      },
      license: { name: "MIT" },
    },
    servers: [
      { url: "http://localhost:3000/api", description: "Development" },
      { url: "https://api.ram.co.tz/api", description: "Production" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT access token",
        },
      },
      schemas: {
        // ─── COMMON ───────────────────────────────────────────────
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "An error occurred" },
            errors: { type: "array", items: { type: "object" } },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "array", items: {} },
            pagination: {
              type: "object",
              properties: {
                total: { type: "integer", example: 100 },
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 20 },
                totalPages: { type: "integer", example: 5 },
              },
            },
          },
        },
        // ─── USER ─────────────────────────────────────────────────
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            firstName: { type: "string", example: "Ali" },
            lastName: { type: "string", example: "Mohamed" },
            email: {
              type: "string",
              format: "email",
              example: "admin@ram.co.tz",
            },
            phone: { type: "string", example: "+255777000000" },
            jobTitle: { type: "string", example: "Project Manager" },
            department: { type: "string", example: "Management" },
            isActive: { type: "boolean", example: true },
            lastLoginAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["firstName", "lastName", "email", "password"],
          properties: {
            firstName: { type: "string", example: "Ali", minLength: 2 },
            lastName: { type: "string", example: "Mohamed", minLength: 2 },
            email: {
              type: "string",
              format: "email",
              example: "user@ram.co.tz",
            },
            password: {
              type: "string",
              minLength: 8,
              example: "Password@1234",
            },
            phone: { type: "string", example: "+255777000001" },
            jobTitle: { type: "string", example: "Engineer" },
            department: { type: "string", example: "Construction" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "admin@ram.co.tz",
            },
            password: { type: "string", example: "Admin@1234" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Login successful" },
            data: {
              type: "object",
              properties: {
                user: { $ref: "#/components/schemas/User" },
                permissions: {
                  type: "array",
                  items: { type: "string" },
                  example: ["project:view", "project:create", "finance:view"],
                },
                accessToken: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
                refreshToken: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
              },
            },
          },
        },
        // ─── ROLE / PERMISSION ────────────────────────────────────
        Role: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Project Manager" },
            slug: { type: "string", example: "project_manager" },
            description: { type: "string" },
            isSystem: { type: "boolean", example: true },
            color: { type: "string", example: "#2563eb" },
            permissions: {
              type: "array",
              items: { $ref: "#/components/schemas/Permission" },
            },
          },
        },
        Permission: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "project:create" },
            resource: { type: "string", example: "project" },
            action: { type: "string", example: "create" },
            group: { type: "string", example: "Projects" },
            description: { type: "string" },
          },
        },
        // ─── PROJECT ──────────────────────────────────────────────
        Project: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            projectCode: { type: "string", example: "ZAE-2026-001" },
            name: { type: "string", example: "Zanzibar Airport Expansion" },
            status: {
              type: "string",
              enum: ["active", "on_hold", "completed", "cancelled"],
              example: "active",
            },
            startDate: {
              type: "string",
              format: "date",
              example: "2026-01-12",
            },
            endDate: { type: "string", format: "date", example: "2026-12-30" },
            client: { type: "string", example: "Zanzibar Government" },
            location: { type: "string", example: "Zanzibar, Tanzania" },
            totalBudget: { type: "number", example: 450000000 },
            currency: { type: "string", example: "TZS" },
            progress: { type: "number", example: 46 },
          },
        },
        ProjectRequest: {
          type: "object",
          required: ["name", "startDate", "endDate"],
          properties: {
            name: { type: "string", example: "Zanzibar Airport Expansion" },
            projectCode: { type: "string", example: "ZAE-2026-001" },
            description: { type: "string" },
            startDate: {
              type: "string",
              format: "date",
              example: "2026-01-12",
            },
            endDate: { type: "string", format: "date", example: "2026-12-30" },
            client: { type: "string", example: "Zanzibar Government" },
            location: { type: "string", example: "Zanzibar, Tanzania" },
            totalBudget: { type: "number", example: 450000000 },
            currency: { type: "string", example: "TZS" },
          },
        },
        // ─── ACTIVITY ─────────────────────────────────────────────
        Activity: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Foundation Works" },
            category: {
              type: "string",
              enum: [
                "procurement",
                "construction",
                "mep",
                "finishing",
                "site_works",
                "testing",
                "closeout",
                "other",
              ],
            },
            status: {
              type: "string",
              enum: [
                "pending",
                "in_progress",
                "completed",
                "cancelled",
                "on_hold",
              ],
            },
            progress: { type: "number", example: 60 },
            startDate: { type: "string", format: "date" },
            dueDate: { type: "string", format: "date" },
          },
        },
        ActivityRequest: {
          type: "object",
          required: ["name", "startDate", "dueDate"],
          properties: {
            name: { type: "string", example: "Foundation Works" },
            category: {
              type: "string",
              enum: [
                "procurement",
                "construction",
                "mep",
                "finishing",
                "site_works",
                "testing",
                "closeout",
                "other",
              ],
              example: "construction",
            },
            status: {
              type: "string",
              enum: [
                "pending",
                "in_progress",
                "completed",
                "cancelled",
                "on_hold",
              ],
              example: "in_progress",
            },
            progress: { type: "number", minimum: 0, maximum: 100, example: 60 },
            startDate: {
              type: "string",
              format: "date",
              example: "2026-02-21",
            },
            dueDate: { type: "string", format: "date", example: "2026-04-30" },
            responsibleId: { type: "string", format: "uuid" },
            notes: { type: "string" },
          },
        },
        // ─── FINANCE ──────────────────────────────────────────────
        Invoice: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            invoiceNo: { type: "string", example: "INV-2026-024" },
            amount: { type: "number", example: 22000000 },
            tax: { type: "number", example: 0 },
            totalAmount: { type: "number", example: 22000000 },
            currency: { type: "string", example: "TZS" },
            invoiceDate: { type: "string", format: "date" },
            dueDate: { type: "string", format: "date" },
            status: {
              type: "string",
              enum: [
                "draft",
                "pending",
                "approved",
                "paid",
                "overdue",
                "cancelled",
              ],
            },
          },
        },
        InvoiceRequest: {
          type: "object",
          required: ["invoiceNo", "amount", "invoiceDate"],
          properties: {
            invoiceNo: { type: "string", example: "INV-2026-024" },
            description: { type: "string", example: "Civil Works - Stage 3" },
            amount: { type: "number", example: 22000000 },
            tax: { type: "number", example: 0 },
            currency: { type: "string", example: "TZS" },
            invoiceDate: {
              type: "string",
              format: "date",
              example: "2026-05-20",
            },
            dueDate: { type: "string", format: "date", example: "2026-06-20" },
            contractId: { type: "string", format: "uuid" },
            supplierId: { type: "string", format: "uuid" },
          },
        },
        // ─── LETTER ───────────────────────────────────────────────
        CcRecipient: {
          type: "object",
          properties: {
            name: { type: "string", example: "Fatma Salum" },
            title: { type: "string", example: "Finance Officer" },
            email: {
              type: "string",
              format: "email",
              example: "fatma@ram.co.tz",
            },
          },
        },
        Letter: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            letterNo: { type: "string", example: "LTR-2026-0001" },
            subject: {
              type: "string",
              example: "Re: Site Inspection Schedule",
            },
            body: { type: "string" },
            letterDate: { type: "string", format: "date" },
            type: {
              type: "string",
              enum: ["incoming", "outgoing", "internal", "memo"],
            },
            priority: {
              type: "string",
              enum: ["low", "normal", "high", "urgent"],
            },
            status: {
              type: "string",
              enum: [
                "draft",
                "pending_approval",
                "approved",
                "sent",
                "received",
                "archived",
              ],
            },
            fromName: { type: "string" },
            fromTitle: { type: "string" },
            fromOrg: { type: "string" },
            toName: { type: "string" },
            toTitle: { type: "string" },
            toOrg: { type: "string" },
            toEmail: { type: "string", format: "email" },
            ccRecipients: {
              type: "array",
              items: { $ref: "#/components/schemas/CcRecipient" },
            },
            sentAt: { type: "string", format: "date-time" },
          },
        },
        LetterRequest: {
          type: "object",
          required: ["subject", "body", "letterDate", "toName"],
          properties: {
            subject: {
              type: "string",
              example: "Re: Site Inspection Schedule – June 2026",
            },
            body: {
              type: "string",
              example:
                "Dear Sir,\n\nWith reference to the above subject...\n\nYours faithfully,",
            },
            letterDate: {
              type: "string",
              format: "date",
              example: "2026-06-29",
            },
            type: {
              type: "string",
              enum: ["incoming", "outgoing", "internal", "memo"],
              default: "outgoing",
            },
            priority: {
              type: "string",
              enum: ["low", "normal", "high", "urgent"],
              default: "normal",
            },
            toName: { type: "string", example: "Hassan Juma" },
            toTitle: { type: "string", example: "Site Engineer" },
            toOrg: { type: "string", example: "RAM Projects Ltd" },
            toEmail: {
              type: "string",
              format: "email",
              example: "hassan@ram.co.tz",
            },
            fromName: { type: "string", example: "Ali Mohamed" },
            fromTitle: { type: "string", example: "Project Manager" },
            fromOrg: { type: "string", example: "RAM Projects Ltd" },
            ccRecipients: {
              type: "array",
              items: { $ref: "#/components/schemas/CcRecipient" },
              example: [
                {
                  name: "Fatma Salum",
                  title: "Finance Officer",
                  email: "fatma@ram.co.tz",
                },
                {
                  name: "Mohamed Said",
                  title: "QS",
                  email: "msaid@ram.co.tz",
                },
              ],
            },
            referenceNo: { type: "string", example: "ZAE-2026-001" },
            projectId: { type: "string", format: "uuid" },
          },
        },
        // ─── STORE ────────────────────────────────────────────────
        StoreItem: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            itemCode: { type: "string", example: "CEM-001" },
            name: { type: "string", example: "Cement (50kg bags)" },
            category: { type: "string", example: "Building Materials" },
            unit: { type: "string", example: "bags" },
            unitCost: { type: "number", example: 25000 },
            stockOnHand: { type: "number", example: 90 },
            reorderLevel: { type: "number", example: 20 },
            location: { type: "string", example: "Warehouse A – Shelf 3" },
          },
        },
        StoreItemRequest: {
          type: "object",
          required: ["itemCode", "name", "unit"],
          properties: {
            itemCode: { type: "string", example: "CEM-001" },
            name: { type: "string", example: "Cement (50kg bags)" },
            category: { type: "string", example: "Building Materials" },
            unit: { type: "string", example: "bags" },
            unitCost: { type: "number", example: 25000 },
            currency: { type: "string", example: "TZS" },
            reorderLevel: { type: "number", example: 20 },
            maxLevel: { type: "number", example: 500 },
            location: { type: "string", example: "Warehouse A – Shelf 3" },
            supplierId: { type: "string", format: "uuid" },
            notes: { type: "string" },
          },
        },
        ReceiptLine: {
          type: "object",
          required: ["storeItemId", "qtyReceived"],
          properties: {
            storeItemId: { type: "string", format: "uuid" },
            qtyOrdered: { type: "number", example: 100 },
            qtyReceived: { type: "number", example: 90 },
            qtyRejected: { type: "number", example: 0 },
            unitCost: { type: "number", example: 25000 },
            batchNo: { type: "string", example: "B2026-06" },
            expiryDate: { type: "string", format: "date" },
          },
        },
        StoreReceiptRequest: {
          type: "object",
          required: ["receivedDate", "lines"],
          properties: {
            receivedDate: {
              type: "string",
              format: "date",
              example: "2026-06-29",
            },
            supplierId: { type: "string", format: "uuid" },
            purchaseOrderId: { type: "string", format: "uuid" },
            deliveryNote: { type: "string", example: "DN-2026-055" },
            invoiceRef: { type: "string", example: "INV-2026-030" },
            notes: { type: "string" },
            lines: {
              type: "array",
              items: { $ref: "#/components/schemas/ReceiptLine" },
              minItems: 1,
            },
          },
        },
        IssueLine: {
          type: "object",
          required: ["storeItemId", "qtyRequested"],
          properties: {
            storeItemId: { type: "string", format: "uuid" },
            qtyRequested: { type: "number", example: 20 },
            unitCost: { type: "number", example: 25000 },
            notes: { type: "string" },
          },
        },
        StoreIssueRequest: {
          type: "object",
          required: ["issueDate", "lines"],
          properties: {
            issueDate: {
              type: "string",
              format: "date",
              example: "2026-06-29",
            },
            issuedToName: { type: "string", example: "Hassan Juma" },
            issuedToId: { type: "string", format: "uuid" },
            activityId: { type: "string", format: "uuid" },
            purpose: { type: "string", example: "Foundation works – Block C" },
            notes: { type: "string" },
            lines: {
              type: "array",
              items: { $ref: "#/components/schemas/IssueLine" },
              minItems: 1,
            },
          },
        },
        DispatchLine: {
          type: "object",
          required: ["issueLineId", "qtyIssued"],
          properties: {
            issueLineId: { type: "string", format: "uuid" },
            qtyIssued: { type: "number", example: 20 },
          },
        },
        ReturnLine: {
          type: "object",
          required: ["issueLineId", "qtyReturned"],
          properties: {
            issueLineId: { type: "string", format: "uuid" },
            qtyReturned: { type: "number", example: 5 },
          },
        },
      },
      parameters: {
        projectId: {
          in: "path",
          name: "projectId",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Project UUID",
        },
        letterId: {
          in: "path",
          name: "letterId",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Letter UUID",
        },
        itemId: {
          in: "path",
          name: "itemId",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Store item UUID",
        },
        issueId: {
          in: "path",
          name: "issueId",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Store issue UUID",
        },
        receiptId: {
          in: "path",
          name: "receiptId",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Store receipt UUID",
        },
        page: {
          in: "query",
          name: "page",
          schema: { type: "integer", default: 1 },
          description: "Page number",
        },
        limit: {
          in: "query",
          name: "limit",
          schema: { type: "integer", default: 20, maximum: 100 },
          description: "Items per page",
        },
        search: {
          in: "query",
          name: "search",
          schema: { type: "string" },
          description: "Search keyword",
        },
      },
      responses: {
        Unauthorized: {
          description: "Authentication required or token expired",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        Forbidden: {
          description: "Insufficient permissions",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        ValidationError: {
          description: "Validation failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Auth", description: "Login, register, token refresh, profile" },
      {
        name: "Users",
        description: "User management, role & permission assignment",
      },
      { name: "Roles", description: "Role CRUD and permission sync" },
      { name: "Permissions", description: "List all system permissions" },
      { name: "Projects", description: "Project CRUD and overview" },
      { name: "Activities", description: "Project activities / tasks" },
      {
        name: "Procurement",
        description: "Contracts, purchase orders, suppliers",
      },
      { name: "Finance", description: "Budget, invoices, payments, expenses" },
      {
        name: "Reports",
        description: "Project reports with approval workflow",
      },
      {
        name: "Documents",
        description: "File uploads and document management",
      },
      { name: "Team", description: "Project team members" },
      {
        name: "Letters",
        description:
          "Letter processing — compose, CC, approve, send, preview, PDF",
      },
      {
        name: "Store",
        description:
          "Inventory — items, GRN (receive), MIN (issue), stock ledger",
      },
      {
        name: "Clients",
        description: "Client management — CRUD for project clients",
      },
      { name: "Audit", description: "Audit log — admin only" },
      {
        name: "Stakeholder Types",
        description: "Admin-managed stakeholder categories",
      },
      {
        name: "Stakeholders",
        description: "Global directory of individuals and organizations",
      },
      {
        name: "Project Stakeholders",
        description:
          "Stakeholders linked to a project with roles and signatory flags",
      },
      { name: "Phases", description: "Project phases management" },
      {
        name: "Activity Types",
        description: "Admin-managed activity categories",
      },
      {
        name: "Requisitions",
        description:
          "Requisition Notes (RN) — workflow: draft→submitted→reviewed→approved→issued",
      },
      {
        name: "LPO",
        description:
          "Local Purchase Orders — workflow: draft→submitted→approved→sent→received→paid",
      },
      {
        name: "Products",
        description: "Product catalog — used in Requisitions and LPOs",
      },
      {
        name: "Units",
        description: "Units of measure — Litres, Kg, Tonne, Bags, Pcs...",
      },
    ],
  },
  apis: ["./src/docs/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
