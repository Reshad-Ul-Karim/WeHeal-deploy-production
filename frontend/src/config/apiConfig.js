// API Configuration for WeHeal Application
// This file centralizes all API endpoint configurations

// Get API base URL - simple and reliable
const isProduction = window.location.hostname === 'weheal-frontend.onrender.com';
const API_BASE_URL = isProduction ? 'https://weheal-backend.onrender.com/api' : 'http://localhost:5001/api';
const BACKEND_BASE_URL = isProduction ? 'https://weheal-backend.onrender.com' : 'http://localhost:5001';

// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGNUP: `${API_BASE_URL}/auth/signup`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: (token) => `${API_BASE_URL}/auth/reset-password/${token}`,
    CHECK_AUTH: `${API_BASE_URL}/auth/check-auth`,
    DASHBOARD: `${API_BASE_URL}/auth/dashboard`,
  },

  // Dashboard
  DASHBOARD: {
    MAIN: `${API_BASE_URL}/dashboard`,
  },

  // Admin
  ADMIN: {
    BASE: `${API_BASE_URL}/admin`,
    MARKETPLACE: `${API_BASE_URL}/admin/marketplace`,
  },

  // Marketplace
  MARKETPLACE: {
    PRODUCTS: `${API_BASE_URL}/marketplace/products`,
    PRODUCT_BY_ID: (id) => `${API_BASE_URL}/marketplace/products/${id}`,
    PRODUCTS_BY_CATEGORY: (category) => `${API_BASE_URL}/marketplace/products/category/${category}`,
  },

  // Cart
  CART: {
    BASE: `${API_BASE_URL}/cart`,
  },

  // Orders
  ORDERS: {
    BASE: `${API_BASE_URL}/orders`,
  },

  // Video Call
  VIDEO_CALL: {
    BASE: `${API_BASE_URL}/video-call`,
  },

  // Doctor
  DOCTOR: {
    DASHBOARD: `${API_BASE_URL}/doctor/dashboard`,
    AVAILABILITY: `${API_BASE_URL}/doctor/availability`,
    ALL_AVAILABILITY: `${API_BASE_URL}/doctor/availability/all`,
    PATIENT_DETAILS: (patientId) => `${API_BASE_URL}/doctor/patient/${patientId}`,
    APPOINTMENT_DETAILS: (appointmentId) => `${API_BASE_URL}/doctor/appointment/${appointmentId}`,
    PROFILE: `${API_BASE_URL}/doctor/profile`,
    SPECIALIZATIONS: `${API_BASE_URL}/doctor/specializations`,
    UPLOAD_PROFILE_PICTURE: `${API_BASE_URL}/doctor/upload-profile-picture`,
  },

  // Patient
  PATIENT: {
    DASHBOARD: `${API_BASE_URL}/patient/dashboard`,
    SEARCH_DOCTORS: `${API_BASE_URL}/patient/search-doctors`,
    DOCTOR_AVAILABILITY: `${API_BASE_URL}/patient/doctor-availability`,
    BOOK_APPOINTMENT: `${API_BASE_URL}/patient/book-appointment`,
    CANCEL_APPOINTMENT: `${API_BASE_URL}/patient/cancel-appointment`,
  },

  // Prescriptions
  PRESCRIPTIONS: {
    BASE: `${API_BASE_URL}/prescriptions`,
  },

  // Subscriptions
  SUBSCRIPTIONS: {
    BASE: `${API_BASE_URL}/subscriptions`,
  },

  // Flash Sales
  FLASH_SALES: {
    BASE: `${API_BASE_URL}/flash-sales`,
  },

  // Emergency
  EMERGENCY: {
    REQUEST: `${API_BASE_URL}/emergency/request`,
    ACCEPT_REQUEST: (requestId) => `${API_BASE_URL}/emergency/accept/${requestId}`,
    UPDATE_STATUS: (requestId) => `${API_BASE_URL}/emergency/status/${requestId}`,
    REQUEST_DETAILS: (requestId) => `${API_BASE_URL}/emergency/request/${requestId}`,
    UPDATE_PAYMENT: (requestId) => `${API_BASE_URL}/emergency/payment/${requestId}`,
    DRIVER_PROFILE: `${API_BASE_URL}/emergency/driver/profile`,
    ALL_DRIVERS: `${API_BASE_URL}/emergency/drivers`,
    UPLOAD_DRIVER_PICTURE: `${API_BASE_URL}/emergency/driver/upload-profile-picture`,
    UPDATE_RIDE: (requestId) => `${API_BASE_URL}/emergency/ride/${requestId}`,
    RIDE_DETAILS: (requestId) => `${API_BASE_URL}/emergency/ride/${requestId}`,
  },

  // Lab Centers
  LAB_CENTERS: {
    ALL: `${API_BASE_URL}/lab-centers`,
    BY_CITY: (city) => `${API_BASE_URL}/lab-centers/city/${city}`,
    BY_ID: (id) => `${API_BASE_URL}/lab-centers/${id}`,
  },

  // Payments
  PAYMENTS: {
    INIT: `${API_BASE_URL}/payments/init`,
    VERIFY: (orderId) => `${API_BASE_URL}/payments/verify/${orderId}`,
    STATUS: (orderId) => `${API_BASE_URL}/payments/status/${orderId}`,
    USER_PAYMENTS: `${API_BASE_URL}/payments/user`,
    RECEIPT: (orderId) => `${API_BASE_URL}/payments/receipt/${orderId}`,
  },

  // Lab Test Pricing
  LAB_TEST_PRICING: {
    BASE: `${API_BASE_URL}/lab-test-pricing`,
  },

  // Lab Test Reports
  LAB_TEST_REPORTS: {
    BASE: `${API_BASE_URL}/lab-test-reports`,
    BY_ID: (id) => `${API_BASE_URL}/lab-test-reports/${id}`,
  },

  // Emergency Nurses
  EMERGENCY_NURSES: {
    BASE: `${API_BASE_URL}/emergency-nurses`,
  },

  // Additional Services
  OXYGEN_CYLINDERS: {
    BASE: `${API_BASE_URL}/oxygen-cylinders`,
  },

  WHEELCHAIRS: {
    BASE: `${API_BASE_URL}/wheelchairs`,
  },

  CUSTOMER_CARE: {
    BASE: `${API_BASE_URL}/customer-care`,
  },

  REPORTS: {
    BASE: `${API_BASE_URL}/reports`,
  },
};

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  URL: BACKEND_BASE_URL,
  PATH: '/socket.io',
  OPTIONS: {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    transports: ['websocket', 'polling'],
  },
};

// Environment Configuration
export const ENV_CONFIG = {
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  API_BASE_URL,
  BACKEND_BASE_URL,
  ZEGO_APP_ID: process.env.REACT_APP_ZEGO_APP_ID,
  ZEGO_SERVER_SECRET: process.env.REACT_APP_ZEGO_SERVER_SECRET,
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to get WebSocket URL
export const getWebSocketUrl = () => {
  return BACKEND_BASE_URL;
};

export default API_ENDPOINTS;
