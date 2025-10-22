import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
  getIssues: async (params = {}) => {
    try {
      const response = await api.get('/issues', { params });
      console.log('✅ Issues fetched:', response.data);
      // Backend returns { success: true, issues: [...], count: X, total: Y }
      return response.data.issues || response.data || [];
    } catch (error) {
      console.error('❌ Error fetching issues:', error.response?.data || error.message);
      throw error;
    }
  },

  getIssueById: async (id) => {
    try {
      const response = await api.get(`/issues/${id}`);
      return response.data.issue || response.data;
    } catch (error) {
      console.error('❌ Error fetching issue:', error);
      throw error;
    }
  },

  createIssue: async (issueData) => {
    try {
      const form = new FormData();
      Object.entries(issueData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'photo') {
            if (value instanceof File) {
              form.append(key, value);
            }
          } else if (key === 'latitude' || key === 'longitude') {
            form.append(key, String(parseFloat(value)));
          } else {
            form.append(key, value);
          }
        }
      });
      
      const response = await api.post('/issues', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('✅ Issue created:', response.data);
      return response.data.issue || response.data;
    } catch (error) {
      console.error('❌ Error creating issue:', error.response?.data || error.message);
      throw error;
    }
  },

  updateIssue: async (id, issueData) => {
    try {
      const cleanData = { ...issueData };
      if (cleanData.latitude) cleanData.latitude = parseFloat(cleanData.latitude);
      if (cleanData.longitude) cleanData.longitude = parseFloat(cleanData.longitude);
      
      const response = await api.put(`/issues/${id}`, cleanData);
      console.log('✅ Issue updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating issue:', error);
      throw error;
    }
  },

  deleteIssue: async (id) => {
    try {
      const response = await api.delete(`/issues/${id}`);
      console.log('✅ Issue deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting issue:', error);
      throw error;
    }
  },

  addComment: async (id, comment) => {
    try {
      const response = await api.post(`/issues/${id}/comments`, { comment });
      return response.data;
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      throw error;
    }
  },

  getNearbyIssues: async (latitude, longitude, radius = 5) => {
    try {
      const response = await api.get('/issues/nearby', { 
        params: { latitude, longitude, radius }
      });
      return response.data.issues || [];
    } catch (error) {
      console.error('❌ Error fetching nearby issues:', error);
      throw error;
    }
  },

  getIssueStats: async () => {
    try {
      const response = await api.get('/issues/stats');
      return response.data.stats || response.data;
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      throw error;
    }
  }
};

export default issueService;
