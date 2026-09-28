const Joi = require('joi');

const email = Joi.string().trim().lowercase().email().max(254).required().messages({
  'string.email': 'некорректный email',
  'any.required': 'обязательное поле',
});

// Сложность пароля: 8–72 символа (72 — предел bcrypt), строчная и заглавная буквы, цифра, спецсимвол
const password = Joi.string().min(8).max(72)
  .pattern(/[a-zа-яё]/, 'lowercase')
  .pattern(/[A-ZА-ЯЁ]/, 'uppercase')
  .pattern(/\d/, 'digit')
  .pattern(/[^A-Za-zА-Яа-яЁё0-9]/, 'special')
  .required()
  .messages({
    'string.min': 'пароль должен быть не короче 8 символов',
    'string.max': 'пароль должен быть не длиннее 72 символов',
    'string.pattern.name': 'пароль должен содержать строчную и заглавную буквы, цифру и спецсимвол (не хватает: {#name})',
    'any.required': 'обязательное поле',
  });

const registerSchema = Joi.object({ email, password });

const loginSchema = Joi.object({
  email,
  password: Joi.string().max(72).required(),
});

module.exports = { registerSchema, loginSchema };
