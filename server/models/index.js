const sequelize = require('../config/db');
const User = require('./user.model');
const Material = require('./material.model');
const AuditLog = require('./auditLog.model');
const Favorite = require('./favorite.model');

// Материал принадлежит пользователю, который его загрузил
User.hasMany(Material, { foreignKey: { name: 'ownerId', allowNull: false }, as: 'materials', onDelete: 'CASCADE' });
Material.belongsTo(User, { foreignKey: { name: 'ownerId', allowNull: false }, as: 'owner' });

// Избранное — связь многие-ко-многим; записи удаляются вместе с пользователем или материалом
User.belongsToMany(Material, { through: Favorite, foreignKey: 'userId', otherKey: 'materialId', as: 'favorites', onDelete: 'CASCADE' });
Material.belongsToMany(User, { through: Favorite, foreignKey: 'materialId', otherKey: 'userId', as: 'favoritedBy', onDelete: 'CASCADE' });
Favorite.belongsTo(Material, { foreignKey: 'materialId', as: 'material', onDelete: 'CASCADE' });

module.exports = { sequelize, User, Material, AuditLog, Favorite };
