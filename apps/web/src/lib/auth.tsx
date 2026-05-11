'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { AuthUser } from '@sansur/shared';
import { apiClient } from './api';

type AuthContext = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthContext | null>(null);

const PUBLIC_ROUTES = ['/login'];
const SESSION_COOKIE = 'sansur_has_session';

function setSessionCookie() {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${SESSION_COOKIE}=1; Path=/; Max-Age=86400; SameSite=Lax${secure}`;
}

function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function FullScreenLoader() {
  return (
    <div className="flex h-screen items-center justify-center text-slate-500">
      Cargando...
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sansur_token') : null;
    if (!token) {
      clearSessionCookie();
      setLoading(false);
      return;
    }
    apiClient
      .get<AuthUser>('/api/auth/me')
      .then((u) => {
        setUser(u);
        setSessionCookie();
      })
      .catch(() => {
        localStorage.removeItem('sansur_token');
        clearSessionCookie();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublicRoute) {
      router.replace('/login');
    } else if (user && isPublicRoute) {
      router.replace('/');
    }
  }, [user, loading, isPublicRoute, router]);

  async function login(email: string, password: string) {
    const data = await apiClient.post<{ token: string; user: AuthUser }>(
      '/api/auth/login',
      { email, password }
    );
    localStorage.setItem('sansur_token', data.token);
    setSessionCookie();
    setUser(data.user);
    router.replace('/');
  }

  function logout() {
    localStorage.removeItem('sansur_token');
    clearSessionCookie();
    setUser(null);
    router.replace('/login');
  }

  const ctxValue = { user, loading, login, logout };

  if (loading) {
    return <Ctx.Provider value={ctxValue}><FullScreenLoader /></Ctx.Provider>;
  }

  if (!user && !isPublicRoute) {
    return <Ctx.Provider value={ctxValue}><FullScreenLoader /></Ctx.Provider>;
  }

  if (user && isPublicRoute) {
    return <Ctx.Provider value={ctxValue}><FullScreenLoader /></Ctx.Provider>;
  }

  return <Ctx.Provider value={ctxValue}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth fuera de AuthProvider');
  return ctx;
}
