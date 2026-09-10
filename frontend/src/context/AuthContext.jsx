import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vov_admin_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('vov_admin_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('vov_admin_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('vov_admin_user', JSON.stringify(res.user));
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    verifyAuth();
  }, []);

  const login = async (usernameOrEmail, password) => {
    const res = await api.login({ username: usernameOrEmail, password });
    if (res.success && res.token) {
      localStorage.setItem('vov_admin_token', res.token);
      localStorage.setItem('vov_admin_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    api.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
