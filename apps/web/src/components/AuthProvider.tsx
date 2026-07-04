import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserDto } from 'shared';
import { API_BASE_URL, AUTH_LOGOUT_EVENT, clearSession } from '../lib/api';

interface AuthContextType {
  user: UserDto | null;
  login: (user: UserDto, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hydrate synchronously: an effect would run after the first render, so
// PrivateRoute would bounce logged-in users to /login on every page refresh.
function readStoredUser(): UserDto | null {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser) as UserDto;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(readStoredUser);

  // fetchApi clears the session and fires this event when a token refresh fails.
  useEffect(() => {
    const onForcedLogout = (): void => setUser(null);
    window.addEventListener(AUTH_LOGOUT_EVENT, onForcedLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onForcedLogout);
  }, []);

  const login = (userData: UserDto, accessToken: string, refreshToken: string): void => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  };

  const logout = (): void => {
    // Revoke the refresh token server-side; fire-and-forget so logout is instant.
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      void fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
    setUser(null);
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
