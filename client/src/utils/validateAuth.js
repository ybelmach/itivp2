const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Те же требования к паролю, что и на сервере
const PASSWORD_RULES = [
  [/.{8,}/, 'не короче 8 символов'],
  [/[a-zа-яё]/, 'строчная буква'],
  [/[A-ZА-ЯЁ]/, 'заглавная буква'],
  [/\d/, 'цифра'],
  [/[^\p{L}\d]/u, 'спецсимвол'],
];

export function validateAuth({ email, password }, mode) {
  const errors = {};
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Введите корректный email';
  if (!password) errors.password = 'Введите пароль';
  else if (mode === 'register') {
    const missing = PASSWORD_RULES.filter(([re]) => !re.test(password)).map(([, label]) => label);
    if (missing.length) errors.password = `Пароль: ${missing.join(', ')}`;
  }
  return errors;
}
