import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('nova:unauthorized', handler);
    return () => window.removeEventListener('nova:unauthorized', handler);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await api.post('/auth/login', { email, password });
    await fetchMe();
  }, [fetchMe]);

  const register = useCallback(async (payload: { firstName: string; lastName: string; email: string; password: string }) => {
    await api.post('/auth/register', payload);
    await fetchMe();
  }, [fetchMe]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
