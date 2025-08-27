import api from './api';

export const flashSaleService = {
  // Get all active flash sales
  getActiveFlashSales: async () => {
    try {
      const response = await api.get('/flash-sales/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active flash sales:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch flash sales'
      };
    }
  },

  // Get flash sale for specific product
  getProductFlashSale: async (productId) => {
    try {
      const response = await api.get(`/flash-sales/product/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product flash sale:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch product flash sale'
      };
    }
  },

  // Admin functions
  admin: {
    // Get all flash sales (admin)
    getAllFlashSales: async (params = {}) => {
      try {
        const response = await api.get('/flash-sales/admin/all', { params });
        return response.data;
      } catch (error) {
        console.error('Error fetching all flash sales:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch flash sales'
        };
      }
    },

    // Create random flash sale
    createRandomFlashSale: async () => {
      try {
        const response = await api.post('/flash-sales/admin/create-random');
        return response.data;
      } catch (error) {
        console.error('Error creating random flash sale:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create flash sale'
        };
      }
    },

    // Create multiple random flash sales
    createMultipleFlashSales: async (count = 3) => {
      try {
        const response = await api.post('/flash-sales/admin/create-multiple', { count });
        return response.data;
      } catch (error) {
        console.error('Error creating multiple flash sales:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create flash sales'
        };
      }
    },

    // End flash sale
    endFlashSale: async (flashSaleId) => {
      try {
        const response = await api.patch(`/flash-sales/admin/${flashSaleId}/end`);
        return response.data;
      } catch (error) {
        console.error('Error ending flash sale:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to end flash sale'
        };
      }
    }
  }
};
