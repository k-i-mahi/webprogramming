import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async ({ email, password }) => {
    try {
      const res = await authService.login({ email, password });
      const { user, token } = res.data;

      setUser(user);
      setIsAuthenticated(true);
      setError(null);

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setIsAuthenticated(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, logout, error, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
