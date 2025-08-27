import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  comments: {
    type: String,
    default: ''
  }
});

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    unique: true,
    index: true,
    default: function() {
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `PRES-${timestamp}-${random}`;
    }
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  symptoms: {
    type: String,
    default: ''
  },
  medications: [medicationSchema],
  recommendedTests: {
    type: String,
    default: ''
  },
  nextAppointment: {
    type: Date
  },
  extraInstructions: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Generate prescription ID before saving
prescriptionSchema.pre('save', function(next) {
  if (!this.prescriptionId) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.prescriptionId = `PRES-${timestamp}-${random}`;
  }
  next();
});

// Create indexes for better performance
prescriptionSchema.index({ patientId: 1, date: -1 });
prescriptionSchema.index({ doctorId: 1, date: -1 });
prescriptionSchema.index({ appointmentId: 1 });

export const Prescription = mongoose.model('Prescription', prescriptionSchema);
