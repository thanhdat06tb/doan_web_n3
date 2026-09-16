import React, { createContext, useEffect, useMemo, useState } from 'react';
import api from '../utils/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const saveSession = (session) => {
    localStorage.setItem('token', session.token);
    if (session.refreshToken) {
      localStorage.setItem('refreshToken', session.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(session.user));
    setToken(session.token);
    setUser(session.user);
  };

  const login = async ({ email, password }) => {
    const response = await api.post('/auth/login', { email, password });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Đăng nhập thất bại.');
    }
    saveSession(response.data.data);
    return response.data.data.user;
  };

  const register = async ({ fullName, email, phone, address, password }) => {
    const response = await api.post('/auth/register', { fullName, email, phone, address, password });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Đăng ký thất bại.');
    }
    saveSession(response.data.data);
    return response.data.data.user;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (token) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Local logout still wins if the server is unavailable.
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
