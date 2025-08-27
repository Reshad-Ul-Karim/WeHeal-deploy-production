import Subscription from '../models/subscriptionModel.js';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import { User } from '../models/userModel.js';
import Payment from '../models/paymentModel.js';
import { sendPaymentConfirmationEmail } from '../nodemailer/email.js';

// Create a new subscription
export const createSubscription = async (req, res) => {
  try {
    console.log('=== Creating Subscription ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User from request:', req.user ? req.user._id : 'No user found');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const userId = req.user._id;
    const {
      title,
      description,
      items,
      frequency,
      startDate,
      endDate,
      paymentMethod,
      savedPaymentInfo,
      shippingAddress,
      settings
    } = req.body;

    console.log('Subscription data:', { title, frequency, items: items?.length });
    console.log('Shipping address:', shippingAddress);

    // Validate required fields
    if (!title || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title and items are required'
      });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address is required'
      });
    }

    // Validate and populate product items
    const populatedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} is not available`
        });
      }

      // Only allow medicine products for subscriptions
      if (product.category !== 'medicine') {
        return res.status(400).json({
          success: false,
          message: 'Only medicine products can be added to subscriptions'
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      const itemTotal = product.price * item.quantity;
      populatedItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price
      });
      
      totalAmount += itemTotal;
    }

    // Calculate start date and next order date
    const subscriptionStartDate = startDate ? new Date(startDate) : new Date();
    const nextOrderDate = new Date(subscriptionStartDate);

    // Create subscription
    const subscription = new Subscription({
      userId,
      title,
      description: description || '',
      items: populatedItems,
      totalAmount,
      frequency: frequency || 'monthly',
      startDate: subscriptionStartDate,
      nextOrderDate,
      endDate: endDate ? new Date(endDate) : null,
      paymentMethod,
      savedPaymentInfo,
      shippingAddress,
      settings: {
        emailNotifications: settings?.emailNotifications !== false,
        smsNotifications: settings?.smsNotifications !== false,
        reminderDays: settings?.reminderDays || 2,
        autoRetryOnFailure: settings?.autoRetryOnFailure !== false,
        maxRetryAttempts: settings?.maxRetryAttempts || 3
      }
    });

    await subscription.save();
    console.log('Subscription saved successfully, attempting to populate...');
    
    try {
      await subscription.populate('items.productId');
      console.log('Subscription populated successfully');
    } catch (populateError) {
      console.error('Error during populate:', populateError);
      // Continue even if populate fails
    }

    console.log('Subscription created successfully:', subscription.subscriptionId);

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription',
      error: error.message
    });
  }
};

// Get user's subscriptions
export const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const subscriptions = await Subscription.find(query)
      .populate('items.productId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Subscription.countDocuments(query);

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: error.message
    });
  }
};

// Update subscription
export const updateSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const subscription = await Subscription.findOne({
      subscriptionId,
      userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'frequency', 'endDate', 
      'shippingAddress', 'settings', 'status'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        subscription[field] = updates[field];
      }
    });

    // Recalculate next order date if frequency changed
    if (updates.frequency) {
      subscription.nextOrderDate = subscription.calculateNextOrderDate();
    }

    await subscription.save();
    await subscription.populate('items.productId');

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: subscription
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subscription',
      error: error.message
    });
  }
};

// Pause/Resume subscription
export const toggleSubscriptionStatus = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user._id;
    const { action } = req.body; // 'pause' or 'resume'

    const subscription = await Subscription.findOne({
      subscriptionId,
      userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (action === 'pause' && subscription.status === 'active') {
      subscription.status = 'paused';
    } else if (action === 'resume' && subscription.status === 'paused') {
      subscription.status = 'active';
      // Reset next order date when resuming
      subscription.nextOrderDate = subscription.calculateNextOrderDate();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action or current status'
      });
    }

    await subscription.save();

    res.json({
      success: true,
      message: `Subscription ${action}d successfully`,
      data: subscription
    });

  } catch (error) {
    console.error('Error toggling subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subscription status',
      error: error.message
    });
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user._id;

    const subscription = await Subscription.findOne({
      subscriptionId,
      userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
};

// Process due subscriptions (cron job function)
export const processDueSubscriptions = async () => {
  try {
    console.log('=== Processing Due Subscriptions ===');
    
    const dueSubscriptions = await Subscription.findDueSubscriptions();
    console.log(`Found ${dueSubscriptions.length} due subscriptions`);

    for (const subscription of dueSubscriptions) {
      try {
        await processSubscriptionOrder(subscription);
      } catch (error) {
        console.error(`Error processing subscription ${subscription.subscriptionId}:`, error);
        
        // Add to order history as failed
        subscription.orderHistory.push({
          orderId: `FAILED-${Date.now()}`,
          orderDate: new Date(),
          amount: subscription.totalAmount,
          status: 'failed',
          failureReason: error.message
        });

        // Handle retry logic
        if (subscription.settings.autoRetryOnFailure) {
          const failedAttempts = subscription.orderHistory.filter(
            h => h.status === 'failed' && 
            new Date() - h.orderDate < 24 * 60 * 60 * 1000 // Last 24 hours
          ).length;

          if (failedAttempts >= subscription.settings.maxRetryAttempts) {
            subscription.status = 'paused';
            console.log(`Subscription ${subscription.subscriptionId} paused due to multiple failures`);
          }
        }

        await subscription.save();
      }
    }

    console.log('=== Subscription Processing Complete ===');
  } catch (error) {
    console.error('Error in processDueSubscriptions:', error);
  }
};

// Process individual subscription order
const processSubscriptionOrder = async (subscription) => {
  console.log(`Processing subscription order: ${subscription.subscriptionId}`);

  // Check stock availability
  for (const item of subscription.items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive || product.stock < item.quantity) {
      throw new Error(`Product ${item.name} is not available or insufficient stock`);
    }
  }

  // Create order
  const order = new Order({
    userId: subscription.userId,
    items: subscription.items,
    totalAmount: subscription.totalAmount,
    shippingAddress: subscription.shippingAddress,
    notes: `Subscription order for: ${subscription.title}`,
    paymentStatus: 'paid',
    status: 'confirmed',
    subscriptionId: subscription.subscriptionId,
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  await order.save();

  // Update product stock
  for (const item of subscription.items) {
    await Product.findByIdAndUpdate(
      item.productId,
      { $inc: { stock: -item.quantity } }
    );
  }

  // Create payment record
  await Payment.create({
    orderId: order.orderId,
    userId: subscription.userId,
    amount: subscription.totalAmount,
    paymentMethod: subscription.paymentMethod,
    paymentType: 'subscription',
    status: 'completed',
    transactionId: `SUB-TXN-${Date.now()}`,
    description: `Subscription payment for ${subscription.title}`,
    currency: 'INR'
  });

  // Add to subscription order history
  subscription.orderHistory.push({
    orderId: order.orderId,
    orderDate: new Date(),
    amount: subscription.totalAmount,
    status: 'success'
  });

  // Calculate next order date
  subscription.nextOrderDate = subscription.calculateNextOrderDate();

  // Check if subscription should end
  if (subscription.endDate && subscription.nextOrderDate > subscription.endDate) {
    subscription.status = 'expired';
  }

  await subscription.save();

  // Send confirmation email
  try {
    const user = await User.findById(subscription.userId);
    if (user && user.email) {
      const orderEmailData = {
        customerName: user.fullName || user.email,
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        paymentMethod: subscription.paymentMethod,
        transactionId: `SUB-TXN-${Date.now()}`,
        items: order.items,
        shippingAddress: order.shippingAddress,
        estimatedDelivery: order.estimatedDelivery,
        createdAt: order.createdAt
      };

      await sendPaymentConfirmationEmail(user.email, orderEmailData);
      console.log(`Subscription order confirmation email sent to: ${user.email}`);
    }
  } catch (emailError) {
    console.error('Error sending subscription order email:', emailError);
  }

  console.log(`Subscription order processed successfully: ${order.orderId}`);
  return order;
};

// Manual trigger for processing subscriptions
export const triggerSubscriptionProcessing = async (req, res) => {
  try {
    await processDueSubscriptions();
    
    res.json({
      success: true,
      message: 'Subscription processing triggered successfully'
    });
  } catch (error) {
    console.error('Error triggering subscription processing:', error);
    res.status(500).json({
      success: false,
      message: 'Error triggering subscription processing',
      error: error.message
    });
  }
};

// Get subscription details
export const getSubscriptionDetails = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user._id;

    const subscription = await Subscription.findOne({
      subscriptionId,
      userId
    }).populate('items.productId');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: subscription
    });

  } catch (error) {
    console.error('Error fetching subscription details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription details',
      error: error.message
    });
  }
};
