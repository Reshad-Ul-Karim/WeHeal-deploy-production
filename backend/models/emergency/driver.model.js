import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const driverSchema = new mongoose.Schema({
  // Link to user in main User model
  driverId: {
    type: String,
    required: [true, 'Driver ID is required'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required']
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ambulance'
  },
  vehicleType: {
    type: String,
    enum: ['standard', 'advanced', 'specialized', 'helicopter', 'vip'],
    default: 'standard'
  },
  vehicleNumber: {
    type: String
  },
  // Additional vehicle details for quick access
  vehicleDetails: {
    registrationNumber: String,
    chassisNumber: String,
    ambulanceType: String
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    lastUpdated: Date
  },
  rating: {
    type: Number,
    default: 0
  },
  socketId: {
    type: String,
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving
driverSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcryptjs.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
driverSchema.methods.comparePassword = async function(password) {
  return await bcryptjs.compare(password, this.password);
};

// Method to generate auth token
driverSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { _id: this._id, role: 'driver' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const Driver = mongoose.model('Driver', driverSchema);

export default Driver; 