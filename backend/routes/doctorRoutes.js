import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/authMiddleware.js';
import { isDoctor } from '../middleware/roleMiddleware.js';
import { 
  getDoctorDashboard, 
  getDoctorAvailability,
  updateDoctorAvailability,
  getAllDoctorAvailability,
  getPatientDetails,
  migrateDoctorAvailability,
  getAppointmentDetails
} from '../controllers/doctorController.js';
import {
  getDoctorProfile,
  updateDoctorProfile,
  getSpecializations,
  uploadDoctorProfilePicture
} from '../controllers/doctorProfileController.js';

const router = express.Router();

// Multer configuration for profile picture upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'), false);
    }
  }
});

// All routes are protected and require doctor role
router.use(protect);
router.use(isDoctor);

// Doctor dashboard route
router.get('/dashboard', getDoctorDashboard);

// Doctor availability routes
router.get('/availability', getAllDoctorAvailability);
router.get('/availability/:dayOfWeek', getDoctorAvailability);
router.put('/availability/:dayOfWeek', updateDoctorAvailability);
router.post('/availability/migrate', migrateDoctorAvailability);

// Doctor profile routes
router.get('/profile', getDoctorProfile);
router.put('/profile', updateDoctorProfile);
router.get('/specializations', getSpecializations);
router.post('/upload-profile-picture', upload.single('profilePicture'), uploadDoctorProfilePicture);

// Patient details route
router.get('/patient/:patientId', getPatientDetails);

// Appointment details route
router.get('/appointment/:appointmentId', getAppointmentDetails);

export default router; 