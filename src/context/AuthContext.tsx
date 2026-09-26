import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminUser } from '../types';
import { authService, LoginCredentials } from '../api/auth';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (creds: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    authService.getCurrentUser().then((res) => {
      if (res.success && res.data) setUser(res.data);
    }).catch(() => setUser(null));
  }, []);

  const login = async (creds: LoginCredentials) => {
    setIsLoading(true);
    try {
      const res = await authService.login(creds);
      if (res.success && res.data) {
        setUser(res.data.user);
        return { success: true };
      }
      const errString = typeof res.error === 'object' ? res.error?.message : (res.error || 'Login failed');
      return { success: false, error: errString };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
