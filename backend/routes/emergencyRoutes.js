import express from 'express';
import multer from 'multer';
import path from 'path';
import { verifyToken } from '../middleware/verifyToken.js';
// Import controllers from Emergency module
import { 
  createEmergencyRequest, 
  acceptRequest, 
  updateRequestStatus, 
  getRequestDetails, 
  updatePaymentStatus 
} from '../controllers/emergency/emergencyController.js';
import {
  getDriverProfile,
  updateDriverProfile,
  getAllDrivers,
  uploadDriverProfilePicture
} from '../controllers/emergency/driverController.js';
import {
  updateRideDetails,
  getRideDetails,
  startRide,
  completeRide,
  updateRideProgress,
  calculateFare,
  getRideHistory
} from '../controllers/emergency/rideController.js';

const router = express.Router();

// Multer configuration for profile picture upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'driver-profile-' + uniqueSuffix + path.extname(file.originalname));
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

// Emergency routes
router.post('/request', verifyToken, createEmergencyRequest);
router.post('/accept', verifyToken, acceptRequest);
router.put('/status/:requestId', verifyToken, updateRequestStatus);
router.get('/details/:requestId', verifyToken, getRequestDetails);
router.put('/payment/:requestId', verifyToken, updatePaymentStatus);

// Driver profile routes
router.get('/driver/profile', verifyToken, getDriverProfile);
router.put('/driver/profile', verifyToken, updateDriverProfile);
router.post('/driver/upload-profile-picture', verifyToken, upload.single('profilePicture'), uploadDriverProfilePicture);
router.get('/drivers', verifyToken, getAllDrivers);

// Ride details routes
router.put('/ride/:requestId', verifyToken, updateRideDetails);
router.get('/ride/:requestId', verifyToken, getRideDetails);
router.post('/ride/:requestId/start', verifyToken, startRide);
router.post('/ride/:requestId/complete', verifyToken, completeRide);
router.put('/ride/:requestId/progress', verifyToken, updateRideProgress);
router.post('/ride/:requestId/fare', verifyToken, calculateFare);
router.get('/ride-history', verifyToken, getRideHistory);

// Debug endpoint for testing emergency broadcasts
router.get('/debug/test-broadcast', async (req, res) => {
  try {
    // Dynamic import to get the io instance
    const socketModule = await import('../socket.js');
    const io = socketModule.io || socketModule.default?.io;
    
    if (!io) {
      return res.status(500).json({
        success: false,
        message: 'Socket.IO not initialized'
      });
    }
    
    // Check drivers room
    const driversRoom = io.sockets.adapter.rooms.get('drivers');
    const driversCount = driversRoom ? driversRoom.size : 0;
    
    // Send test broadcast
    const testRequest = {
      id: 'test-' + Date.now(),
      location: 'Test Location, City',
      emergencyType: 'cardiac',
      description: 'This is a test emergency request for debugging',
      patientInfo: {
        name: 'Test Patient',
        phone: '1234567890',
        patientId: 'test-patient-id'
      }
    };
    
    console.log(`Sending test broadcast to ${driversCount} drivers`);
    io.to('drivers').emit('new_request', testRequest);
    
    res.json({
      success: true,
      message: 'Test emergency broadcast sent successfully',
      driversInRoom: driversCount,
      testRequest,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test broadcast:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test broadcast',
      error: error.message
    });
  }
});

export default router; 