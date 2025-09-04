import mongoose from 'mongoose';

const oxygenCylinderOrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: false,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    id: {
      type: String,
      required: true,
      enum: ['daily', 'weekly', 'monthly']
    },
    name: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    urgentPrice: {
      type: Number,
      required: true
    },
    features: [String]
  },
  delivery: {
    id: {
      type: String,
      required: true,
      enum: ['standard', 'urgent']
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  },
  deliveryType: {
    type: String,
    required: true,
    enum: ['standard', 'urgent']
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'in-transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  payment: {
    method: {
      type: String,
      enum: ['card', 'mobile', 'bank'],
      required: false
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    paymentId: String,
    transactionId: String,
    transactionRef: String,
    paidAt: Date
  },
  billingAddress: {
    address: {
      type: String,
      required: false
    },
    city: {
      type: String,
      required: false
    },
    postalCode: {
      type: String,
      required: false
    },
    phone: {
      type: String,
      required: false
    }
  },
  deliveryAddress: {
    address: String,
    city: String,
    postalCode: String,
    phone: String,
    instructions: String
  },
  estimatedDelivery: {
    type: Date,
    required: false
  },
  actualDelivery: Date,
  deliveredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  customerNotes: String,
  adminNotes: String
}, {
  timestamps: true
});

// Generate order ID before saving
oxygenCylinderOrderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.orderId = `OXY-${timestamp}-${random}`;
  }
  
  // Set estimated delivery time
  if (!this.estimatedDelivery) {
    const now = new Date();
    if (this.deliveryType === 'urgent') {
      this.estimatedDelivery = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    } else {
      this.estimatedDelivery = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours
    }
  }
  
  next();
});

// Index for better query performance
oxygenCylinderOrderSchema.index({ userId: 1, createdAt: -1 });
oxygenCylinderOrderSchema.index({ status: 1 });
oxygenCylinderOrderSchema.index({ orderId: 1 });

const OxygenCylinderOrder = mongoose.model('OxygenCylinderOrder', oxygenCylinderOrderSchema);

export default OxygenCylinderOrder;
