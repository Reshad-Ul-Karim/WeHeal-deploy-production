import mongoose from 'mongoose';

const labTestBookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    index: true,
    default: function() {
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `LAB-BOOK-${timestamp}-${random}`;
    }
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  labCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabCenter',
    required: true,
    index: true
  },
  pricingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTestPricing',
    required: true,
    index: true
  },
  preferredDate: {
    type: Date,
    required: true,
    index: true
  },
  preferredTimeSlot: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    default: 'morning'
  },
  actualAppointmentDate: {
    type: Date
  },
  actualAppointmentTime: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'received-request', 'processing-request', 'sent-for-sample-collection', 'sample-collected', 'report-delivered'],
    default: 'pending',
    index: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'cash', 'card'],
    default: 'online'
  },
  specialInstructions: {
    type: String,
    default: ''
  },
  homeCollection: {
    type: Boolean,
    default: false
  },
  homeCollectionAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    landmark: String
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  rescheduledFrom: {
    type: Date
  },
  rescheduledTo: {
    type: Date
  },
  rescheduleReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Create indexes for better performance
labTestBookingSchema.index({ patientId: 1, status: 1 });
labTestBookingSchema.index({ preferredDate: 1, labCenterId: 1 });
labTestBookingSchema.index({ bookingId: 1 });

export const LabTestBooking = mongoose.model('LabTestBooking', labTestBookingSchema);
