import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/isAdmin.js';
import {
  getLabTestPricing,
  getAllLabTestPricing,
  createLabTestPricing,
  updateLabTestPricing,
  deleteLabTestPricing,
  bulkCreateLabTestPricing
} from '../controllers/labTestPricingController.js';

const router = express.Router();

// Public routes (for patients to view pricing)
router.get('/product/:productId', getLabTestPricing);

// Admin routes (protected)
router.get('/', verifyToken, isAdmin, getAllLabTestPricing);
router.post('/', verifyToken, isAdmin, createLabTestPricing);
router.post('/bulk', verifyToken, isAdmin, bulkCreateLabTestPricing);
router.put('/:id', verifyToken, isAdmin, updateLabTestPricing);
router.delete('/:id', verifyToken, isAdmin, deleteLabTestPricing);

export default router;
