import mongoose from 'mongoose';

const flashSaleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    required: true,
    min: 0
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true,
    index: true
  },
  maxQuantity: {
    type: Number,
    default: null // null means unlimited
  },
  soldQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
flashSaleSchema.index({ isActive: 1, startTime: 1, endTime: 1 });
flashSaleSchema.index({ productId: 1, isActive: 1 });

// Virtual for checking if sale is currently running
flashSaleSchema.virtual('isRunning').get(function() {
  const now = new Date();
  return this.isActive && this.startTime <= now && this.endTime > now;
});

// Virtual for checking if sale has ended
flashSaleSchema.virtual('hasEnded').get(function() {
  const now = new Date();
  return this.endTime <= now;
});

// Virtual for checking if max quantity reached
flashSaleSchema.virtual('isSoldOut').get(function() {
  return this.maxQuantity && this.soldQuantity >= this.maxQuantity;
});

// Method to check if sale is available
flashSaleSchema.methods.isAvailable = function() {
  const now = new Date();
  return this.isActive && 
         this.startTime <= now && 
         this.endTime > now && 
         (!this.maxQuantity || this.soldQuantity < this.maxQuantity);
};

const FlashSale = mongoose.model('FlashSale', flashSaleSchema);

export default FlashSale;
