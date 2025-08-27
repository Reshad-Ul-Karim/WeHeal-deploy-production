import mongoose from 'mongoose';

const labTestPricingSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0,
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  sampleCollectionTime: {
    type: String,
    default: '8:00 AM - 10:00 AM'
  },
  reportDeliveryTime: {
    type: String,
    default: '24-48 hours'
  },
  specialInstructions: {
    type: String,
    default: ''
  },
  homeCollectionAvailable: {
    type: Boolean,
    default: false
  },
  homeCollectionCharge: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create compound index for unique product-lab center combinations
labTestPricingSchema.index({ productId: 1, labCenterId: 1 }, { unique: true });
labTestPricingSchema.index({ isAvailable: 1, price: 1 });

export const LabTestPricing = mongoose.model('LabTestPricing', labTestPricingSchema);
