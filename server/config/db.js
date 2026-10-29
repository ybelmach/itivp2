const { Sequelize } = require('sequelize');
const { databaseUrl, databaseSsl } = require('./env');

// Sequelize формирует параметризованные запросы, что защищает от SQL-инъекций
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: databaseSsl ? { ssl: { require: true, rejectUnauthorized: true } } : {},
  pool: { max: 5, idle: 10000 },
});

module.exports = sequelize;
