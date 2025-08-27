import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { isPatient } from '../middleware/roleMiddleware.js';
import {
  initConsultationPayment,
  completeConsultationPayment,
  getConsultationPaymentStatus,
  getConsultationPaymentHistory
} from '../controllers/consultationPaymentController.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Patient routes
router.post('/init', isPatient, initConsultationPayment);
router.post('/complete', isPatient, completeConsultationPayment);
router.get('/status/:appointmentId', isPatient, getConsultationPaymentStatus);
router.get('/history', isPatient, getConsultationPaymentHistory);

export default router;
