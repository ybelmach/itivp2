/* eslint-disable react-refresh/only-export-components -- файл описывает маршруты, а не компонент */
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import CatalogPage from './pages/CatalogPage';

// Code splitting: каждая страница, кроме каталога, — отдельный чанк, который грузится при переходе
const MaterialPage = lazy(() => import('./pages/MaterialPage'));
const MaterialFormPage = lazy(() => import('./pages/MaterialFormPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const StatusPage = lazy(() => import('./pages/StatusPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export const routes = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <CatalogPage /> },
      { path: '/materials/new', element: <RequireAuth><MaterialFormPage /></RequireAuth> },
      { path: '/materials/:id', element: <MaterialPage /> },
      { path: '/materials/:id/edit', element: <RequireAuth><MaterialFormPage /></RequireAuth> },
      { path: '/login', element: <AuthPage mode="login" key="login" /> },
      { path: '/register', element: <AuthPage mode="register" key="register" /> },
      { path: '/favorites', element: <RequireAuth><FavoritesPage /></RequireAuth> },
      { path: '/my', element: <RequireAuth><CatalogPage mine key="mine" /></RequireAuth> },
      { path: '/admin/users', element: <RequireAuth role="moderator"><AdminUsersPage /></RequireAuth> },
      { path: '/admin/audit', element: <RequireAuth role="admin"><AuditLogPage /></RequireAuth> },
      { path: '/status', element: <StatusPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const createRouter = () => createBrowserRouter(routes);
