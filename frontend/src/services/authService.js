import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (userData) => api.post('/auth/login', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put(`/users/${userData.id}`, userData),
  updateLocation: (lat, lng) =>
    api.put('/location/update', { latitude: lat, longitude: lng }),
  getNearbyUsers: (lat, lng, radius = 10) =>
    api.get(
      `/location/nearby?latitude=${lat}&longitude=${lng}&radius=${radius}`,
    ),
  getUsersByRoleInArea: (role, lat, lng, radius = 10) =>
    api.get(
      `/location/role/${role}?latitude=${lat}&longitude=${lng}&radius=${radius}`,
    ),
  getUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export default authService;
