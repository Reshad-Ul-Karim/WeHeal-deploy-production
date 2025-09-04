// Simple, robust API configuration
const isProduction = window.location.hostname === 'weheal-frontend.onrender.com';
// Temporary CORS proxy for production
const API_BASE_URL = isProduction ? 'https://cors-anywhere.herokuapp.com/https://weheal-backend.onrender.com/api' : 'http://localhost:5001/api';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  AUTH_URL: `${API_BASE_URL}/auth`,
  TIMEOUT: 10000, // 10 seconds
};

export default API_CONFIG;
