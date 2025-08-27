import mongoose from 'mongoose';

const labTestReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true,
    index: true,
    default: function() {
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `LAB-${timestamp}-${random}`;
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
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  testCategory: {
    type: String,
    required: true,
    enum: ['lab-test']
  },
  testDetails: {
    testType: String,
    sampleType: String,
    preparationInstructions: String,
    reportDeliveryTime: String
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  testDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['ordered', 'sample-collected', 'processing', 'completed', 'cancelled'],
    default: 'ordered',
    index: true
  },
  reportStatus: {
    type: String,
    enum: ['pending', 'ready', 'not-available'],
    default: 'pending'
  },
  reportFile: {
    type: String,
    default: ''
  },
  reportUrl: {
    type: String,
    default: ''
  },
  reportGeneratedDate: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Create indexes for better performance
labTestReportSchema.index({ patientId: 1, status: 1 });
labTestReportSchema.index({ patientId: 1, reportStatus: 1 });
labTestReportSchema.index({ doctorId: 1, status: 1 });

export const LabTestReport = mongoose.model('LabTestReport', labTestReportSchema);
