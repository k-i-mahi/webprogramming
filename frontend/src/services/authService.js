import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const authService = {
  // Register user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response;
  },

  // Login user
  login: async (userData) => {
    const response = await api.post('/auth/login', userData);
    return response;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await api.put(`/users/${userData.id}`, userData);
    return response;
  },

  // Update user location
  updateLocation: async (latitude, longitude) => {
    const response = await api.put('/location/update', { latitude, longitude });
    return response;
  },

  // Get nearby users
  getNearbyUsers: async (latitude, longitude, radius = 10) => {
    const response = await api.get(`/location/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
    return response;
  },

  // Get users by role in area
  getUsersByRoleInArea: async (role, latitude, longitude, radius = 10) => {
    const response = await api.get(`/location/role/${role}?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
    return response;
  },

  // Get all users (admin only)
  getUsers: async () => {
    const response = await api.get('/users');
    return response;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response;
  },

  // Delete user (admin only)
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response;
  }
};

export default authService;
