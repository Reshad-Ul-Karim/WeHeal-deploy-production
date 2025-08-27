import mongoose from 'mongoose';

const emergencyRequestSchema = new mongoose.Schema({
  // Unique identifier for the request
  requestId: {
    type: String,
    required: true,
    unique: true
  },
  // ID of the patient who created the request
  patientId: {
    type: String,
    required: true
  },
  // ID of the driver who accepted the request (if any)
  driverId: {
    type: String
  },
  // Patient information
  patientInfo: {
    name: String,
    phone: String,
    email: String
  },
  // Driver information (when assigned)
  driverInfo: {
    id: String,
    name: String,
    phone: String,
    vehicleType: String,
    vehicleNumber: String,
    location: String
  },
  // Location information
  location: {
    type: String,
    required: true
  },
  // Additional location coordinates (optional)
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  // Type of emergency
  emergencyType: {
    type: String,
    default: 'cardiac'
  },
  // Description of the emergency
  description: String,
  // Current status of the request
  status: {
    type: String,
    enum: [
      'pending',
      'accepted',
      'started_journey',
      'on_the_way',
      'almost_there',
      'looking_for_patient',
      'received_patient',
      'dropping_off',
      'completed',
      'cancelled'
    ],
    default: 'pending'
  },
  // Timestamps for status changes
  statusHistory: {
    pending: Date,
    accepted: Date,
    started_journey: Date,
    on_the_way: Date,
    almost_there: Date,
    looking_for_patient: Date,
    received_patient: Date,
    dropping_off: Date,
    completed: Date,
    cancelled: Date
  },
  // Payment information
  payment: {
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'insurance', ''],
      default: ''
    },
    amount: {
      type: Number,
      default: 0
    },
    paidAt: Date
  }
}, { timestamps: true });

const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);

export default EmergencyRequest; 