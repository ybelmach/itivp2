const Joi = require('joi');

const email = Joi.string().trim().lowercase().email().max(254).required().messages({
  'string.email': 'некорректный email',
  'any.required': 'обязательное поле',
});

const registerSchema = Joi.object({
  email,
  password: Joi.string().min(8).max(72).required().messages({
    'string.min': 'пароль должен быть не короче 8 символов',
    'string.max': 'пароль должен быть не длиннее 72 символов',
    'any.required': 'обязательное поле',
  }),
});

const loginSchema = Joi.object({
  email,
  password: Joi.string().max(72).required(),
});

module.exports = { registerSchema, loginSchema };
