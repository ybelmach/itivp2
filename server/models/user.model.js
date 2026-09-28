const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Роли по возрастанию прав
const ROLES = ['user', 'moderator', 'admin'];

// Служебные поля, которые никогда не попадают в ответы API
const SECRET_FIELDS = ['passwordHash', 'refreshTokenHash', 'refreshTokenExpiresAt', 'failedLoginAttempts', 'lockUntil'];

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
  // Ограничение попыток входа: счётчик неудач подряд и время окончания блокировки
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Refresh-токен хранится только в виде SHA-256 хеша
  refreshTokenHash: {
    type: DataTypes.STRING(64),
    allowNull: true,
    unique: true,
  },
  refreshTokenExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  defaultScope: {
    attributes: { exclude: SECRET_FIELDS },
  },
  scopes: {
    withSecrets: { attributes: { include: SECRET_FIELDS } },
  },
});

User.ROLES = ROLES;

// Есть ли у роли права не ниже требуемой
User.hasRoleAtLeast = (role, required) => ROLES.indexOf(role) >= ROLES.indexOf(required);

module.exports = User;
