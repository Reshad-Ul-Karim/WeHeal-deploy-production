import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ userId }).populate('items.productId');
    
    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }

    // Filter out any items with deleted products
    cart.items = cart.items.filter(item => item.productId && item.productId.isActive);
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: error.message
    });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1, labOption, flashSaleData } = req.body;

    // Validate product
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate lab option for lab test products
    if (product.category === 'lab-test') {
      if (!labOption || !labOption.labName || !labOption.price) {
        return res.status(400).json({
          success: false,
          message: 'Lab option is required for lab test products'
        });
      }

      // Validate that the lab option exists in the product's lab options
      const validLabOption = product.labOptions.find(
        option => option.labName === labOption.labName && option.price === labOption.price
      );

      if (!validLabOption) {
        return res.status(400).json({
          success: false,
          message: 'Invalid lab option selected'
        });
      }
    }

    // Check stock (for medicines only, lab tests have unlimited stock)
    if (product.category === 'medicine' && product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if cart already has items of a different category
    if (cart.items.length > 0) {
      const existingItem = await Product.findById(cart.items[0].productId);
      if (existingItem && existingItem.category !== product.category) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${product.category === 'medicine' ? 'medicine' : 'lab test'} to cart. Cart already contains ${existingItem.category === 'medicine' ? 'medicines' : 'lab tests'}. Please complete your current order or clear the cart first.`
        });
      }
    }

    // Check if item already exists in cart
    // For lab tests, also check if the lab option is the same
    const existingItemIndex = cart.items.findIndex(item => {
      if (item.productId.toString() === productId) {
        if (product.category === 'lab-test') {
          // For lab tests, check if both product and lab option match
          return item.labOption && labOption && 
                 item.labOption.labName === labOption.labName && 
                 item.labOption.price === labOption.price;
        } else {
          // For medicines, just check product ID
          return true;
        }
      }
      return false;
    });

    if (existingItemIndex > -1) {
      // Update quantity for existing item
      const newQuantity = cart.items[existingItemIndex].quantity + parseInt(quantity);
      
      if (product.category === 'medicine' && newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      const newItem = {
        productId,
        quantity: parseInt(quantity),
        price: flashSaleData ? flashSaleData.salePrice : (product.category === 'lab-test' ? labOption.price : product.price)
      };

      // Add lab option for lab test products
      if (labOption) {
        newItem.labOption = labOption;
      }

      // Add flash sale data if provided
      if (flashSaleData) {
        newItem.originalPrice = product.price;
        newItem.isFlashSale = true;
        newItem.flashSaleId = flashSaleData.flashSaleId;
        newItem.discountPercentage = flashSaleData.discountPercentage;
      }

      cart.items.push(newItem);
    }

    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding item to cart',
      error: error.message
    });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity, labOption } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Validate product and stock
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.category === 'medicine' && product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    // Update cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find item by product ID and lab option (for lab tests)
    const itemIndex = cart.items.findIndex(item => {
      if (item.productId.toString() === productId) {
        if (product.category === 'lab-test') {
          // For lab tests, check if both product and lab option match
          return item.labOption && labOption && 
                 item.labOption.labName === labOption.labName && 
                 item.labOption.price === labOption.price;
        } else {
          // For medicines, just check product ID
          return true;
        }
      }
      return false;
    });

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    cart.items[itemIndex].quantity = parseInt(quantity);
    
    // Update price based on category
    if (product.category === 'lab-test' && labOption) {
      cart.items[itemIndex].price = labOption.price;
    } else {
      cart.items[itemIndex].price = product.price;
    }

    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: cart
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart',
      error: error.message
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { labOption } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Get product to determine category
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Filter items based on product ID and lab option (for lab tests)
    cart.items = cart.items.filter(item => {
      if (item.productId.toString() !== productId) {
        return true; // Keep items with different product IDs
      }
      
      if (product.category === 'lab-test') {
        // For lab tests, only remove if lab option matches
        return !(item.labOption && labOption && 
                item.labOption.labName === labOption.labName && 
                item.labOption.price === labOption.price);
      } else {
        // For medicines, remove all items with this product ID
        return false;
      }
    });

    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item from cart',
      error: error.message
    });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message
    });
  }
};
