import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
  getProducts,
  getProductById,
  getProductsByCategory
} from '../controllers/marketplaceController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/products', getProducts);
router.get('/products/category/:category', getProductsByCategory);
router.get('/products/:id', getProductById);

export default router;
