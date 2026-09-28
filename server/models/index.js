const sequelize = require('../config/db');
const User = require('./user.model');
const Material = require('./material.model');
const AuditLog = require('./auditLog.model');

// Материал принадлежит пользователю, который его загрузил
User.hasMany(Material, { foreignKey: { name: 'ownerId', allowNull: false }, as: 'materials', onDelete: 'CASCADE' });
Material.belongsTo(User, { foreignKey: { name: 'ownerId', allowNull: false }, as: 'owner' });

module.exports = { sequelize, User, Material, AuditLog };
