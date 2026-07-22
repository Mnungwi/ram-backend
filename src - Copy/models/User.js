const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 100] },
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 100] },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { len: [8, 255] },
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  jobTitle: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  passwordChangedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  passwordResetToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
        user.passwordChangedAt = new Date();
      }
    },
  },
  defaultScope: {
    attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken', 'passwordResetExpires'] },
  },
  scopes: {
    withPassword: { attributes: {} },
    withTokens:   { attributes: {} },
  },
});

User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.refreshToken;
  delete values.passwordResetToken;
  delete values.passwordResetExpires;
  return values;
};

module.exports = User;
