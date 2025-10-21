import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

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

const categoryService = {
  // Get all categories
  getCategories: async (params = {}) => {
    const response = await api.get('/categories', { params });
    return response;
  },

  // Get category by ID
  getCategoryById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response;
  },

  // Create new category
  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response;
  },

  // Update category
  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response;
  },

  // Delete category
  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response;
  },

  // Assign users to category
  assignUsersToCategory: async (id, userIds) => {
    const response = await api.put(`/categories/${id}/assign`, { userIds });
    return response;
  },

  // Remove users from category
  unassignUsersFromCategory: async (id, userIds) => {
    const response = await api.put(`/categories/${id}/unassign`, { userIds });
    return response;
  }
};

export default categoryService;
