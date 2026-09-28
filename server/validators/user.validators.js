const Joi = require('joi');
const User = require('../models/user.model');

const changeRoleSchema = Joi.object({
  role: Joi.string().valid(...User.ROLES).required(),
});

module.exports = { changeRoleSchema };
