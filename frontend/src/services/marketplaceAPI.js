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
      console.error('Authentication error in marketplace API:', error.response?.data);
    }
    return Promise.reject(error);
  }
);

// Marketplace API functions
export const marketplaceAPI = {
  // Get all products
  getProducts: async (params = {}) => {
    const response = await api.get('/marketplace/products', { params });
    return response.data;
  },

  // Get products by category
  getProductsByCategory: async (category, params = {}) => {
    const response = await api.get(`/marketplace/products/category/${category}`, { params });
    return response.data;
  },

  // Get single product
  getProduct: async (id) => {
    const response = await api.get(`/marketplace/products/${id}`);
    return response.data;
  },
};

// Cart API functions
export const cartAPI = {
  // Get user's cart
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  // Add item to cart
  addToCart: async (productId, quantity = 1, labOption = null, flashSaleData = null) => {
    const requestData = { productId, quantity };
    
    // Add lab option data if provided (for lab test products)
    if (labOption) {
      requestData.labOption = labOption;
    }
    
    // Add flash sale data if provided
    if (flashSaleData) {
      requestData.flashSaleData = flashSaleData;
    }
    
    const response = await api.post('/cart/add', requestData);
    return response.data;
  },

  // Update cart item
  updateCartItem: async (productId, quantity, labOption = null) => {
    const requestData = { productId, quantity };
    if (labOption) {
      requestData.labOption = labOption;
    }
    const response = await api.put('/cart/update', requestData);
    return response.data;
  },

  // Remove item from cart
  removeFromCart: async (productId, labOption = null) => {
    const requestData = { productId };
    if (labOption) {
      requestData.labOption = labOption;
    }
    const response = await api.delete(`/cart/remove/${productId}`, { data: requestData });
    return response.data;
  },

  // Clear cart
  clearCart: async () => {
    const response = await api.delete('/cart/clear');
    return response.data;
  },
};

// Order API functions
export const orderAPI = {
  // Create new order
  createOrder: async (orderData) => {
    const response = await api.post('/orders/create', orderData);
    return response.data;
  },

  // Create new order after payment completion
  createOrderAfterPayment: async (payload) => {
    const response = await api.post('/orders/create-after-payment', payload);
    return response.data;
  },

  // Get user's orders
  getUserOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  // Get single order
  getOrder: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    const response = await api.put(`/orders/${orderId}/cancel`);
    return response.data;
  },

  // Download invoice
  downloadInvoice: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/invoice`, {
      responseType: 'blob'
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'Invoice downloaded successfully' };
  },
};

// Payment API
export const paymentAPI = {
  initPayment: async (payload) => {
    const response = await api.post('/payments/init', payload);
    return response.data;
  },
  verifyPayment: async (orderId, payload) => {
    const response = await api.post(`/payments/verify/${orderId}`, payload);
    return response.data;
  },
  getStatus: async (orderId) => {
    const response = await api.get(`/payments/status/${orderId}`);
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/payments/history');
    return response.data;
  },
  generateReceipt: async (orderId) => {
    const response = await api.get(`/payments/receipt/${orderId}`);
    return response.data;
  },
};

// Admin marketplace API functions
export const adminMarketplaceAPI = {
  // Get all products (admin)
  getAllProducts: async (params = {}) => {
    const response = await api.get('/admin/marketplace/products', { params });
    return response.data;
  },

  // Create product
  createProduct: async (formData) => {
    const response = await api.post('/admin/marketplace/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update product
  updateProduct: async (id, formData) => {
    const response = await api.put(`/admin/marketplace/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete product
  deleteProduct: async (id) => {
    const response = await api.delete(`/admin/marketplace/products/${id}`);
    return response.data;
  },

  // Get all orders (admin)
  getAllOrders: async (params = {}) => {
    const response = await api.get('/admin/marketplace/orders', { params });
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (orderId, statusData) => {
    const response = await api.put(`/admin/marketplace/orders/${orderId}/status`, statusData);
    return response.data;
  },

  // Get marketplace statistics
  getMarketplaceStats: async () => {
    const response = await api.get('/admin/marketplace/stats');
    return response.data;
  },
};

export default api;
