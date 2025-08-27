import express from 'express';
import {
  getActiveFlashSales,
  getProductFlashSale,
  createRandomFlashSale,
  createMultipleRandomFlashSales,
  getAllFlashSales,
  endFlashSale
} from '../controllers/flashSaleController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveFlashSales);
router.get('/product/:productId', getProductFlashSale);

// Admin routes
router.use(verifyToken);
router.use(isAdmin);

router.get('/admin/all', getAllFlashSales);
router.post('/admin/create-random', createRandomFlashSale);
router.post('/admin/create-multiple', createMultipleRandomFlashSales);
router.patch('/admin/:flashSaleId/end', endFlashSale);

export default router;
