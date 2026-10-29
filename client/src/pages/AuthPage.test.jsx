import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { renderWithProviders } from '../test/utils';
import AuthPage from './AuthPage';
import { validateAuth } from '../utils/validateAuth';

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal()),
  refreshSession: vi.fn(() => Promise.reject(new Error('no session'))),
}));

beforeEach(() => vi.clearAllMocks());

test('validateAuth проверяет сложность пароля при регистрации', () => {
  expect(validateAuth({ email: 'a@b.co', password: 'password' }, 'register').password).toMatch(/заглавная/);
  expect(validateAuth({ email: 'a@b.co', password: 'Password1!' }, 'register')).toEqual({});
  expect(validateAuth({ email: 'bad', password: 'x' }, 'login').email).toBeTruthy();
});

test('форма входа показывает ошибки и не отправляет пустые поля', async () => {
  renderWithProviders(<AuthPage mode="login" />, { route: '/login' });
  await userEvent.click(await screen.findByRole('button', { name: 'Войти' }));
  expect(screen.getByText('Введите корректный email')).toBeInTheDocument();
  expect(screen.getByText('Введите пароль')).toBeInTheDocument();
});
