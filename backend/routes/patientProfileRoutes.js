import express from 'express';
import { 
  getPatientProfile, 
  updatePatientProfile, 
  changePassword, 
  uploadProfilePicture,
  upload 
} from '../controllers/patientProfileController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { isPatient } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get patient profile
router.get('/profile', isPatient, getPatientProfile);

// Update patient profile
router.put('/profile', isPatient, updatePatientProfile);

// Change password
router.put('/change-password', isPatient, changePassword);

// Upload profile picture
router.post('/upload-profile-picture', isPatient, upload.single('profilePicture'), uploadProfilePicture);

export default router;
