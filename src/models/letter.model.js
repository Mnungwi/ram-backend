const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const STATUS_VALUES = ["Draft", "Pending Approval", "Pending Signature", "Approved", "Sent", "Archived"];

const OfficialLetter = sequelize.define(
  "OfficialLetter",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: true }, // hiari — barua zinaweza kuwa za jumla, si za project moja
    senderId: { type: DataTypes.UUID, allowNull: true },
    recipientId: { type: DataTypes.UUID, allowNull: true },

    letterNo: { type: DataTypes.STRING(50), allowNull: true, unique: 'letters_no_unique' },
    subject: { type: DataTypes.STRING(500), allowNull: false },
    subTitle: { type: DataTypes.STRING(500), allowNull: true },
    body: { type: DataTypes.TEXT("long"), allowNull: false },

    // ── SENDER ──
    senderName: { type: DataTypes.STRING(255), allowNull: true },
    senderPosition: { type: DataTypes.STRING(255), allowNull: true },
    senderOrganization: { type: DataTypes.STRING(255), allowNull: true },
    senderEmail: { type: DataTypes.STRING(255), allowNull: true },

    // ── RECIPIENT ──
    recipientName: { type: DataTypes.STRING(255), allowNull: true },
    recipientPosition: { type: DataTypes.STRING(255), allowNull: true },
    recipientOrganization: { type: DataTypes.STRING(255), allowNull: true },
    recipientEmail: { type: DataTypes.STRING(255), allowNull: true },

    // ── CC (JSON: [{ name, email }]) ──
    ccList: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },

    // ── ATTACHMENT (hiari, faili moja au zaidi) ──
    attachmentFileName: { type: DataTypes.STRING(255), allowNull: true },
    attachmentFilePath: { type: DataTypes.STRING(500), allowNull: true },
    attachments: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },

    letterDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    priority: {
      type: DataTypes.ENUM("low", "normal", "high", "urgent"),
      defaultValue: "normal"
    },
    type: {
      type: DataTypes.ENUM("incoming", "outgoing", "internal", "memo"),
      defaultValue: "outgoing"
    },
    status: { type: DataTypes.ENUM(...STATUS_VALUES), defaultValue: "Draft" },

    createdById: { type: DataTypes.UUID, allowNull: true },
    approvedById: { type: DataTypes.UUID, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    sentById: { type: DataTypes.UUID, allowNull: true },
    sentAt: { type: DataTypes.DATE, allowNull: true },

    // ── FORWARD FOR SIGNATURE (secretary drafts, boss/another user reviews & signs) ──
    forwardedToId: { type: DataTypes.UUID, allowNull: true },
    forwardedById: { type: DataTypes.UUID, allowNull: true },
    forwardedAt: { type: DataTypes.DATE, allowNull: true },

    emailMessageId: { type: DataTypes.STRING(255), allowNull: true }, // ID ya email iliyotumwa (kwa rejea)
    emailError: { type: DataTypes.TEXT, allowNull: true }, // kama kutuma kulishindikana

    // ── VIRTUALS FOR FRONTEND COMPATIBILITY ──
    fromName: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("senderName") || (this.sender ? `${this.sender.firstName} ${this.sender.lastName}` : "");
      }
    },
    fromTitle: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("senderPosition") || (this.sender ? this.sender.jobTitle : "");
      }
    },
    fromOrg: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("senderOrganization") || (this.sender ? this.sender.department : "");
      }
    },
    toName: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("recipientName") || (this.recipient ? this.recipient.name : "");
      }
    },
    toTitle: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("recipientPosition") || (this.recipient ? this.recipient.jobTitle : "");
      }
    },
    toOrg: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("recipientOrganization") || (this.recipient ? this.recipient.organization : "");
      }
    },
    toEmail: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("recipientEmail") || (this.recipient ? this.recipient.email : "");
      }
    },
    ccRecipients: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("ccList") || [];
      },
      set(val) {
        this.setDataValue("ccList", val);
      }
    }
  },
  { tableName: "official_letters" },
);

// Raw SQL migration to add 'type' column if missing in mysql
sequelize.query("ALTER TABLE official_letters ADD COLUMN type ENUM('incoming', 'outgoing', 'internal', 'memo') DEFAULT 'outgoing';")
  .then(() => console.log("✅ official_letters: type column has been migrated successfully."))
  .catch((err) => {
    if (err.parent && err.parent.errno === 1060) {
      console.log("ℹ️ official_letters: type column already exists.");
    } else {
      console.error("⚠️ official_letters type column migration failed:", err.message);
    }
  });

// Raw SQL migration to add 'letterDate' and 'priority' if missing
sequelize.query("ALTER TABLE official_letters ADD COLUMN letterDate DATE NULL;")
  .catch(() => {});
sequelize.query("ALTER TABLE official_letters ADD COLUMN priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal';")
  .catch(() => {});

// Widen status enum to include 'Pending Signature' (forward-for-signature workflow)
sequelize.query(
  "ALTER TABLE official_letters MODIFY COLUMN status ENUM('Draft','Pending Approval','Pending Signature','Approved','Sent','Archived') DEFAULT 'Draft';"
).then(() => console.log("✅ official_letters: status enum widened to include 'Pending Signature'."))
  .catch((err) => console.error("⚠️ official_letters status enum migration failed:", err.message));

// Forward-for-signature columns — collation MUST match users.id (utf8mb4_bin) or the
// belongsTo(User) foreign key Sequelize adds on sync({alter:true}) fails with errno 150.
sequelize.query("ALTER TABLE official_letters ADD COLUMN forwardedToId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL;").catch(() => {});
sequelize.query("ALTER TABLE official_letters ADD COLUMN forwardedById CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL;").catch(() => {});
sequelize.query("ALTER TABLE official_letters ADD COLUMN forwardedAt DATETIME NULL;").catch(() => {});
// One-time repair for columns already created (on servers that ran the migration
// before this collation fix) — MODIFY is a no-op if already correct.
sequelize.query("ALTER TABLE official_letters MODIFY COLUMN forwardedToId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL;").catch(() => {});
sequelize.query("ALTER TABLE official_letters MODIFY COLUMN forwardedById CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL;").catch(() => {});

// ─── LETTER COMMENT (notes left when signing / forwarding / reviewing) ─────────
const LetterComment = sequelize.define(
  "LetterComment",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    letterId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: true },
    type: {
      type: DataTypes.ENUM("note", "sign", "forward"),
      defaultValue: "note",
    },
    comment: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    tableName: "letter_comments",
    updatedAt: false,
    // Match users.id / official_letters.id (utf8mb4_bin) so the FK constraints
    // Sequelize adds on sync({alter:true}) don't fail with errno 150.
    charset: "utf8mb4",
    collate: "utf8mb4_bin",
  },
);

module.exports = { OfficialLetter, LetterComment, STATUS_VALUES };
