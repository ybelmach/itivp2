import { Suspense } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import * as Sentry from '@sentry/react';
import { useAuth } from '../auth/AuthContext';
import { hasRole } from '../auth/roles';
import { ROLE_LABELS } from '../utils/format';
import { ErrorMessage, Spinner } from './States';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <NavLink to="/" className="logo">📚 StudyShare</NavLink>
          <nav className="nav">
            <NavLink to="/" end>Каталог</NavLink>
            {user && <NavLink to="/favorites">Избранное</NavLink>}
            {user && <NavLink to="/my">Мои материалы</NavLink>}
            {hasRole(user, 'moderator') && <NavLink to="/admin/users">Пользователи</NavLink>}
            {hasRole(user, 'admin') && <NavLink to="/admin/audit">Аудит</NavLink>}
            <NavLink to="/status">Статус</NavLink>
          </nav>
          <div className="user-box">
            {user ? (
              <>
                <span className="muted small" title={user.email}>{user.email} · {ROLE_LABELS[user.role]}</span>
                <button type="button" className="btn" onClick={handleLogout}>Выйти</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="btn">Войти</NavLink>
                <NavLink to="/register" className="btn btn-primary">Регистрация</NavLink>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="container main">
        {/* Ошибки рендера отправляются в Sentry, пользователь видит сообщение вместо белого экрана */}
        <Sentry.ErrorBoundary
          fallback={({ resetError }) => (
            <ErrorMessage message="Произошла ошибка на странице. Мы уже получили отчёт о ней." onRetry={resetError} />
          )}
        >
          {/* Страницы загружаются лениво (React.lazy), пока чанк грузится — показываем индикатор */}
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </Sentry.ErrorBoundary>
      </main>
      <footer className="footer container muted small">
        Платформа обмена учебными материалами · ИТиВП, ч. 2
      </footer>
    </div>
  );
}
