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

const issueService = {
  // Get all issues
  getIssues: async (params = {}) => {
    const response = await api.get('/issues', { params });
    return response;
  },

  // Get issue by ID
  getIssueById: async (id) => {
    const response = await api.get(`/issues/${id}`);
    return response;
  },

  // Create new issue
  createIssue: async (issueData) => {
    const form = new FormData();
    Object.entries(issueData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        form.append(key, value);
      }
    });
    const response = await api.post('/issues', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response;
  },

  // Update issue
  updateIssue: async (id, issueData) => {
    const response = await api.put(`/issues/${id}`, issueData);
    return response;
  },

  // Delete issue
  deleteIssue: async (id) => {
    const response = await api.delete(`/issues/${id}`);
    return response;
  },

  // Add comment to issue
  addComment: async (id, comment) => {
    const response = await api.post(`/issues/${id}/comments`, { comment });
    return response;
  },

  // Get nearby issues
  getNearbyIssues: async (latitude, longitude, radius = 5) => {
    const response = await api.get(`/issues/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
    return response;
  },

  // Get issue statistics
  getIssueStats: async () => {
    const response = await api.get('/issues/stats');
    return response;
  }
};

export default issueService;
