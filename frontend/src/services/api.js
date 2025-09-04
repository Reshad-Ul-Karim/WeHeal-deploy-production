import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'weheal-frontend.onrender.com' ? 'https://weheal-backend.onrender.com/api' : 'https://weheal-backend.onrender.com/api');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('Authentication error:', error.response?.data);
      // Optionally redirect to login page
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
