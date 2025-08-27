import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Patient', 'Driver'],
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  driverDetails: {
    licenseNumber: {
      type: String,
      required: function() {
        return this.role === 'Driver';
      }
    },
    vehicleType: {
      type: String,
      enum: ['Ambulance', 'Medical Van'],
      required: function() {
        return this.role === 'Driver';
      }
    },
    vehicleNumber: {
      type: String,
      required: function() {
        return this.role === 'Driver';
      }
    },
    yearsOfExperience: {
      type: Number,
      required: function() {
        return this.role === 'Driver';
      }
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for geospatial queries
userSchema.index({ 'driverDetails.currentLocation': '2dsphere' });

export const User = mongoose.model('User', userSchema); 