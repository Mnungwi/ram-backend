# Farida Projects — Backend API

Node.js · Express · Sequelize · MySQL · JWT · Role-Based Access Control

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DB credentials and secrets

# 3. Create MySQL database
mysql -u root -p -e "CREATE DATABASE farida_projects CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. Seed roles, permissions, and demo users
npm run seed

# 5. Start development server
npm run dev
```

Server runs at **http://localhost:3000**

---

## Architecture

```
src/
├── config/
│   ├── database.js         Sequelize connection
│   └── permissions.js      All permission constants + role defaults
├── models/
│   ├── User.js             User model (bcrypt hooks, toJSON scrubbing)
│   ├── Role.js             Role model
│   ├── Permission.js       Permission model
│   ├── domain.js           Project, Activity, Finance, Report, Document…
│   └── index.js            All associations + junction tables
├── middleware/
│   ├── auth.js             authenticate · authorize · authorizeAny · requireAdmin
│   └── errorHandler.js     Global error handler · validate · notFound
├── controllers/
│   ├── authController.js   register · login · refresh · logout · profile
│   ├── userController.js   CRUD · assignRoles · setDirectPermissions
│   ├── roleController.js   Role CRUD · Permission listing · sync
│   ├── projectController.js Project CRUD + overview
│   └── financeController.js Budget · Invoices · Payments · Expenses
├── routes/
│   └── index.js            All routes with permission guards
├── utils/
│   ├── jwt.js              Token generation/verification
│   ├── response.js         Standardised response helpers
│   ├── permissionResolver.js  Resolve effective permissions for a user
│   └── audit.js            Write to audit_logs table
└── seeders/
    └── index.js            Seed permissions, roles, users
```

---

## RBAC System

### How It Works

```
User → UserRole(s) → Role → RolePermission(s) → Permission
              ↘ UserPermission (direct grant/deny overrides)
```

1. **Roles** have a set of **Permissions**
2. **Users** are assigned one or more **Roles** (globally or per-project)
3. **Users** can also have **direct permission overrides** (grant or deny)
4. Deny overrides always win over role grants

### Built-in Roles

| Role | Description |
|------|-------------|
| `super_admin` | All permissions — system role |
| `admin` | All modules, user management |
| `project_manager` | Full project control, no system admin |
| `site_engineer` | Field activities, reports, documents |
| `quantity_surveyor` | Procurement, contracts, budget |
| `finance_officer` | Finance, invoices, payments |
| `viewer` | Read-only access |

### Scope: Global vs Project

- A `UserRole` with `projectId = null` → **global** (applies everywhere)
- A `UserRole` with `projectId = <uuid>` → **project-scoped** (applies only in that project)
- Same for `UserPermission` direct overrides

---

## API Reference

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | firstName, lastName, email, password | Register new user |
| POST | `/api/auth/login` | email, password | Login → tokens |
| POST | `/api/auth/refresh` | refreshToken | Rotate tokens |
| POST | `/api/auth/logout` | — | Invalidate refresh token |
| GET  | `/api/auth/me` | — | Get own profile + permissions |
| PUT  | `/api/auth/me` | firstName, phone, … | Update own profile |
| POST | `/api/auth/me/change-password` | currentPassword, newPassword | — |

### Login Response

```json
{
  "success": true,
  "data": {
    "user":        { "id": "...", "firstName": "Ali", "roles": [...] },
    "permissions": ["project:view", "project:create", "finance:view", ...],
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### Users (requires `user:*` permissions)

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET    | `/api/users` | `user:view` |
| POST   | `/api/users` | `user:create` |
| GET    | `/api/users/:id` | `user:view` |
| PUT    | `/api/users/:id` | `user:update` |
| DELETE | `/api/users/:id` | `user:delete` |
| POST   | `/api/users/:id/roles` | `user:assign_role` |
| POST   | `/api/users/:id/permissions` | `permission:assign` |
| GET    | `/api/users/:id/permissions` | `user:view` |

#### Assign Roles to User

```json
POST /api/users/:userId/roles
{
  "roleIds": ["uuid1", "uuid2"],
  "projectId": null
}
```

#### Set Direct Permission Overrides

```json
POST /api/users/:userId/permissions
{
  "projectId": null,
  "permissions": [
    { "permissionId": "uuid-of-permission", "type": "grant" },
    { "permissionId": "uuid-of-permission", "type": "deny" }
  ]
}
```

### Roles

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET    | `/api/roles` | `role:view` |
| POST   | `/api/roles` | `role:create` |
| GET    | `/api/roles/:id` | `role:view` |
| PUT    | `/api/roles/:id` | `role:update` |
| DELETE | `/api/roles/:id` | `role:delete` |
| PUT    | `/api/roles/:id/permissions` | `permission:assign` |

### Projects

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET    | `/api/projects` | `project:view` |
| POST   | `/api/projects` | `project:create` |
| GET    | `/api/projects/:id` | `project:view` |
| GET    | `/api/projects/:id/overview` | `project:view` |
| PUT    | `/api/projects/:id` | `project:update` |
| DELETE | `/api/projects/:id` | `project:delete` |

### Nested Resources (all under `/api/projects/:projectId/`)

| Resource | Endpoint suffix | Permissions |
|----------|----------------|-------------|
| Activities | `activities` | `activity:view/create/update/delete` |
| Contracts | `contracts` | `contract:view/create/update` |
| Purchase Orders | `purchase-orders` | `purchase_order:view/create` |
| Finance Overview | `finance` | `finance:view` |
| Budget | `finance/budget` | `budget:view/update` |
| Invoices | `finance/invoices` | `invoice:view/create/approve` |
| Payments | `finance/payments` | `payment:view/create/approve` |
| Expenses | `finance/expenses` | `expense:view/create` |
| Reports | `reports` | `report:view/create/update/approve` |
| Documents | `documents` | `document:view/create/download` |
| Team | `team` | `team:view/create/delete` |

### Audit Logs (admin only)

```
GET /api/audit?userId=&resource=&projectId=
```

---

## Pagination

All list endpoints support:
```
?page=1&limit=20&search=keyword
```

Response:
```json
{
  "data": [...],
  "pagination": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
}
```

---

## Standard Response Format

```json
{ "success": true,  "message": "...", "data": { ... } }
{ "success": false, "message": "...", "errors": [...] }
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_NAME` | Database name | `farida_projects` |
| `DB_USER` | DB username | `root` |
| `DB_PASSWORD` | DB password | — |
| `JWT_SECRET` | Access token secret | — |
| `JWT_EXPIRES_IN` | Access token TTL | `7d` |
| `JWT_REFRESH_SECRET` | Refresh token secret | — |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `30d` |
| `UPLOAD_PATH` | File upload directory | `uploads` |
| `MAX_FILE_SIZE` | Max upload bytes | `10485760` |

---

## Demo Credentials

After running `npm run seed`:

| User | Email | Password | Role |
|------|-------|----------|------|
| Ali Mohamed | admin@farida.co.tz | Admin@1234 | Super Admin |
| Hassan Juma | hassan@farida.co.tz | Demo@1234 | Site Engineer |
| Salim Ali | salim@farida.co.tz | Demo@1234 | Site Engineer |
| Fatma Salum | fatma@farida.co.tz | Demo@1234 | Finance Officer |
| Mohamed Said | msaid@farida.co.tz | Demo@1234 | Quantity Surveyor |
