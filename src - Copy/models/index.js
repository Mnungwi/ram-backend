const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const { StakeholderType, Stakeholder, ProjectStakeholder } = require('./stakeholder.models');
const { ActivityType } = require("./activityType.model");
const {
  Project, ProjectPhase, Activity,
  Contract, PurchaseOrder, Supplier,
  Invoice, Payment, Expense, BudgetItem,
  Report, Document, TeamMember, AuditLog,Client
} = require('./domain');
const {
  Letter, LetterRead,
  StoreItem, StoreReceipt, StoreReceiptLine,
  StoreIssue, StoreIssueLine, StockTransaction,
} = require('./domain_extra');
const {
  Requisition,
  RequisitionItem,
  RequisitionComment,
} = require("./requisition.model");
const { LocalPurchaseOrder, LPOItem, LPOComment } = require("./lpo.model");
const { Product, ProductCategory } = require("../models/product.model");
const { Unit } = require('./unit.model');

// ─── JUNCTION TABLES ──────────────────────────────────────────────────────────

const UserRole = sequelize.define('UserRole', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  roleId: { type: DataTypes.UUID, allowNull: false },
  projectId: { type: DataTypes.UUID, allowNull: true },
  assignedById: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'user_roles' });

const RolePermission = sequelize.define('RolePermission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  roleId: { type: DataTypes.UUID, allowNull: false },
  permissionId: { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'role_permissions' });

const UserPermission = sequelize.define('UserPermission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  permissionId: { type: DataTypes.UUID, allowNull: false },
  projectId: { type: DataTypes.UUID, allowNull: true },
  type: { type: DataTypes.ENUM('grant', 'deny'), defaultValue: 'grant' },
  grantedById: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'user_permissions' });

// ─── ASSOCIATIONS ─────────────────────────────────────────────────────────────

// User <-> Role
User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', as: 'roles' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', as: 'users' });
User.hasMany(UserRole, { foreignKey: 'userId', as: 'userRoles' });
UserRole.belongsTo(User, { foreignKey: 'userId' });
UserRole.belongsTo(Role, { foreignKey: 'roleId' });

// Role <-> Permission
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', as: 'roles' });

// User <-> Permission direct (many-to-many)
User.belongsToMany(Permission, { through: UserPermission, foreignKey: 'userId', as: 'directPermissions' });
Permission.belongsToMany(User, { through: UserPermission, foreignKey: 'permissionId', as: 'users' });
// Direct associations on junction table so UserPermission.findAll({ include: Permission }) works
User.hasMany(UserPermission, { foreignKey: 'userId', as: 'userPermissions' });
UserPermission.belongsTo(User, { foreignKey: 'userId' });
UserPermission.belongsTo(Permission, { foreignKey: 'permissionId', as: 'permission' });

// Project
// Project.hasMany(ProjectPhase, { foreignKey: 'projectId', as: 'phases' });
// ProjectPhase.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Client.hasMany(Project, { foreignKey: "clientId", as: "projects" });
Project.belongsTo(Client, { foreignKey: "clientId", as: "clientInfo" });
Client.belongsTo(require("./User"), {
  foreignKey: "createdById",
  as: "createdBy",
});
Project.belongsTo(User, {
  foreignKey: "projectManagerId",
  as: "projectManager",
});
User.hasMany(Project, {
  foreignKey: "projectManagerId",
  as: "managedProjects",
});
Project.hasMany(Activity, { foreignKey: 'projectId', as: 'activities' });
Activity.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
ProjectPhase.hasMany(Activity, { foreignKey: 'phaseId', as: 'activities' });
Activity.belongsTo(ProjectPhase, { foreignKey: 'phaseId', as: 'phase' });
Activity.belongsTo(User, { foreignKey: 'responsibleId', as: 'responsible' });

Project.hasMany(Contract, { foreignKey: 'projectId', as: 'contracts' });
Contract.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Project.hasMany(PurchaseOrder, { foreignKey: 'projectId', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
PurchaseOrder.belongsTo(Contract, { foreignKey: 'contractId', as: 'contract' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
PurchaseOrder.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });

Project.hasMany(Invoice, { foreignKey: 'projectId', as: 'invoices' });
Invoice.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Invoice.belongsTo(Contract, { foreignKey: 'contractId', as: 'contract' });
Invoice.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
Invoice.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });

Project.hasMany(Payment, { foreignKey: 'projectId', as: 'payments' });
Payment.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Payment.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });
Payment.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });

Project.hasMany(Expense, { foreignKey: 'projectId', as: 'expenses' });
Expense.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Project.hasMany(BudgetItem, { foreignKey: 'projectId', as: 'budgetItems' });
BudgetItem.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Project.hasMany(Report, { foreignKey: 'projectId', as: 'reports' });
Report.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Report.belongsTo(ProjectPhase, { foreignKey: 'phaseId', as: 'phase' });
Report.belongsTo(User, { foreignKey: 'submittedById', as: 'submittedBy' });
Report.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });

Project.hasMany(Document, { foreignKey: 'projectId', as: 'documents' });
Document.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Document.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });

Project.hasMany(TeamMember, { foreignKey: 'projectId', as: 'teamMembers' });
TeamMember.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
TeamMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(TeamMember, { foreignKey: 'userId', as: 'projectMemberships' });

AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// StakeholderType
StakeholderType.hasMany(Stakeholder,        { foreignKey: 'stakeholderTypeId', as: 'stakeholders' });
Stakeholder.belongsTo(StakeholderType,      { foreignKey: 'stakeholderTypeId', as: 'defaultType' });

StakeholderType.hasMany(ProjectStakeholder, { foreignKey: 'stakeholderTypeId', as: 'projectStakeholders' });
ProjectStakeholder.belongsTo(StakeholderType, { foreignKey: 'stakeholderTypeId', as: 'type' });

// Stakeholder <-> Project (through ProjectStakeholder)
Stakeholder.hasMany(ProjectStakeholder,     { foreignKey: 'stakeholderId', as: 'projectLinks' });
ProjectStakeholder.belongsTo(Stakeholder,   { foreignKey: 'stakeholderId', as: 'stakeholder' });

Project.hasMany(ProjectStakeholder,         { foreignKey: 'projectId', as: 'stakeholders' });
ProjectStakeholder.belongsTo(Project,       { foreignKey: 'projectId', as: 'project' });

// createdBy on Stakeholder
Stakeholder.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// ─── LETTER ASSOCIATIONS ──────────────────────────────────────────────────────
Project.hasMany(Letter, { foreignKey: 'projectId', as: 'letters' });
Letter.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Letter.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
Letter.belongsTo(User, { foreignKey: 'sentById', as: 'sentBy' });
Letter.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });
Letter.belongsTo(Letter, { foreignKey: 'referenceLetterId', as: 'referenceLetter' });
Letter.hasMany(LetterRead, { foreignKey: 'letterId', as: 'reads' });
LetterRead.belongsTo(Letter, { foreignKey: 'letterId' });
LetterRead.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// Requisition ↔ Project
Project.hasMany(Requisition, { foreignKey: 'projectId', as: 'requisitions' });
Requisition.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
 
// Requisition ↔ User (requestedBy, reviewedBy, approvedBy, issuedBy, rejectedBy)
Requisition.belongsTo(User, { foreignKey: 'requestedById', as: 'requestedBy' });
Requisition.belongsTo(User, { foreignKey: 'reviewedById',  as: 'reviewedBy'  });
Requisition.belongsTo(User, { foreignKey: 'approvedById',  as: 'approvedBy'  });
Requisition.belongsTo(User, { foreignKey: 'issuedById',    as: 'issuedBy'    });
Requisition.belongsTo(User, { foreignKey: 'rejectedById',  as: 'rejectedBy'  });
 
// Requisition ↔ Items
Requisition.hasMany(RequisitionItem, { foreignKey: 'requisitionId', as: 'items' });
RequisitionItem.belongsTo(Requisition, { foreignKey: 'requisitionId', as: 'requisition' });
 
// Requisition ↔ Comments
Requisition.hasMany(RequisitionComment, { foreignKey: 'requisitionId', as: 'comments' });
RequisitionComment.belongsTo(Requisition, { foreignKey: 'requisitionId', as: 'requisition' });
RequisitionComment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// LPO associations
Project.hasMany(LocalPurchaseOrder,    { foreignKey: 'projectId',   as: 'lpos' });
LocalPurchaseOrder.belongsTo(Project,  { foreignKey: 'projectId',   as: 'project' });
LocalPurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId',  as: 'supplier' });
LocalPurchaseOrder.belongsTo(User,     { foreignKey: 'preparedById', as: 'preparedBy' });
LocalPurchaseOrder.belongsTo(User,     { foreignKey: 'approvedById', as: 'approvedBy' });
LocalPurchaseOrder.belongsTo(Requisition, { foreignKey: 'requisitionId', as: 'requisition' });
LocalPurchaseOrder.hasMany(LPOItem,    { foreignKey: 'lpoId', as: 'items' });
LocalPurchaseOrder.hasMany(LPOComment, { foreignKey: 'lpoId', as: 'comments' });
LPOItem.belongsTo(LocalPurchaseOrder,  { foreignKey: 'lpoId', as: 'lpo' });
LPOComment.belongsTo(LocalPurchaseOrder, { foreignKey: 'lpoId', as: 'lpo' });
LPOComment.belongsTo(User,             { foreignKey: 'userId', as: 'user' });
 
// Requisition associations
// Project.hasMany(Requisition,           { foreignKey: 'projectId', as: 'requisitions' });
// Requisition.belongsTo(Project,         { foreignKey: 'projectId', as: 'project' });
// Requisition.belongsTo(User,            { foreignKey: 'requestedById', as: 'requestedBy' });
// Requisition.belongsTo(User,            { foreignKey: 'reviewedById',  as: 'reviewedBy'  });
// Requisition.belongsTo(User,            { foreignKey: 'approvedById',  as: 'approvedBy'  });
// Requisition.belongsTo(User,            { foreignKey: 'issuedById',    as: 'issuedBy'    });
// Requisition.belongsTo(User,            { foreignKey: 'rejectedById',  as: 'rejectedBy'  });
// Requisition.hasMany(RequisitionItem,   { foreignKey: 'requisitionId', as: 'items' });
// Requisition.hasMany(RequisitionComment,{ foreignKey: 'requisitionId', as: 'comments' });
// RequisitionItem.belongsTo(Requisition, { foreignKey: 'requisitionId', as: 'requisition' });
// RequisitionComment.belongsTo(Requisition, { foreignKey: 'requisitionId', as: 'requisition' });
// RequisitionComment.belongsTo(User,     { foreignKey: 'userId', as: 'user' });
// ─── STORE ASSOCIATIONS ───────────────────────────────────────────────────────
Project.hasMany(StoreItem, { foreignKey: 'projectId', as: 'storeItems' });
StoreItem.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
StoreItem.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
StoreItem.hasMany(StockTransaction, { foreignKey: 'storeItemId', as: 'transactions' });
StockTransaction.belongsTo(StoreItem, { foreignKey: 'storeItemId', as: 'item' });
StockTransaction.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

Project.hasMany(StoreReceipt, { foreignKey: 'projectId', as: 'storeReceipts' });
StoreReceipt.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
StoreReceipt.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId', as: 'purchaseOrder' });
StoreReceipt.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
StoreReceipt.belongsTo(User, { foreignKey: 'receivedById', as: 'receivedBy' });
StoreReceipt.belongsTo(User, { foreignKey: 'verifiedById', as: 'verifiedBy' });
StoreReceipt.hasMany(StoreReceiptLine, { foreignKey: 'receiptId', as: 'lines' });
StoreReceiptLine.belongsTo(StoreReceipt, { foreignKey: 'receiptId', as: 'receipt' });
StoreReceiptLine.belongsTo(StoreItem, { foreignKey: 'storeItemId', as: 'item' });

Project.hasMany(StoreIssue, { foreignKey: 'projectId', as: 'storeIssues' });
StoreIssue.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
StoreIssue.belongsTo(User, { foreignKey: 'issuedToId', as: 'issuedTo' });
StoreIssue.belongsTo(User, { foreignKey: 'requestedById', as: 'requestedBy' });
StoreIssue.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });
StoreIssue.belongsTo(User, { foreignKey: 'issuedById', as: 'issuedBy' });
StoreIssue.belongsTo(Activity, { foreignKey: 'activityId', as: 'activity' });
StoreIssue.hasMany(StoreIssueLine, { foreignKey: 'issueId', as: 'lines' });
StoreIssueLine.belongsTo(StoreIssue, { foreignKey: 'issueId', as: 'issue' });
StoreIssueLine.belongsTo(StoreItem, { foreignKey: 'storeItemId', as: 'item' });


ProductCategory.hasMany(Product, { foreignKey: "categoryId", as: "products" });
Product.belongsTo(ProductCategory, {
  foreignKey: "categoryId",
  as: "category",
});
Product.belongsTo(Unit, { foreignKey: "unitId", as: "uom" });
Unit.hasMany(Product, { foreignKey: "unitId", as: "unitProducts" });

module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  UserPermission,
  Project,
  ProjectPhase,
  Activity,
  Contract,
  PurchaseOrder,
  Supplier,
  Invoice,
  Payment,
  Expense,
  BudgetItem,
  Report,
  Document,
  TeamMember,
  AuditLog,
  Letter,
  LetterRead,
  StoreItem,
  StoreReceipt,
  StoreReceiptLine,
  StoreIssue,
  StoreIssueLine,
  StockTransaction,
  Client,
  StakeholderType,
  Stakeholder,
  ProjectStakeholder,
  ActivityType,
  Requisition,
  RequisitionItem,
  RequisitionComment,
  LocalPurchaseOrder,
  LPOItem,
  LPOComment,
  Unit,
  Product,
  ProductCategory,
};
