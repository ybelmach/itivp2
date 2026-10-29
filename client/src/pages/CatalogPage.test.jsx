import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { renderWithProviders } from '../test/utils';
import CatalogPage from './CatalogPage';
import { materialsApi } from '../api/endpoints';

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal()),
  refreshSession: vi.fn(() => Promise.reject(new Error('no session'))),
}));

vi.mock('../api/endpoints', () => ({
  materialsApi: { list: vi.fn(), stats: vi.fn(), get: vi.fn() },
  favoritesApi: { list: vi.fn() },
  authApi: {},
}));

const material = {
  id: 1, title: 'Лекция 1. Node.js', type: 'lecture', subject: 'ИТиВП', author: 'Петров', description: '', tags: ['node'], createdAt: '2026-10-01T00:00:00Z', ownerId: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  materialsApi.stats.mockResolvedValue({ total: 1, byType: { lecture: 1, presentation: 0, book: 0 } });
});

test('показывает список материалов', async () => {
  materialsApi.list.mockResolvedValue({ data: [material], total: 1, page: 1, pages: 1 });
  renderWithProviders(<CatalogPage />);
  expect(await screen.findByText('Лекция 1. Node.js')).toBeInTheDocument();
  expect(screen.getByText('Найдено: 1')).toBeInTheDocument();
});

test('пустой результат и ошибка загрузки', async () => {
  materialsApi.list.mockResolvedValueOnce({ data: [], total: 0, page: 1, pages: 0 });
  const { unmount } = renderWithProviders(<CatalogPage />);
  expect(await screen.findByText('Материалов пока нет')).toBeInTheDocument();
  unmount();

  materialsApi.list.mockRejectedValueOnce(Object.assign(new Error('x'), { response: { status: 500, data: { error: { message: 'Внутренняя ошибка сервера' } } } }));
  renderWithProviders(<CatalogPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Внутренняя ошибка сервера');
});

test('поиск отправляет один запрос после паузы (debounce)', async () => {
  materialsApi.list.mockResolvedValue({ data: [material], total: 1, page: 1, pages: 1 });
  renderWithProviders(<CatalogPage />);
  await screen.findByText('Лекция 1. Node.js');
  const callsBefore = materialsApi.list.mock.calls.length;

  await userEvent.type(screen.getByLabelText('Поиск'), 'node');
  await waitFor(() => expect(materialsApi.list.mock.calls.length).toBe(callsBefore + 1), { timeout: 1500 });
  expect(materialsApi.list.mock.calls.at(-1)[0]).toMatchObject({ search: 'node', page: 1 });
});
