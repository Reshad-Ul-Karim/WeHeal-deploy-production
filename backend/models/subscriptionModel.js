import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  subscriptionId: {
    type: String,
    unique: true,
    required: true,
    default: () => `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  frequency: {
    type: String,
    enum: ['monthly', 'bi-weekly', 'weekly', 'biweekly', 'quarterly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true
  },
  nextOrderDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    default: null // null means indefinite
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'expired'],
    default: 'active',
    index: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet']
  },
  savedPaymentInfo: {
    type: {
      type: String,
      enum: ['card', 'upi', 'wallet'],
      required: true
    },
    last4: String, // Last 4 digits for cards
    brand: String, // Visa, Mastercard, etc.
    upiId: String, // For UPI payments
    walletProvider: String, // PayTM, PhonePe, etc.
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    landmark: String,
    instructions: String
  },
  orderHistory: [{
    orderId: {
      type: String,
      required: true
    },
    orderDate: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      required: true
    },
    failureReason: String
  }],
  settings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: true
    },
    reminderDays: {
      type: Number,
      default: 2,
      min: 0,
      max: 7
    },
    autoRetryOnFailure: {
      type: Boolean,
      default: true
    },
    maxRetryAttempts: {
      type: Number,
      default: 3,
      min: 1,
      max: 5
    }
  },
  metadata: {
    createdBy: {
      type: String,
      default: 'patient'
    },
    lastModified: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ nextOrderDate: 1, status: 1 });
subscriptionSchema.index({ 'items.productId': 1 });

// Pre-save middleware to update lastModified and increment version
subscriptionSchema.pre('save', function(next) {
  this.metadata.lastModified = new Date();
  if (!this.isNew) {
    this.metadata.version += 1;
  }
  next();
});

// Method to calculate next order date based on frequency
subscriptionSchema.methods.calculateNextOrderDate = function() {
  const currentDate = this.nextOrderDate || new Date();
  let nextDate = new Date(currentDate);
  
  switch (this.frequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'bi-weekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  return nextDate;
};

// Method to check if subscription should be processed
subscriptionSchema.methods.shouldProcessOrder = function() {
  if (this.status !== 'active') return false;
  if (this.endDate && new Date() > this.endDate) return false;
  return new Date() >= this.nextOrderDate;
};

// Static method to find due subscriptions
subscriptionSchema.statics.findDueSubscriptions = function() {
  return this.find({
    status: 'active',
    nextOrderDate: { $lte: new Date() },
    $or: [
      { endDate: null },
      { endDate: { $gt: new Date() } }
    ]
  }).populate('userId items.productId');
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
