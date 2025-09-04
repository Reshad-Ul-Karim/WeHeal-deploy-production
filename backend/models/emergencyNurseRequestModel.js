import mongoose from 'mongoose';

const emergencyNurseRequestSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nurseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true,
    maxLength: 1000
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    default: 'medium'
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 1,
    max: 24,
    default: 1
  },
  preferredTime: {
    type: Date
  },
  location: {
    type: String,
    maxLength: 500
  },
  // Payment and revenue
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  amount: {
    type: Number,
    default: 0
  },
  nursePayout: {
    type: Number,
    default: 0
  },
  platformShare: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    maxLength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    maxLength: 500
  }
}, {
  timestamps: true
});

// Indexes for better query performance
emergencyNurseRequestSchema.index({ patientId: 1, createdAt: -1 });
emergencyNurseRequestSchema.index({ nurseId: 1, status: 1 });
emergencyNurseRequestSchema.index({ status: 1, urgency: 1 });

// Virtual for request duration
emergencyNurseRequestSchema.virtual('duration').get(function() {
  if (this.startedAt && this.completedAt) {
    return Math.round((this.completedAt - this.startedAt) / (1000 * 60)); // duration in minutes
  }
  return null;
});

// Method to check if request is active
emergencyNurseRequestSchema.methods.isActive = function() {
  return ['pending', 'accepted', 'in_progress'].includes(this.status);
};

// Method to get response time
emergencyNurseRequestSchema.methods.getResponseTime = function() {
  if (this.acceptedAt) {
    return Math.round((this.acceptedAt - this.createdAt) / (1000 * 60)); // response time in minutes
  }
  return null;
};

export const EmergencyNurseRequest = mongoose.model('EmergencyNurseRequest', emergencyNurseRequestSchema);
