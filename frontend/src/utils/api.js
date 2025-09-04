import axios from 'axios';
import feather from 'feather-icons';

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'weheal-frontend.onrender.com' ? 'https://weheal-backend.onrender.com/api' : 'https://weheal-backend.onrender.com/api');
const AUTH_URL = `${BASE_URL}/auth`;

// Create axios instances with credentials support
export const authApi = axios.create({
  baseURL: AUTH_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable credentials for all requests
});

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable credentials for all requests
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Function to handle login
export const loginUser = async (loginData) => {
  try {
    console.log('API: Sending login request with data:', loginData);
    console.log('API: Request URL:', '/login');
    
    const response = await authApi.post('/login', loginData);
    console.log('API: Response received:', response.data);
    
    if (response.data.success) {
      const token = response.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Update the default headers for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('API: Login successful, token stored');
    }
    return response.data;
  } catch (error) {
    console.error('API: Login error:', error);
    console.error('API: Error response:', error.response?.data);
    console.error('API: Error status:', error.response?.status);
    throw error;
  }
};

// Function to handle signup
export const signupUser = async (formData) => {
  try {
    console.log('API: Sending signup request with data:', JSON.stringify(formData, null, 2));
    const response = await authApi.post('/signup', formData);
    console.log('API: Signup response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Signup error:', error);
    console.error('API: Error response:', error.response?.data);
    console.error('API: Error status:', error.response?.status);
    console.error('API: Error headers:', error.response?.headers);
    console.error('API: Full error object:', error);
    
    // Re-throw with more detailed error message
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
    throw new Error(`Signup failed: ${errorMessage}`);
  }
};

// Function for email verification
export const verifyEmail = async (code) => {
  try {
    const response = await authApi.post('/verify-email', { code });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await authApi.post(`/reset-password/${token}`, { password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Forgot Password API method
export const forgotPassword = async (email) => {
  try {
    const response = await authApi.post('/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Function to get dashboard data
export const getDashboard = async () => {
  try {
    const response = await api.get('/auth/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    throw error;
  }
};

// Function to handle logout
export const logoutUser = async () => {
  try {
    const response = await authApi.post('/logout');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Function to check authentication status
export const checkAuth = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    const response = await api.get('/auth/check-auth');
    console.log('Auth check response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Auth check failed:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw error;
  }
};

// Admin API functions
export const getAdminStats = async () => {
  try {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSystemHealth = async () => {
  try {
    const response = await api.get('/admin/dashboard/system-health');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUsers = async (page = 1, limit = 10, search = '') => {
  try {
    const response = await api.get('/admin/users', {
      params: { page, limit, search }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserStatus = async (userId, isVerified) => {
  try {
    const response = await api.patch(`/admin/users/${userId}/status`, { isVerified });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Function to get patient dashboard data
export const getPatientDashboard = async () => {
  try {
    const response = await api.get('/patient/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching patient dashboard:', error);
    throw error;
  }
};

// Function to get doctor dashboard data
export const getDoctorDashboard = async () => {
  try {
    console.log('Making request to:', `${api.defaults.baseURL}/doctor/dashboard`); // Debug log
    const response = await api.get('/doctor/dashboard');
    console.log('Doctor dashboard response:', response); // Debug log
    return response.data;
  } catch (error) {
    console.error('Error fetching doctor dashboard:', error);
    throw error;
  }
};

// Initialize Feather Icons
export const initFeatherIcons = () => {
  if (typeof feather !== 'undefined' && feather.replace) {
    feather.replace();
  }
};


