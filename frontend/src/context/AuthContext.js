import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Failed to parse stored user:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      const res = await authService.register(userData);
      const { token, ...user } = res.data;

      setUser(user);
      setIsAuthenticated(true);

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      return { success: true, user };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Registration failed';

      setError(errorMessage);
      setIsAuthenticated(false);
      throw new Error(errorMessage);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      const res = await authService.login({ email, password });
      const { token, ...user } = res.data;

      setUser(user);
      setIsAuthenticated(true);

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      return { success: true, user };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Login failed';

      setError(errorMessage);
      setIsAuthenticated(false);
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Update user profile
  const updateUser = async (userId, updateData) => {
    try {
      setError(null);
      const res = await authService.updateUser(userId, updateData);
      const updatedUser = res.data;

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      return { success: true, user: updatedUser };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Update failed';

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Get current user from server
  const getCurrentUser = async () => {
    try {
      const res = await authService.getCurrentUser();
      const currentUser = res.data;

      setUser(currentUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(currentUser));

      return currentUser;
    } catch (err) {
      logout();
      throw err;
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    isAuthenticated,
    error,
    loading,
    register,
    login,
    logout,
    updateUser,
    getCurrentUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
