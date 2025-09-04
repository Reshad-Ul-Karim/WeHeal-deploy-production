import express from 'express';
import {
  createOrder,
  processPayment,
  getOrderStatus,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
  cancelOrder
} from '../controllers/oxygenCylinderController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

// User routes (require authentication)
router.post('/create-order', verifyToken, createOrder);
router.post('/process-payment', verifyToken, processPayment);
router.get('/order-status/:orderId', verifyToken, getOrderStatus);
router.get('/orders', verifyToken, getUserOrders);
router.delete('/orders/:orderId/cancel', verifyToken, cancelOrder);

// Admin routes (require admin authentication)
router.get('/admin/orders', verifyToken, isAdmin, getAllOrders);
router.put('/admin/orders/:orderId/status', verifyToken, isAdmin, updateOrderStatus);
router.get('/admin/stats', verifyToken, isAdmin, getOrderStats);

export default router;
