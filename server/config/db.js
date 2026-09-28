const { Sequelize } = require('sequelize');
const { databaseUrl } = require('./env');

// Sequelize формирует параметризованные запросы, что защищает от SQL-инъекций
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
});

module.exports = sequelize;
