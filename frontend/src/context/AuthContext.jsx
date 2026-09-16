import React, { createContext, useCallback, useMemo, useState } from 'react';
import api from '../utils/api';

export const AuthContext = createContext(null);

const readStoredSession = () => {
  const storedToken = localStorage.getItem('token');
  if (!storedToken) {
    return { token: null, user: null };
  }

  try {
    const savedUser = localStorage.getItem('user');
    const storedUser = savedUser ? JSON.parse(savedUser) : null;
    if (!storedUser) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return { token: null, user: null };
    }
    return { token: storedToken, user: storedUser };
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(readStoredSession);

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setSession({ token: null, user: null });
  }, []);

  const saveSession = useCallback((nextSession) => {
    localStorage.setItem('token', nextSession.token);
    if (nextSession.refreshToken) {
      localStorage.setItem('refreshToken', nextSession.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(nextSession.user));
    setSession({ token: nextSession.token, user: nextSession.user });
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const response = await api.post('/auth/login', { email, password });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Đăng nhập thất bại.');
    }
    saveSession(response.data.data);
    return response.data.data.user;
  }, [saveSession]);

  const register = useCallback(async ({ fullName, email, phone, address, password }) => {
    const response = await api.post('/auth/register', { fullName, email, phone, address, password });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Đăng ký thất bại.');
    }
    saveSession(response.data.data);
    return response.data.data.user;
  }, [saveSession]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const currentToken = session.token;

    clearSession();

    try {
      if (currentToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Local logout still wins if the server is unavailable.
    }
  }, [clearSession, session.token]);

  const value = useMemo(() => ({
    user: session.user,
    token: session.token,
    isAuthenticated: Boolean(session.token && session.user),
    login,
    register,
    logout,
    clearSession,
  }), [clearSession, login, logout, register, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
