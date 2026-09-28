const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Журнал действий администраторов и модераторов
const AuditLog = sequelize.define('AuditLog', {
  actorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  actorEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  actorRole: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  targetType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'audit_logs',
  updatedAt: false,
});

module.exports = AuditLog;
