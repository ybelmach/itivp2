import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Sentry from '@sentry/react';
import { useQueryClient } from '@tanstack/react-query';
import { refreshSession, setAccessToken, setOnAuthLost } from '../api/client';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const queryClient = useQueryClient();

  const applySession = useCallback((session) => {
    setAccessToken(session?.accessToken ?? null);
    setUser(session?.user ?? null);
    // В Sentry уходит только id и роль пользователя, без email
    Sentry.setUser(session?.user ? { id: String(session.user.id), role: session.user.role } : null);
  }, []);

  // При открытии страницы пробуем восстановить сессию по refresh-cookie
  useEffect(() => {
    setOnAuthLost(() => applySession(null));
    refreshSession()
      .then(applySession)
      .catch(() => applySession(null))
      .finally(() => setInitializing(false));
  }, [applySession]);

  const login = useCallback(async (credentials) => {
    const session = await authApi.login(credentials);
    applySession(session);
    queryClient.invalidateQueries({ queryKey: ['favorites'] });
    return session.user;
  }, [applySession, queryClient]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      applySession(null);
      queryClient.removeQueries({ queryKey: ['favorites'] });
      queryClient.removeQueries({ queryKey: ['users'] });
    }
  }, [applySession, queryClient]);

  const value = useMemo(() => ({
    user, initializing, login, logout, register: authApi.register,
  }), [user, initializing, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth должен использоваться внутри AuthProvider');
  return ctx;
}
