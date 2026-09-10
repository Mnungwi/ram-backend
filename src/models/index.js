const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const { StakeholderType, Stakeholder, ProjectStakeholder } = require('./stakeholder.models');
const { ActivityType } = require("./activityType.model");
const {
  Project, ProjectPhase, Activity,
  Supplier, BudgetItem,
  Report, TeamMember, AuditLog, Client
} = require('./domain');
const { OfficialLetter, LetterComment } = require('./letter.model');
const { CentralStoreItem, ProjectStoreItem, StoreTransaction } = require('./store.model');
const {
  Requisition,
  RequisitionItem,
  RequisitionComment,
} = require("./requisition.model");
const { LocalPurchaseOrder, LPOItem, LPOComment } = require("./lpo.model");
const { Product, ProductCategory } = require("../models/product.model");
const { Unit } = require('./unit.model');
const { Document, DocumentVersion } = require("./document.model");
const { Media } = require("./media.model");
const { ProjectGallery } = require("./gallery.model");
const { Technician, TechnicianCategory, TechnicianReceipt, ProjectTechnician } = require("./technician.model");
const { ProjectStorekeeper } = require("./storekeeper.model");
const { Subcontractor, SubcontractorDocument } = require("./subcontractor.model");
const { SafetyRecord, SafetyDocument } = require("./safety.model");
const { Notification } = require("./notification.model");
const { Budget, Payment, Invoice, InvoicePayment, Expense, ExpenseCategory, FundingSource, SiteFundDisbursement } = require('./finance.model');
const { Inquiry } = require("./inquiry.model");
const { JobApplication } = require("./jobApplication.model");

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
Project.hasMany(ProjectPhase, { foreignKey: 'projectId', as: 'phases' });
ProjectPhase.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

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




Project.hasMany(BudgetItem, { foreignKey: 'projectId', as: 'budgetItems' });
BudgetItem.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Project.hasMany(Report, { foreignKey: 'projectId', as: 'reports' });
Report.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Report.belongsTo(ProjectPhase, { foreignKey: 'phaseId', as: 'phase' });
Report.belongsTo(User, { foreignKey: 'submittedById', as: 'submittedByUser' });
Report.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });

// Project.hasMany(Document, { foreignKey: 'projectId', as: 'documents' });
// Document.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
// Document.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });

Project.hasMany(TeamMember, { foreignKey: 'projectId', as: 'teamMembers' });
TeamMember.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
TeamMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(TeamMember, { foreignKey: 'userId', as: 'projectMemberships' });

AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
AuditLog.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// StakeholderType
StakeholderType.hasMany(Stakeholder, { foreignKey: 'stakeholderTypeId', as: 'stakeholders' });
Stakeholder.belongsTo(StakeholderType, { foreignKey: 'stakeholderTypeId', as: 'defaultType' });

StakeholderType.hasMany(ProjectStakeholder, { foreignKey: 'stakeholderTypeId', as: 'projectStakeholders' });
ProjectStakeholder.belongsTo(StakeholderType, { foreignKey: 'stakeholderTypeId', as: 'type' });

// Stakeholder <-> Project (through ProjectStakeholder)
Stakeholder.hasMany(ProjectStakeholder, { foreignKey: 'stakeholderId', as: 'projectLinks' });
ProjectStakeholder.belongsTo(Stakeholder, { foreignKey: 'stakeholderId', as: 'stakeholder' });

Project.hasMany(ProjectStakeholder, { foreignKey: 'projectId', as: 'stakeholders' });
ProjectStakeholder.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// createdBy on Stakeholder
Stakeholder.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// ─── LETTER ASSOCIATIONS ──────────────────────────────────────────────────────
Project.hasMany(OfficialLetter, { foreignKey: 'projectId', as: 'officialLetters' });
OfficialLetter.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
OfficialLetter.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
OfficialLetter.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });
OfficialLetter.belongsTo(User, { foreignKey: 'sentById', as: 'sentBy' });
OfficialLetter.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
OfficialLetter.belongsTo(Stakeholder, { foreignKey: 'recipientId', as: 'recipient' });
OfficialLetter.belongsTo(User, { foreignKey: 'forwardedToId', as: 'forwardedTo' });
OfficialLetter.belongsTo(User, { foreignKey: 'forwardedById', as: 'forwardedBy' });
OfficialLetter.hasMany(LetterComment, { foreignKey: 'letterId', as: 'comments' });
LetterComment.belongsTo(OfficialLetter, { foreignKey: 'letterId', as: 'letter' });
LetterComment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// Requisition ↔ Project
Project.hasMany(Requisition, { foreignKey: 'projectId', as: 'requisitions' });
Requisition.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Requisition ↔ User (requestedBy, reviewedBy, approvedBy, issuedBy, rejectedBy)
Requisition.belongsTo(User, { foreignKey: 'requestedById', as: 'requestedBy' });
Requisition.belongsTo(User, { foreignKey: 'reviewedById', as: 'reviewedBy' });
Requisition.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });
Requisition.belongsTo(User, { foreignKey: 'issuedById', as: 'issuedBy' });
Requisition.belongsTo(User, { foreignKey: 'rejectedById', as: 'rejectedBy' });

// Requisition ↔ Items
Requisition.hasMany(RequisitionItem, { foreignKey: 'requisitionId', as: 'items' });
RequisitionItem.belongsTo(Requisition, { foreignKey: 'requisitionId', as: 'requisition' });

// Requisition ↔ Comments
Requisition.hasMany(RequisitionComment, { foreignKey: 'requisitionId', as: 'comments' });
RequisitionComment.belongsTo(Requisition, { foreignKey: 'requisitionId', as: 'requisition' });
RequisitionComment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// LPO associations
Project.hasMany(LocalPurchaseOrder, { foreignKey: 'projectId', as: 'lpos' });
LocalPurchaseOrder.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
LocalPurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
LocalPurchaseOrder.belongsTo(User, { foreignKey: 'preparedById', as: 'preparedBy' });
LocalPurchaseOrder.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });
LocalPurchaseOrder.belongsTo(Requisition, { foreignKey: 'requisitionId', as: 'requisition' });
LocalPurchaseOrder.belongsTo(Activity, { foreignKey: "activityId", as: "activity" });
LocalPurchaseOrder.hasMany(LPOItem, { foreignKey: 'lpoId', as: 'items' });
LocalPurchaseOrder.hasMany(LPOComment, { foreignKey: 'lpoId', as: 'comments' });
LPOItem.belongsTo(LocalPurchaseOrder, { foreignKey: 'lpoId', as: 'lpo' });
LPOComment.belongsTo(LocalPurchaseOrder, { foreignKey: 'lpoId', as: 'lpo' });
LPOComment.belongsTo(User, { foreignKey: 'userId', as: 'user' });


// ─── STORE ASSOCIATIONS ───────────────────────────────────────────────────────
Project.hasMany(ProjectStoreItem, { foreignKey: 'projectId', as: 'projectStoreItems' });
ProjectStoreItem.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
CentralStoreItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
ProjectStoreItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
StoreTransaction.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
StoreTransaction.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
StoreTransaction.belongsTo(User, { foreignKey: 'performedById', as: 'performedBy' });


ProductCategory.hasMany(Product, { foreignKey: "categoryId", as: "products" });
Product.belongsTo(ProductCategory, {
  foreignKey: "categoryId",
  as: "category",
});
Product.belongsTo(Unit, { foreignKey: "unitId", as: "uom" });
Unit.hasMany(Product, { foreignKey: "unitId", as: "unitProducts" });

// ─── DOCUMENT & DOCUMENT VERSION ASSOCIATIONS ──────────────────────────────
Document.belongsTo(Project, { foreignKey: "projectId", as: "project" });
Project.hasMany(Document, { foreignKey: "projectId", as: "documents" });

Document.hasMany(DocumentVersion, { foreignKey: "documentId", as: "versionHistory" });
DocumentVersion.belongsTo(Document, { foreignKey: "documentId", as: "document" });

Document.belongsTo(User, { foreignKey: "uploadedById", as: "uploadedBy" });
DocumentVersion.belongsTo(User, { foreignKey: "uploadedById", as: "uploadedBy" });

// ─── MEDIA LIBRARY & PROJECT GALLERY ASSOCIATIONS ──────────────────────────
Media.belongsTo(User, { foreignKey: "createdById", as: "uploadedBy" });
User.hasMany(Media, { foreignKey: "createdById", as: "mediaItems" });

Project.belongsToMany(Media, { through: ProjectGallery, foreignKey: "projectId", as: "galleryMedia" });
Media.belongsToMany(Project, { through: ProjectGallery, foreignKey: "mediaId", as: "projects" });

Project.hasMany(ProjectGallery, { foreignKey: "projectId", as: "galleryItems" });
ProjectGallery.belongsTo(Project, { foreignKey: "projectId", as: "project" });

Media.hasMany(ProjectGallery, { foreignKey: "mediaId", as: "galleryLinks" });
ProjectGallery.belongsTo(Media, { foreignKey: "mediaId", as: "media" });

// ─── TECHNICIAN & RECEIPT ASSOCIATIONS ──────────────────────────────────────
TechnicianReceipt.belongsTo(User, { foreignKey: "issuedById", as: "issuedBy" });
TechnicianReceipt.belongsTo(Project, { foreignKey: "projectId", as: "project" });
ProjectTechnician.belongsTo(Project, { foreignKey: "projectId", as: "project" });

// ─── PROJECT STOREKEEPER ASSOCIATIONS ───────────────────────────────────────
Project.hasMany(ProjectStorekeeper, { foreignKey: "projectId", as: "storekeepers" });
ProjectStorekeeper.belongsTo(Project, { foreignKey: "projectId", as: "project" });
ProjectStorekeeper.belongsTo(User, { foreignKey: "userId", as: "user" });
ProjectStorekeeper.belongsTo(User, { foreignKey: "assignedById", as: "assignedBy" });
User.hasMany(ProjectStorekeeper, { foreignKey: "userId", as: "storekeeperAssignments" });

// ─── FINANCE ASSOCIATIONS ───────────────────────────────────────────────────
Payment.belongsTo(Activity, { foreignKey: "activityId", as: "activity" });
Invoice.belongsTo(Activity, { foreignKey: "activityId", as: "activity" });
Budget.belongsTo(Activity, { foreignKey: "activityId", as: "activity" });
Expense.belongsTo(Activity, { foreignKey: "activityId", as: "activity" });
Payment.belongsTo(Technician, { foreignKey: "paidToId", as: "paidTo" });
Invoice.belongsTo(Supplier, { foreignKey: "supplierId", as: "supplier" });
Invoice.belongsTo(LocalPurchaseOrder, { foreignKey: "lpoId", as: "lpo" });
LocalPurchaseOrder.hasMany(Invoice, { foreignKey: "lpoId", as: "invoices" });
Payment.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });
Payment.belongsTo(User, { foreignKey: "approvedById", as: "approvedBy" });
Payment.belongsTo(User, { foreignKey: "signedById", as: "signedBy" });
Invoice.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });
Invoice.belongsTo(User, { foreignKey: "approvedById", as: "approvedBy" });
Expense.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });

// ─── SITE FUND DISBURSEMENT ASSOCIATIONS ────────────────────────────────────
Project.hasMany(SiteFundDisbursement, { foreignKey: "projectId", as: "siteFundDisbursements" });
SiteFundDisbursement.belongsTo(Project, { foreignKey: "projectId", as: "project" });
SiteFundDisbursement.belongsTo(User, { foreignKey: "storekeeperUserId", as: "storekeeper" });
SiteFundDisbursement.belongsTo(User, { foreignKey: "disbursedById", as: "disbursedBy" });

// ─── SUBCONTRACTOR ASSOCIATIONS ─────────────────────────────────────────────
Project.hasMany(Subcontractor, { foreignKey: "projectId", as: "subcontractors" });
Subcontractor.belongsTo(Project, { foreignKey: "projectId", as: "project" });
Subcontractor.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });
SubcontractorDocument.belongsTo(User, { foreignKey: "uploadedById", as: "uploadedBy" });

// ─── SAFETY ASSOCIATIONS ────────────────────────────────────────────────────
Project.hasMany(SafetyRecord, { foreignKey: "projectId", as: "safetyRecords" });
SafetyRecord.belongsTo(Project, { foreignKey: "projectId", as: "project" });
SafetyRecord.belongsTo(User, { foreignKey: "reportedById", as: "reportedBy" });
SafetyRecord.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });
Project.hasMany(SafetyDocument, { foreignKey: "projectId", as: "safetyDocuments" });
SafetyDocument.belongsTo(Project, { foreignKey: "projectId", as: "project" });
SafetyDocument.belongsTo(User, { foreignKey: "uploadedById", as: "uploadedBy" });

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });
Notification.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });

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
  Supplier,
  BudgetItem,
  Report,
  TeamMember,
  AuditLog,
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
  Document,
  DocumentVersion,
  Media,
  ProjectGallery,
  Technician,
  TechnicianCategory,
  TechnicianReceipt,
  ProjectTechnician,
  ProjectStorekeeper,
  Budget,
  Payment,
  Invoice,
  InvoicePayment,
  Expense,
  ExpenseCategory,
  FundingSource,
  SiteFundDisbursement,
  Inquiry,
  JobApplication,
  Subcontractor,
  SubcontractorDocument,
  SafetyRecord,
  SafetyDocument,
  Notification,
};
