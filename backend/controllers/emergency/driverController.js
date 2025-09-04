import Driver from '../../models/emergency/driver.model.js';
import Ambulance from '../../models/emergency/ambulance.model.js';
import { User } from '../../models/userModel.js';
import { verifyToken } from '../../middleware/verifyToken.js';
import path from 'path';
import fs from 'fs';

// Get driver profile with vehicle details
export const getDriverProfile = async (req, res) => {
  try {
    const driverId = req.user._id;
    
    // First try to find in emergency Driver model
    let driver = await Driver.findById(driverId)
      .populate('vehicle', 'registrationNumber chassisNumber type')
      .select('-password');
    
    // If not found in emergency Driver model, create from User model
    if (!driver) {
      const user = await User.findById(driverId).select('-password');
      if (!user || user.role !== 'Driver') {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }
      
      // Create emergency driver record from user data
      const driverData = {
        driverId: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: user.password, // This will be hashed by the pre-save hook
        licenseNumber: user.driverDetails?.licenseNumber || '',
        vehicleType: user.driverDetails?.vehicleType || 'standard',
        vehicleNumber: user.driverDetails?.vehicleNumber || '',
        vehicleDetails: {
          registrationNumber: user.driverDetails?.vehicleNumber || '',
          chassisNumber: '',
          ambulanceType: user.driverDetails?.vehicleType || 'standard'
        },
        isOnline: false,
        rating: 0
      };
      
      driver = await Driver.create(driverData);
      console.log('Created emergency driver record from user data:', driver._id);
    }
    
    // Prepare driver profile with all required fields
    const driverProfile = {
      id: driver._id,
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      licenseNumber: driver.licenseNumber,
      vehicleType: driver.vehicleType,
      vehicleNumber: driver.vehicleNumber,
      carRegistration: driver.vehicle?.registrationNumber || driver.vehicleDetails?.registrationNumber,
      ambulanceType: driver.vehicle?.type || driver.vehicleDetails?.ambulanceType,
      chassisNumber: driver.vehicle?.chassisNumber || driver.vehicleDetails?.chassisNumber,
      isOnline: driver.isOnline,
      rating: driver.rating,
      profilePicture: driver.profilePicture ? `/uploads/profiles/${driver.profilePicture}` : null
    };
    
    res.status(200).json({
      success: true,
      message: 'Driver profile retrieved successfully',
      data: driverProfile
    });
  } catch (error) {
    console.error('Error getting driver profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get driver profile',
      error: error.message
    });
  }
};

// Update driver profile
export const updateDriverProfile = async (req, res) => {
  try {
    const driverId = req.user._id;
    const { 
      name, 
      phone, 
      email, 
      licenseNumber, 
      vehicleType, 
      vehicleNumber,
      carRegistration,
      ambulanceType,
      chassisNumber
    } = req.body;
    
    // First try to find in emergency Driver model
    let driver = await Driver.findById(driverId);
    
    // If not found in emergency Driver model, create from User model
    if (!driver) {
      const user = await User.findById(driverId).select('-password');
      if (!user || user.role !== 'Driver') {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }
      
      // Create emergency driver record from user data
      const driverData = {
        driverId: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: user.password, // This will be hashed by the pre-save hook
        licenseNumber: user.driverDetails?.licenseNumber || '',
        vehicleType: user.driverDetails?.vehicleType || 'standard',
        vehicleNumber: user.driverDetails?.vehicleNumber || '',
        vehicleDetails: {
          registrationNumber: user.driverDetails?.vehicleNumber || '',
          chassisNumber: '',
          ambulanceType: user.driverDetails?.vehicleType || 'standard'
        },
        isOnline: false,
        rating: 0
      };
      
      driver = await Driver.create(driverData);
      console.log('Created emergency driver record from user data for update:', driver._id);
    }
    
    const updateData = {};
    
    // Update basic driver info
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (licenseNumber) updateData.licenseNumber = licenseNumber;
    if (vehicleType) updateData.vehicleType = vehicleType;
    if (vehicleNumber) updateData.vehicleNumber = vehicleNumber;
    
    // Update vehicle details
    if (carRegistration || ambulanceType || chassisNumber) {
      updateData.vehicleDetails = {
        registrationNumber: carRegistration,
        chassisNumber: chassisNumber,
        ambulanceType: ambulanceType
      };
    }
    
    // If vehicle details are provided, also update/create ambulance record
    if (carRegistration && chassisNumber) {
      let ambulance = await Ambulance.findOne({ 
        registrationNumber: carRegistration 
      });
      
      if (!ambulance) {
        ambulance = await Ambulance.create({
          registrationNumber: carRegistration,
          chassisNumber: chassisNumber,
          type: ambulanceType || 'basic'
        });
      } else {
        // Update existing ambulance
        ambulance.chassisNumber = chassisNumber;
        if (ambulanceType) ambulance.type = ambulanceType;
        await ambulance.save();
      }
      
      updateData.vehicle = ambulance._id;
    }
    
    const updatedDriver = await Driver.findByIdAndUpdate(
      driverId,
      updateData,
      { new: true, runValidators: true }
    ).populate('vehicle', 'registrationNumber chassisNumber type');
    
    if (!updatedDriver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Prepare response with all profile fields
    const driverProfile = {
      id: updatedDriver._id,
      name: updatedDriver.name,
      phone: updatedDriver.phone,
      email: updatedDriver.email,
      licenseNumber: updatedDriver.licenseNumber,
      vehicleType: updatedDriver.vehicleType,
      vehicleNumber: updatedDriver.vehicleNumber,
      carRegistration: updatedDriver.vehicle?.registrationNumber || updatedDriver.vehicleDetails?.registrationNumber,
      ambulanceType: updatedDriver.vehicle?.type || updatedDriver.vehicleDetails?.ambulanceType,
      chassisNumber: updatedDriver.vehicle?.chassisNumber || updatedDriver.vehicleDetails?.chassisNumber,
      isOnline: updatedDriver.isOnline,
      rating: updatedDriver.rating
    };
    
    res.status(200).json({
      success: true,
      message: 'Driver profile updated successfully',
      data: driverProfile
    });
  } catch (error) {
    console.error('Error updating driver profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driver profile',
      error: error.message
    });
  }
};

// Get all drivers (for admin purposes)
export const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({})
      .populate('vehicle', 'registrationNumber chassisNumber type')
      .select('-password');
    
    const driversList = drivers.map(driver => ({
      id: driver._id,
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      licenseNumber: driver.licenseNumber,
      vehicleType: driver.vehicleType,
      vehicleNumber: driver.vehicleNumber,
      carRegistration: driver.vehicle?.registrationNumber || driver.vehicleDetails?.registrationNumber,
      ambulanceType: driver.vehicle?.type || driver.vehicleDetails?.ambulanceType,
      chassisNumber: driver.vehicle?.chassisNumber || driver.vehicleDetails?.chassisNumber,
      isOnline: driver.isOnline,
      rating: driver.rating,
      createdAt: driver.createdAt
    }));
    
    res.status(200).json({
      success: true,
      message: 'Drivers list retrieved successfully',
      data: driversList
    });
  } catch (error) {
    console.error('Error getting all drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get drivers list',
      error: error.message
    });
  }
};

// Upload driver profile picture
export const uploadDriverProfilePicture = async (req, res) => {
  try {
    console.log('=== uploadDriverProfilePicture called ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('User from middleware:', req.user);
    console.log('User ID:', req.user?._id);
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No profile picture file provided'
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, and GIF images are allowed'
      });
    }

    // Validate file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB'
      });
    }

    // Get current driver profile
    console.log('Looking for driver with ID:', req.user._id);
    let driver = await Driver.findById(req.user._id);
    console.log('Driver found in emergency model:', !!driver);
    
    // If not found in emergency Driver model, create from User model
    if (!driver) {
      console.log('Driver not found in emergency model, checking User model...');
      const user = await User.findById(req.user._id).select('-password');
      console.log('User found:', !!user, user?.role);
      
      if (!user || user.role !== 'Driver') {
        console.log('User not found or not a driver');
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }
      
      // Create emergency driver record from user data
      const driverData = {
        driverId: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: user.password, // This will be hashed by the pre-save hook
        licenseNumber: user.driverDetails?.licenseNumber || '',
        vehicleType: user.driverDetails?.vehicleType || 'standard',
        vehicleNumber: user.driverDetails?.vehicleNumber || '',
        vehicleDetails: {
          registrationNumber: user.driverDetails?.vehicleNumber || '',
          chassisNumber: '',
          ambulanceType: user.driverDetails?.vehicleType || 'standard'
        },
        isOnline: false,
        rating: 0
      };
      
      driver = await Driver.create(driverData);
      console.log('Created emergency driver record from user data for profile picture upload:', driver._id);
    }

    // Delete old profile picture if it exists
    if (driver.profilePicture) {
      const oldFilePath = path.join(process.cwd(), 'uploads', 'profiles', driver.profilePicture);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update driver's profile picture
    driver.profilePicture = req.file.filename;
    await driver.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      profilePicture: `/uploads/profiles/${req.file.filename}`
    });
  } catch (error) {
    console.error('Error in uploadDriverProfilePicture:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading profile picture',
      error: error.message
    });
  }
};
