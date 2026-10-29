import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { hasRole } from '../auth/roles';
import { ErrorMessage, Spinner } from './States';

// Пускает на страницу только вошедших пользователей с нужной ролью
export default function RequireAuth({ role = 'user', children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <Spinner label="Проверяем вход…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!hasRole(user, role)) return <ErrorMessage message="Недостаточно прав для просмотра этой страницы" />;
  return children;
}
