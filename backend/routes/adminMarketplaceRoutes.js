import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/isAdmin.js';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getMarketplaceStats
} from '../controllers/adminMarketplaceController.js';

const router = express.Router();

// All admin marketplace routes require authentication and admin role
router.use(verifyToken);
router.use(isAdmin);

// Product management routes
router.get('/products', getAllProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Order management routes
router.get('/orders', getAllOrders);
router.put('/orders/:orderId/status', updateOrderStatus);

// Statistics route
router.get('/stats', getMarketplaceStats);

export default router;
