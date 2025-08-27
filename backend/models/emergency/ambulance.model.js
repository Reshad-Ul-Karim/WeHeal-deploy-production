import mongoose from 'mongoose';

const ambulanceSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['basic', 'advanced', 'mobile-icu', 'patient-transport'],
    default: 'basic'
  },
  capacity: {
    type: Number,
    default: 1
  },
  features: [{
    type: String
  }],
  maintenance: {
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
    status: {
      type: String,
      enum: ['operational', 'under-maintenance', 'out-of-service'],
      default: 'operational'
    }
  },
  currentDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  location: {
    latitude: Number,
    longitude: Number,
    lastUpdated: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Ambulance = mongoose.model('Ambulance', ambulanceSchema);

export default Ambulance; 