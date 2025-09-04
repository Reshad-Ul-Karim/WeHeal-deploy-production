import OxygenCylinderOrder from '../models/oxygenCylinderOrderModel.js';
import { User } from '../models/userModel.js';

// Create a new oxygen cylinder order
export const createOrder = async (req, res) => {
  try {
    console.log('=== Creating oxygen cylinder order ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User object:', req.user);
    console.log('User ID:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      console.error('No user found in request');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const userId = req.user.id;
    const { planId, deliveryType, totalAmount, plan, delivery } = req.body;

    // Validate required fields
    if (!planId || !deliveryType || !totalAmount || !plan || !delivery) {
      console.log('Missing required fields:', { planId, deliveryType, totalAmount, plan: !!plan, delivery: !!delivery });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    console.log('Creating order with data:', {
      userId,
      planId,
      deliveryType,
      totalAmount,
      plan: plan.name,
      delivery: delivery.name
    });

    // Create the order
    const order = new OxygenCylinderOrder({
      userId,
      planId,
      deliveryType,
      totalAmount,
      plan,
      delivery,
      status: 'pending',
      payment: {
        status: 'pending'
      }
    });

    console.log('Order object created:', order);
    console.log('Attempting to save order...');
    
    await order.save();
    console.log('Order saved successfully with ID:', order._id);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('=== Error creating oxygen cylinder order ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Process payment for an order
export const processPayment = async (req, res) => {
  try {
    console.log('Processing payment with data:', req.body);
    
    const { orderId, paymentMethod, cardDetails, billingAddress, amount } = req.body;

    // Find the order
    const order = await OxygenCylinderOrder.findById(orderId);
    if (!order) {
      console.log('Order not found with ID:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('Found order:', order);

    // Update order with payment information
    order.payment = {
      method: paymentMethod,
      status: 'completed',
      paymentId: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      transactionId: cardDetails?.transactionId || `TXN-${Date.now()}`,
      transactionRef: cardDetails?.transactionRef || `REF-${Date.now()}`,
      paidAt: new Date()
    };

    order.billingAddress = billingAddress;
    order.status = 'confirmed';

    console.log('Updating order with payment info:', order.payment);
    await order.save();
    console.log('Order updated successfully');

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        paymentId: order.payment.paymentId,
        orderId: order._id,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

// Get order status
export const getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await OxygenCylinderOrder.findById(orderId)
      .populate('userId', 'name email phone')
      .populate('deliveredBy', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order status',
      error: error.message
    });
  }
};

// Get user's order history
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const orders = await OxygenCylinderOrder.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('deliveredBy', 'name');

    const total = await OxygenCylinderOrder.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get all orders (Admin)
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'billingAddress.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await OxygenCylinderOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name email phone')
      .populate('deliveredBy', 'name');

    const total = await OxygenCylinderOrder.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Update order status (Admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes, deliveryAddress } = req.body;
    const adminId = req.user.id;

    const order = await OxygenCylinderOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order
    order.status = status;
    order.adminNotes = notes;
    
    if (deliveryAddress) {
      order.deliveryAddress = deliveryAddress;
    }

    if (status === 'delivered') {
      order.actualDelivery = new Date();
      order.deliveredBy = adminId;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Get order statistics (Admin)
export const getOrderStats = async (req, res) => {
  try {
    const stats = await OxygenCylinderOrder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await OxygenCylinderOrder.countDocuments();
    const totalRevenue = await OxygenCylinderOrder.aggregate([
      {
        $match: { 'payment.status': 'completed' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    const planStats = await OxygenCylinderOrder.aggregate([
      {
        $group: {
          _id: '$plan.id',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusStats: stats,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        planStats
      }
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message
    });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await OxygenCylinderOrder.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this order'
      });
    }

    order.status = 'cancelled';
    order.customerNotes = req.body.reason || 'Cancelled by customer';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};
