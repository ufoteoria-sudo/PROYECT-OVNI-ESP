const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    trim: true,
    validate: {
      len: [3, 50],
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    trim: true,
  },
  lastName: {
    type: DataTypes.STRING,
    trim: true,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
  },
  subscription: {
    type: DataTypes.JSONB,
    defaultValue: {
      status: 'free',
      plan: 'free',
    },
  },
  profile: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
  },
}, {
  timestamps: true,
  underscored: false,
});

module.exports = User;
