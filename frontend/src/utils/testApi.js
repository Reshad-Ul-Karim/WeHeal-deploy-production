// Simple API test utility
import { API_CONFIG } from '../config/api.js';

export const testApiConnection = async () => {
  try {
    console.log('Testing API connection to:', API_CONFIG.BASE_URL);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/test`);
    const data = await response.json();
    
    console.log('API Test Response:', data);
    return { success: true, data };
  } catch (error) {
    console.error('API Test Failed:', error);
    return { success: false, error: error.message };
  }
};

export const testLogin = async (email, password) => {
  try {
    console.log('Testing login to:', API_CONFIG.AUTH_URL + '/login');
    
    const response = await fetch(`${API_CONFIG.AUTH_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    console.log('Login Test Response:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Login Test Failed:', error);
    return { success: false, error: error.message };
  }
};
