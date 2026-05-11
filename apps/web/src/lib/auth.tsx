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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('sansur_token');
    if (!token) {
      setLoading(false);
      return;
    }
    apiClient
      .get<AuthUser>('/api/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('sansur_token'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user && !PUBLIC_ROUTES.includes(pathname)) {
      router.replace('/login');
    } else if (user && pathname === '/login') {
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  async function login(email: string, password: string) {
    const data = await apiClient.post<{ token: string; user: AuthUser }>(
      '/api/auth/login',
      { email, password }
    );
    localStorage.setItem('sansur_token', data.token);
    setUser(data.user);
    router.replace('/');
  }

  function logout() {
    localStorage.removeItem('sansur_token');
    setUser(null);
    router.replace('/login');
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth fuera de AuthProvider');
  return ctx;
}
