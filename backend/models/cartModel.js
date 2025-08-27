import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
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
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
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
    },
    // Flash sale information
    originalPrice: {
      type: Number,
      default: null
    },
    isFlashSale: {
      type: Boolean,
      default: false
    },
    flashSaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FlashSale',
      default: null
    },
    discountPercentage: {
      type: Number,
      default: 0
    }
  }],
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Calculate total amount before saving
cartSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
