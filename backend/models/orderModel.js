import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    index: true,
    default: function() {
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `ORD-${timestamp}-${random}`;
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
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
    category: {
      type: String,
      required: true,
      enum: ['medicine', 'lab-test']
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
    },
    originalPrice: {
      type: Number,
      default: function() { return this.price; }
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    flashSaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FlashSale',
      default: null
    },
    // Lab option for lab test products
    labOption: {
      labName: {
        type: String,
        default: ''
      },
      price: {
        type: Number,
        default: 0
      }
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  originalAmount: {
    type: Number,
    min: 0
  },
  loyaltyPointsUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  couponApplied: {
    code: String,
    discount: Number,
    type: String
  },
  insuranceData: {
    provider: String,
    policyNumber: String,
    coverage: String,
    validTill: Date
  },
  status: {
    type: String,
    required: true,
    enum: [
      'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled',
      'received-request', 'processing-request', 'sent-for-sample-collection', 
      'sample-collected', 'report-delivered'
    ],
    default: 'pending',
    index: true
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  shippingAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'India'
    }
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  estimatedDelivery: {
    type: Date
  },
  trackingNumber: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  // Lab test report paths
  reportPaths: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    reportPath: {
      type: String,
      default: ''
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Add validation to ensure all items in an order are of the same category
orderSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    const categories = [...new Set(this.items.map(item => item.category))];
    if (categories.length > 1) {
      return next(new Error('Orders can only contain items of the same category (either all medicines or all lab tests)'));
    }
  }
  next();
});

// Generate order ID before saving (backup in case default doesn't work)
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderId = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Ensure orderId is always generated after save
orderSchema.post('save', function(doc) {
  if (!doc.orderId) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    doc.orderId = `ORD-${timestamp}-${random}`;
    // Update the document in the database
    doc.constructor.findByIdAndUpdate(doc._id, { orderId: doc.orderId }, { new: true })
      .then(updatedDoc => {
        console.log('Order ID updated after save:', updatedDoc.orderId);
      })
      .catch(err => {
        console.error('Error updating order ID after save:', err);
      });
  }
});

// Create indexes for better performance
orderSchema.index({ userId: 1, orderDate: -1 });
orderSchema.index({ status: 1, orderDate: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
