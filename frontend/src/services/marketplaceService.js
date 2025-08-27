import api from './api';

export const marketplaceService = {
  // Get all products
  getProducts: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/marketplace/products?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch products'
      };
    }
  },

  // Get product by ID
  getProductById: async (productId) => {
    try {
      const response = await api.get(`/marketplace/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch product'
      };
    }
  },

  // Search products
  searchProducts: async (searchTerm) => {
    try {
      const response = await api.get(`/marketplace/search?q=${encodeURIComponent(searchTerm)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to search products'
      };
    }
  }
};
