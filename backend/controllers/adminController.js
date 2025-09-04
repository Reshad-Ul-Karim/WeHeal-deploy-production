import { User } from '../models/userModel.js';
import bcrypt from 'bcryptjs';

// Create a new user (admin only)
export const createUser = async (req, res) => {
  try {
    console.log('=== createUser called ===');
    console.log('Request body:', req.body);
    console.log('Request user:', req.user);
    
    const { name, email, password, role, isVerified = false, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      console.log('Missing required fields:', { name, email, password, role });
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with email:', email);
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate role
    const validRoles = ['Patient', 'Doctor', 'Nurse', 'ClinicStaff', 'CustomerCare'];
    if (!validRoles.includes(role)) {
      console.log('Invalid role:', role);
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: ' + validRoles.join(', ')
      });
    }

    console.log('Phone field received:', phone);
    console.log('Phone field type:', typeof phone);
    console.log('Phone field truthy check:', !!phone);

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user object with default phone if not provided
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      isVerified,
      isEmailVerified: true, // Admin-created users are automatically verified
      phone: phone || '+1234567890' // Provide default phone if not specified
    };

    console.log('User data being created:', userData);

    // Add role-specific details if needed
    if (role === 'Patient') {
      userData.patientDetails = {};
    } else if (role === 'Doctor') {
      userData.doctorDetails = {};
    } else if (role === 'Nurse') {
      userData.nurseDetails = {
        specialization: 'General',
        yearsOfExperience: 0,
        isAvailable: true,
        currentStatus: 'available',
        shift: 'morning',
        education: [],
        certifications: []
      };
    } else if (role === 'ClinicStaff') {
      userData.clinicStaffDetails = {};
    } else if (role === 'CustomerCare') {
      userData.customerCareDetails = {
        department: 'general',
        shift: 'morning',
        isAvailable: true,
        maxConcurrentChats: 3,
        currentChats: 0
      };
    }

    console.log('Final user data with role details:', userData);

    // Create and save user
    console.log('Attempting to create User model instance...');
    const newUser = new User(userData);
    console.log('User model instance created:', newUser);
    
    console.log('Attempting to save user...');
    await newUser.save();
    console.log('User saved successfully:', newUser._id);

    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// Ensure that the `getUsers` function is correctly implemented
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, data: { user } });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return res.status(500).json({ success: false, message: 'Error fetching user', error: error.message });
  }
};

export const updateUserById = async (req, res) => {
  try {
    const { name, email, phone, isVerified, role, patientDetails, doctorDetails, clinicStaffDetails, adminDetails } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (role !== undefined) user.role = role;
    if (patientDetails !== undefined) user.patientDetails = { ...user.patientDetails, ...patientDetails };
    if (doctorDetails !== undefined) user.doctorDetails = { ...user.doctorDetails, ...doctorDetails };
    if (clinicStaffDetails !== undefined) user.clinicStaffDetails = { ...user.clinicStaffDetails, ...clinicStaffDetails };
    if (adminDetails !== undefined) user.adminDetails = { ...user.adminDetails, ...adminDetails };
    await user.save();
    return res.json({ success: true, data: { user } });
  } catch (error) {
    console.error('Error updating user by ID:', error);
    return res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Prevent deleting the last admin
    if (user.role === 'Admin') {
      const adminCount = await User.countDocuments({ role: 'Admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user'
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    return res.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error deleting user', 
      error: error.message 
    });
  }
};
