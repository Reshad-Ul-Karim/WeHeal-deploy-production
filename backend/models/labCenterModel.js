import mongoose from 'mongoose';

const labCenterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  contactInfo: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    website: { type: String, default: '' }
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  facilities: [{
    type: String,
    enum: ['blood-collection', 'urine-collection', 'imaging', 'cardiology', 'pathology', 'radiology']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create indexes
labCenterSchema.index({ name: 'text', 'address.city': 1 });
labCenterSchema.index({ isActive: 1 });

export const LabCenter = mongoose.model('LabCenter', labCenterSchema);
