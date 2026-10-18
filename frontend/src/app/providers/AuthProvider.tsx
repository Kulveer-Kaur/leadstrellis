import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authApi from '@/features/auth/api/auth.api';
import { AuthContext } from '@/features/auth/auth-context';
import type { AuthStatus, AuthUser } from '@/features/auth/auth.types';
import { setUnauthorizedHandler } from '@/services/http';
import { tokenStorage } from '@/services/token-storage';

/** Holds the signed-in user. On load, a stored token is checked with GET /auth/me. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(tokenStorage.get() ? 'loading' : 'anonymous');

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus('anonymous');
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    if (!tokenStorage.get()) return;
    authApi
      .fetchMe()
      .then((me) => {
        setUser(me);
        setStatus('authenticated');
      })
      .catch(clearSession);
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    tokenStorage.set(res.token);
    setUser(res.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    clearSession();
  }, [clearSession]);

  const setSession = useCallback((token: string, newUser: AuthUser) => {
    tokenStorage.set(token);
    setUser(newUser);
    setStatus('authenticated');
  }, []);

  const value = useMemo(() => ({ status, user, login, logout, setSession }), [status, user, login, logout, setSession]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
