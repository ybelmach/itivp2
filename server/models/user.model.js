const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ROLES = ['user', 'admin'];

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM(...ROLES),
    allowNull: false,
    defaultValue: 'user',
  },
}, {
  tableName: 'users',
  defaultScope: {
    // Хеш пароля никогда не попадает в ответы API
    attributes: { exclude: ['passwordHash'] },
  },
  scopes: {
    withPassword: { attributes: { include: ['passwordHash'] } },
  },
});

User.ROLES = ROLES;

module.exports = User;
