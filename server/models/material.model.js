const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MATERIAL_TYPES = ['lecture', 'presentation', 'book'];

const Material = sequelize.define('Material', {
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { notEmpty: true },
  },
  type: {
    type: DataTypes.ENUM(...MATERIAL_TYPES),
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
  },
  fileUrl: {
    type: DataTypes.STRING(2048),
    allowNull: false,
    validate: { isUrl: true },
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
  },
}, {
  tableName: 'materials',
});

Material.TYPES = MATERIAL_TYPES;

module.exports = Material;
