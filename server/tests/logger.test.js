const { redact } = require('../utils/logger');

test('redact скрывает пароли, токены и cookie на любой глубине', () => {
  const out = redact({
    email: 'a@b.c',
    password: 'Secret123!',
    nested: { accessToken: 'eyJ', headers: { Authorization: 'Bearer x', cookie: 'refreshToken=1' } },
    list: [{ refreshTokenHash: 'abc' }],
  });
  expect(out.email).toBe('a@b.c');
  expect(out.password).toBe('[REDACTED]');
  expect(out.nested.accessToken).toBe('[REDACTED]');
  expect(out.nested.headers.Authorization).toBe('[REDACTED]');
  expect(out.nested.headers.cookie).toBe('[REDACTED]');
  expect(out.list[0].refreshTokenHash).toBe('[REDACTED]');
});
