const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Избранное: связь «пользователь — материал», одна запись на пару
const Favorite = sequelize.define('Favorite', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  materialId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
}, {
  tableName: 'favorites',
  updatedAt: false,
});

module.exports = Favorite;
