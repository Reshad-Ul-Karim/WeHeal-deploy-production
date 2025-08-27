import express from 'express';
import { 
  getPatientLabTests, 
  getPatientLabReports, 
  createLabTestOrder, 
  updateLabTestStatus 
} from '../controllers/labTestReportController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { isPatient, isDoctor } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Patient routes
router.get('/patient/tests', verifyToken, isPatient, getPatientLabTests);
router.get('/patient/reports', verifyToken, isPatient, getPatientLabReports);
router.post('/patient/order', verifyToken, isPatient, createLabTestOrder);

// Admin/Doctor routes for updating status
router.put('/:reportId/status', verifyToken, isDoctor, updateLabTestStatus);

export default router;
