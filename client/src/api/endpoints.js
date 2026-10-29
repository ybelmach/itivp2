import { api } from './client';

const data = (res) => res.data;

export const authApi = {
  login: (body) => api.post('/auth/login', body).then((r) => r.data.data),
  register: (body) => api.post('/auth/register', body).then((r) => r.data.data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me').then((r) => r.data.data),
};

// Пустые параметры не отправляем, чтобы ключи кэша и URL были короче
const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));

export const materialsApi = {
  list: (params, signal) => api.get('/materials', { params: clean(params), signal }).then(data),
  stats: () => api.get('/materials/stats').then((r) => r.data.data),
  get: (id, signal) => api.get(`/materials/${id}`, { signal }).then((r) => r.data.data),
  create: (body) => api.post('/materials', body).then((r) => r.data.data),
  update: (id, body) => api.put(`/materials/${id}`, body).then((r) => r.data.data),
  remove: (id) => api.delete(`/materials/${id}`),
};

export const favoritesApi = {
  list: () => api.get('/favorites').then(data),
  add: (id) => api.put(`/materials/${id}/favorite`),
  remove: (id) => api.delete(`/materials/${id}/favorite`),
};

export const usersApi = {
  list: () => api.get('/users').then(data),
  changeRole: (id, role) => api.patch(`/users/${id}/role`, { role }).then((r) => r.data.data),
  remove: (id) => api.delete(`/users/${id}`),
  auditLog: () => api.get('/admin/audit-log').then(data),
};

export const monitoringApi = {
  health: () => api.get('/health', { validateStatus: () => true }).then((r) => ({ httpStatus: r.status, ...r.data })),
  metrics: () => api.get('/metrics').then((r) => r.data.data),
  backendTestError: () => api.get('/debug/error'),
};
