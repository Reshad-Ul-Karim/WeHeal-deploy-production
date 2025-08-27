import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
// Import controllers from Emergency module
import { 
  createEmergencyRequest, 
  acceptRequest, 
  updateRequestStatus, 
  getRequestDetails, 
  updatePaymentStatus 
} from '../controllers/emergency/emergencyController.js';

const router = express.Router();

// Emergency routes
router.post('/request', verifyToken, createEmergencyRequest);
router.post('/accept', verifyToken, acceptRequest);
router.put('/status/:requestId', verifyToken, updateRequestStatus);
router.get('/details/:requestId', verifyToken, getRequestDetails);
router.put('/payment/:requestId', verifyToken, updatePaymentStatus);

export default router; 