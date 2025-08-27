import express from 'express';
import {
    createEmergencyRequest,
    acceptRequest,
    updateRequestStatus,
    getRequestDetails,
    updatePaymentStatus
} from '../controllers/emergencyController.js';

const router = express.Router();

// Patient routes
router.post('/request', createEmergencyRequest);
router.get('/request/:requestId', getRequestDetails);
router.put('/request/:requestId/payment', updatePaymentStatus);

// Driver routes
router.post('/request/:requestId/accept', acceptRequest);
router.put('/request/:requestId/status', updateRequestStatus);

export default router; 