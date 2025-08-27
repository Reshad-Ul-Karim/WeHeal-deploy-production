import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  createOrderAfterPayment,
  testOrderCreation,
  generateInvoice
} from '../controllers/orderController.js';

const router = express.Router();

// All order routes require authentication
router.use(verifyToken);

router.post('/create', createOrder);
router.post('/create-after-payment', createOrderAfterPayment);
router.get('/', getUserOrders);
router.get('/:orderId', getOrderById);
router.get('/:orderId/invoice', generateInvoice);
router.put('/:orderId/cancel', cancelOrder);
router.post('/test', testOrderCreation);

export default router;
