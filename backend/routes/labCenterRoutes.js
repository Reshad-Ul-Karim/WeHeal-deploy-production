import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/isAdmin.js';
import {
  getAllLabCenters,
  getLabCenter,
  createLabCenter,
  updateLabCenter,
  deleteLabCenter,
  getLabCentersByCity
} from '../controllers/labCenterController.js';

const router = express.Router();

// Public routes (for patients to view lab centers)
router.get('/', getAllLabCenters);
router.get('/city/:city', getLabCentersByCity);
router.get('/:id', getLabCenter);

// Admin routes (protected)
router.post('/', verifyToken, isAdmin, createLabCenter);
router.put('/:id', verifyToken, isAdmin, updateLabCenter);
router.delete('/:id', verifyToken, isAdmin, deleteLabCenter);

export default router;
