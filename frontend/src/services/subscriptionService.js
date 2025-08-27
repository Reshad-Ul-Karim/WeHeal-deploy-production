import api from './api';

export const subscriptionService = {
  // Get all user subscriptions
  getUserSubscriptions: async () => {
    try {
      const response = await api.get('/subscriptions');
      // Transform the response to match frontend expectations
      if (response.data.success && response.data.data) {
        return {
          success: true,
          subscriptions: response.data.data.subscriptions,
          pagination: response.data.data.pagination
        };
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch subscriptions'
      };
    }
  },

  // Get subscription by ID
  getSubscriptionById: async (subscriptionId) => {
    try {
      const response = await api.get(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch subscription'
      };
    }
  },

  // Create new subscription
  createSubscription: async (subscriptionData) => {
    try {
      const response = await api.post('/subscriptions', subscriptionData);
      return response.data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create subscription'
      };
    }
  },

  // Update subscription
  updateSubscription: async (subscriptionId, updateData) => {
    try {
      const response = await api.put(`/subscriptions/${subscriptionId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update subscription'
      };
    }
  },

  // Update subscription status (active/paused/cancelled)
  updateSubscriptionStatus: async (subscriptionId, status) => {
    try {
      const response = await api.patch(`/subscriptions/${subscriptionId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating subscription status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update subscription status'
      };
    }
  },

  // Delete subscription
  deleteSubscription: async (subscriptionId) => {
    try {
      const response = await api.delete(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting subscription:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete subscription'
      };
    }
  },

  // Process due subscriptions manually (admin function)
  processDueSubscriptions: async () => {
    try {
      const response = await api.post('/subscriptions/process-due');
      return response.data;
    } catch (error) {
      console.error('Error processing due subscriptions:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process due subscriptions'
      };
    }
  },

  // Get subscription analytics/statistics
  getSubscriptionStats: async () => {
    try {
      const response = await api.get('/subscriptions/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch subscription statistics'
      };
    }
  },

  // Pause subscription
  pauseSubscription: async (subscriptionId) => {
    return subscriptionService.updateSubscriptionStatus(subscriptionId, 'paused');
  },

  // Resume subscription
  resumeSubscription: async (subscriptionId) => {
    return subscriptionService.updateSubscriptionStatus(subscriptionId, 'active');
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId) => {
    return subscriptionService.updateSubscriptionStatus(subscriptionId, 'cancelled');
  }
};
