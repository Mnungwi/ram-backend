const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// ─── PAYMENT ───────────────────────────────────────────────────────────────
const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: { type: DataTypes.UUID, allowNull: false },
    activityId: { type: DataTypes.UUID, allowNull: true }, // kiungo na activity husika
    invoiceNo: { type: DataTypes.STRING(50), allowNull: true },
    description: { type: DataTypes.STRING(500), allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: {
      type: DataTypes.ENUM("pending", "approved", "paid", "rejected"),
      defaultValue: "pending",
    },
    createdById: { type: DataTypes.UUID, allowNull: true },
    approvedById: { type: DataTypes.UUID, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "payments" },
);

// ── Associations ──────────────────────────────────────────
// Rekebisha path za models hizi kulingana na project yako
try {
  const { Activity } = require("./activity.model");
  Payment.belongsTo(Activity, { foreignKey: "activityId", as: "activity" });
  Activity.hasMany(Payment, { foreignKey: "activityId", as: "payments" });
} catch (e) {
  // Activity model haipo bado kwenye path hii — rekebisha require() hapo juu
}

try {
  const { User } = require("./index");
  Payment.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });
  Payment.belongsTo(User, { foreignKey: "approvedById", as: "approvedBy" });
} catch (e) {
  // User model haipo kwenye path hii — rekebisha require() hapo juu
}

module.exports = { Payment };
