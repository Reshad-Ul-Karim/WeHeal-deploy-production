import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { isDoctor } from '../middleware/roleMiddleware.js';
import {
  createPrescription,
  getDoctorPrescriptions,
  getPatientPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  generatePrescriptionPDF
} from '../controllers/prescriptionController.js';

const router = express.Router();

// All prescription routes require authentication
router.use(verifyToken);

// Test route to check if prescription system is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Prescription system is working',
    user: req.user ? {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role
    } : null,
    timestamp: new Date().toISOString()
  });
});

// Doctor routes
router.post('/create', isDoctor, createPrescription);
router.get('/doctor', isDoctor, getDoctorPrescriptions);
router.get('/doctor/:id', isDoctor, getPrescriptionById);
router.put('/:id', isDoctor, updatePrescription);
router.delete('/:id', isDoctor, deletePrescription);

// Patient routes
router.get('/patient', getPatientPrescriptions);
router.get('/patient/:id', getPrescriptionById);

// Generic fetch by ID (accessible to authenticated user; controller should enforce access)
router.get('/:id', getPrescriptionById);

// PDF generation (accessible by both doctor and patient)
router.get('/:id/pdf', generatePrescriptionPDF);

export default router;
