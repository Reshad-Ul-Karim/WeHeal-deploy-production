import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['medicine', 'lab-test'],
    index: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    default: ''
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  manufacturer: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Medicine specific fields
  dosage: {
    type: String,
    default: ''
  },
  composition: {
    type: String,
    default: ''
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  // Lab test specific fields
  testType: {
    type: String,
    default: ''
  },
  preparationInstructions: {
    type: String,
    default: ''
  },
  reportDeliveryTime: {
    type: String,
    default: ''
  },
  sampleType: {
    type: String,
    default: ''
  },
  // Lab options for lab tests - array of lab choices with prices
  labOptions: [{
    labName: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }]
}, {
  timestamps: true
});

// Create indexes for better performance
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product;
