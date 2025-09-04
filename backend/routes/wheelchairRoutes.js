import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/isAdmin.js';
import {
  createOrder,
  processPayment,
  getOrderStatus,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
  cancelOrder
} from '../controllers/wheelchairController.js';

const router = express.Router();

// Add logging middleware
router.use((req, res, next) => {
  console.log('=== Wheelchair Route Hit ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('User:', req.user);
  console.log('User ID:', req.user?._id);
  next();
});

// User routes (require authentication)
router.use(verifyToken);

// Create a new wheelchair order
router.post('/create-order', createOrder);

// Process payment for an order
router.post('/process-payment', processPayment);

// Get order status
router.get('/order/:orderId', getOrderStatus);

// Get user's order history
router.get('/orders', getUserOrders);

// Cancel order
router.delete('/order/:orderId', cancelOrder);

// Admin routes (require admin authentication)
router.use(isAdmin);

// Get all orders (Admin)
router.get('/admin/orders', getAllOrders);

// Update order status (Admin)
router.put('/admin/order/:orderId/status', updateOrderStatus);

// Get order statistics (Admin)
router.get('/admin/stats', getOrderStats);

export default router;
