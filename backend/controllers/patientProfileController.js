import { User } from '../models/userModel.js';
import bcryptjs from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Get patient profile
export const getPatientProfile = async (req, res) => {
  try {
    const patient = await User.findById(req.user._id)
      .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationExpires');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Construct full profile picture URL if profile picture exists
    let profileData = patient.toObject();
    if (profileData.profilePicture) {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://weheal-backend.onrender.com' 
        : 'http://localhost:5001';
      profileData.profilePicture = `${baseUrl}/uploads/profiles/${profileData.profilePicture}`;
    }

    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Error in getPatientProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient profile',
      error: error.message
    });
  }
};

// Update patient profile
export const updatePatientProfile = async (req, res) => {
  try {
    const { 
      name, 
      phone, 
      age, 
      weight, 
      height, 
      address, 
      bloodGroup,
      emergencyContact,
      medicalHistory,
      allergies,
      currentMedications,
      billing,
      paymentMethods
    } = req.body;

    const patient = await User.findById(req.user._id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Update basic info
    if (name !== undefined) patient.name = name;
    if (phone !== undefined) patient.phone = phone;

    // Update patient details
    if (!patient.patientDetails) patient.patientDetails = {};
    
    if (age !== undefined && age !== '') patient.patientDetails.age = age;
    if (weight !== undefined && weight !== '') patient.patientDetails.weight = weight;
    if (height !== undefined && height !== '') patient.patientDetails.height = height;
    if (address !== undefined) patient.patientDetails.address = address;
    // Only set bloodGroup if it's not empty
    if (bloodGroup !== undefined && bloodGroup !== '') {
      patient.patientDetails.bloodGroup = bloodGroup;
    }
    if (emergencyContact !== undefined) patient.patientDetails.emergencyContact = emergencyContact;
    if (medicalHistory !== undefined) patient.patientDetails.medicalHistory = medicalHistory;
    if (allergies !== undefined) patient.patientDetails.allergies = allergies;
    if (currentMedications !== undefined) patient.patientDetails.currentMedications = currentMedications;

    // Update billing details
    if (billing) {
      if (!patient.billing) patient.billing = {};
      if (billing.insurance !== undefined) patient.billing.insurance = billing.insurance;
      if (billing.shippingAddress !== undefined) patient.billing.shippingAddress = billing.shippingAddress;
    }

    // Update saved payment methods (only masked/non-sensitive)
    if (paymentMethods) {
      if (!patient.paymentMethods) patient.paymentMethods = {};
      if (paymentMethods.bankAccounts !== undefined) patient.paymentMethods.bankAccounts = paymentMethods.bankAccounts;
      if (paymentMethods.cards !== undefined) patient.paymentMethods.cards = paymentMethods.cards;
      if (paymentMethods.mobileWallets !== undefined) patient.paymentMethods.mobileWallets = paymentMethods.mobileWallets;
    }

    await patient.save();

    // Return updated profile without sensitive data
    const updatedPatient = await User.findById(req.user._id)
      .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationExpires');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedPatient
    });
  } catch (error) {
    console.error('Error in updatePatientProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating patient profile',
      error: error.message
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const patient = await User.findById(req.user._id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, patient.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    const isSamePassword = await bcryptjs.compare(newPassword, patient.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as current password'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcryptjs.hash(newPassword, 10);
    patient.password = hashedNewPassword;
    await patient.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error in changePassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// Upload profile picture
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const patient = await User.findById(req.user._id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Delete old profile picture if exists
    if (patient.profilePicture) {
      const oldFilePath = path.join(process.cwd(), 'uploads', 'profiles', patient.profilePicture);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update profile picture path
    patient.profilePicture = req.file.filename;
    await patient.save();

    // Return full URL for the uploaded profile picture
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://weheal-backend.onrender.com' 
      : 'http://localhost:5001';
    
    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePicture: `${baseUrl}/uploads/profiles/${req.file.filename}`
    });
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading profile picture',
      error: error.message
    });
  }
};

// Multer configuration for profile picture upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'profiles');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});
