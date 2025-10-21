import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null,
  role: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        role: action.payload.user?.role || null,
        loading: false,
        error: null
      };
    case 'AUTH_FAIL':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        role: null,
        loading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    loadUser();
  }, []);

  // Load user from token
  const loadUser = async () => {
    if (localStorage.getItem('token')) {
      try {
        const response = await authService.getMe();
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.data.user,
            token: localStorage.getItem('token')
          }
        });
      } catch (error) {
        dispatch({
          type: 'AUTH_FAIL',
          payload: error.response?.data?.message || 'Authentication failed'
        });
        localStorage.removeItem('token');
      }
    } else {
      dispatch({ type: 'AUTH_FAIL', payload: null });
    }
  };

  // Register user
  const register = async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.register(userData);
      localStorage.setItem('token', response.data.token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: response.data
      });
      return response;
    } catch (error) {
      dispatch({
        type: 'AUTH_FAIL',
        payload: error.response?.data?.message || 'Registration failed'
      });
      throw error;
    }
  };

  // Login user
  const login = async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.login(userData);
      localStorage.setItem('token', response.data.token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: response.data
      });
      return response;
    } catch (error) {
      dispatch({
        type: 'AUTH_FAIL',
        payload: error.response?.data?.message || 'Login failed'
      });
      throw error;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  // Clear errors
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    register,
    login,
    logout,
    clearError,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
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
