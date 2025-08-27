import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

export const signup = async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    phone, 
    role,
    driverDetails 
  } = req.body;

  try {
    // Basic validation
    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    // Driver-specific validation
    if (role === 'Driver') {
      if (!driverDetails || 
          !driverDetails.licenseNumber || 
          !driverDetails.vehicleType || 
          !driverDetails.vehicleNumber || 
          !driverDetails.yearsOfExperience) {
        return res.status(400).json({
          success: false,
          message: "Driver details are required"
        });
      }

      // Validate vehicle type
      if (!['Ambulance', 'Medical Van'].includes(driverDetails.vehicleType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid vehicle type"
        });
      }

      // Validate years of experience
      if (driverDetails.yearsOfExperience < 0 || driverDetails.yearsOfExperience > 50) {
        return res.status(400).json({
          success: false,
          message: "Years of experience must be between 0 and 50"
        });
      }
    }

    const userAlreadyExists = await User.findOne({ email });
    if (userAlreadyExists) {
      return res.status(400).json({ 
        success: false, 
        message: "User already exists" 
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const userData = {
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      isVerified: true // For emergency system, we'll skip email verification
    };

    // Add driver details if role is Driver
    if (role === 'Driver') {
      userData.driverDetails = {
        licenseNumber: driverDetails.licenseNumber,
        vehicleType: driverDetails.vehicleType,
        vehicleNumber: driverDetails.vehicleNumber,
        yearsOfExperience: driverDetails.yearsOfExperience,
        isAvailable: true,
        currentLocation: {
          type: 'Point',
          coordinates: [0, 0] // Default coordinates
        }
      };
    }

    const user = await User.create(userData);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(role === 'Driver' && {
          driverDetails: {
            licenseNumber: user.driverDetails.licenseNumber,
            vehicleType: user.driverDetails.vehicleType,
            vehicleNumber: user.driverDetails.vehicleNumber,
            yearsOfExperience: user.driverDetails.yearsOfExperience,
            isAvailable: user.driverDetails.isAvailable
          }
        })
      }
    });
  } catch (error) {
    console.error("Error in signup controller:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};

export const login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Check if user role matches
    if (user.role !== role) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid credentials for ${role}` 
      });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};

export const logout = async (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: "Logged out successfully" 
  });
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      user 
    });
  } catch (error) {
    console.error("Error in checkAuth:", error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
}; 