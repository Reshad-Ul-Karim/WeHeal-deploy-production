import express from 'express';
import {
  createSubscription,
  getUserSubscriptions,
  updateSubscription,
  toggleSubscriptionStatus,
  cancelSubscription,
  triggerSubscriptionProcessing,
  getSubscriptionDetails
} from '../controllers/subscriptionController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Create new subscription
router.post('/', createSubscription);

// Get user's subscriptions
router.get('/', getUserSubscriptions);

// Get specific subscription details
router.get('/:subscriptionId', getSubscriptionDetails);

// Update subscription
router.put('/:subscriptionId', updateSubscription);

// Pause/Resume subscription
router.patch('/:subscriptionId/toggle', toggleSubscriptionStatus);

// Cancel subscription
router.delete('/:subscriptionId', cancelSubscription);

// Manual trigger for processing subscriptions (admin/testing)
router.post('/process/trigger', triggerSubscriptionProcessing);

export default router;
