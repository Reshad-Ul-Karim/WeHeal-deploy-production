import Order from '../models/orderModel.js';
import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';
import FlashSale from '../models/flashSaleModel.js';
import { LabTestReport } from '../models/labTestReportModel.js';
import Payment from '../models/paymentModel.js';
import { User } from '../models/userModel.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { sendPaymentConfirmationEmail } from '../nodemailer/email.js';

// Add debugging for model import
console.log('=== Order Controller Import Debug ===');
console.log('Payment model imported:', Payment);
console.log('Payment model name:', Payment?.modelName);
console.log('Payment model schema:', Payment?.schema);
console.log('Payment model db:', Payment?.db);
console.log('=== End Import Debug ===');

// Create new order
export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, notes = '' } = req.body;

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address is required'
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate stock for all items
    for (const item of cart.items) {
      if (!item.productId || !item.productId.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId?.name || 'Unknown'} is no longer available`
        });
      }
      
      if (item.productId.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.productId.name}`
        });
      }
    }

    // Create order items with flash sale price handling
    const now = new Date();
    const orderItems = [];
    
    for (const item of cart.items) {
      // Check for active flash sale
      const flashSale = await FlashSale.findOne({
        productId: item.productId._id,
        isActive: true,
        startTime: { $lte: now },
        endTime: { $gt: now }
      });

      let effectivePrice = item.price;
      let flashSaleId = null;
      let originalPrice = item.price;

      // Apply flash sale price if available and valid
      if (flashSale && flashSale.isAvailable()) {
        effectivePrice = flashSale.salePrice;
        flashSaleId = flashSale._id;
        originalPrice = flashSale.originalPrice;
        
        // Update flash sale sold quantity
        await FlashSale.findByIdAndUpdate(
          flashSale._id,
          { $inc: { soldQuantity: item.quantity } }
        );
      }

      orderItems.push({
        productId: item.productId._id,
        name: item.productId.name,
        category: item.productId.category,
        quantity: item.quantity,
        price: effectivePrice,
        originalPrice: originalPrice,
        total: effectivePrice * item.quantity,
        flashSaleId: flashSaleId,
        // Include lab option data for lab test products
        labOption: item.labOption || null
      });
    }

    // Calculate total amount
    const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

    // Check if order contains lab tests
    const hasLabTests = orderItems.some(item => item.category === 'lab-test');
    
    // Create order
    const order = new Order({
      userId,
      items: orderItems,
      totalAmount,
      shippingAddress,
      notes,
      estimatedDelivery: hasLabTests ? 
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) : // 2 days for lab tests
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)   // 7 days for medicines
    });

    await order.save();

    // Handle lab test orders
    if (hasLabTests) {
      for (const item of orderItems) {
        if (item.category === 'lab-test') {
          // Create lab test report entry
          const labTestReport = new LabTestReport({
            patientId: userId,
            doctorId: req.user._id, // For now, using the patient as the doctor (can be updated later)
            testName: item.name,
            testCategory: 'lab-test',
            testDetails: {
              testType: item.productId.testType || '',
              sampleType: item.productId.sampleType || '',
              preparationInstructions: item.productId.preparationInstructions || '',
              reportDeliveryTime: item.productId.reportDeliveryTime || ''
            },
            price: item.price,
            status: 'ordered',
            reportStatus: 'pending'
          });
          
          await labTestReport.save();
        }
      }
    }

    // Update product stock (only for medicines)
    for (const item of cart.items) {
      if (item.productId.category !== 'lab-test') {
        await Product.findByIdAndUpdate(
          item.productId._id,
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    // Populate order items for response
    await order.populate('items.productId');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Create order AFTER successful payment
export const createOrderAfterPayment = async (req, res) => {
  try {
    console.log('=== createOrderAfterPayment START ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user._id);
    
    const userId = req.user._id;
    const { 
      shippingAddress, 
      notes = '', 
      payment,
      loyaltyPointsUsed = 0,
      couponApplied = null,
      insuranceData = null,
      amount,
      originalAmount
    } = req.body;

    console.log('Extracted data:', { 
      userId, 
      shippingAddress, 
      payment, 
      loyaltyPointsUsed, 
      couponApplied, 
      insuranceData, 
      amount, 
      originalAmount 
    });

    if (!payment || !payment.transactionId || !payment.paymentMethod) {
      console.log('Payment validation failed:', { payment });
      return res.status(400).json({ success: false, message: 'Valid payment details are required' });
    }

    // Get user's cart
    console.log('Fetching cart for user:', userId);
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    console.log('Cart found:', cart ? `Items: ${cart.items.length}` : 'No cart found');
    
    if (!cart || cart.items.length === 0) {
      console.log('Cart is empty or not found');
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    console.log('Cart items:', cart.items.map(item => ({
      productId: item.productId?._id,
      name: item.productId?.name,
      category: item.productId?.category,
      quantity: item.quantity,
      price: item.price
    })));

    // Validate stock
    console.log('Validating stock for items...');
    for (const item of cart.items) {
      if (!item.productId || !item.productId.isActive) {
        console.log('Product validation failed for item:', item);
        return res.status(400).json({ success: false, message: `Product ${item.productId?.name || 'Unknown'} is no longer available` });
      }
      if (item.productId.stock < item.quantity) {
        console.log('Insufficient stock for item:', item);
        return res.status(400).json({ success: false, message: `Insufficient stock for ${item.productId.name}` });
      }
    }
    console.log('Stock validation passed');

    const orderItems = cart.items.map(item => ({
      productId: item.productId._id,
      name: item.productId.name,
      category: item.productId.category,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
      labOption: item.labOption || null,
    }));
    
    const totalAmount = orderItems.reduce((sum, i) => sum + i.total, 0);
    const hasLabTests = orderItems.some(item => item.category === 'lab-test');
    
    console.log('Order items prepared:', orderItems);
    console.log('Total amount:', totalAmount);
    console.log('Has lab tests:', hasLabTests);

    // Create order marked as paid and confirmed
    console.log('Creating order object...');
    
    // Validate required fields before creating order
    if (!userId) {
      console.error('User ID is missing');
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.zipCode) {
      console.error('Invalid shipping address:', shippingAddress);
      return res.status(400).json({ success: false, message: 'Complete shipping address is required' });
    }
    
    if (!orderItems || orderItems.length === 0) {
      console.error('Order items are missing or empty');
      return res.status(400).json({ success: false, message: 'Order items are required' });
    }
    
    let order;
    try {
      order = new Order({
        userId,
        items: orderItems,
        totalAmount: amount || totalAmount,
        originalAmount: originalAmount || totalAmount,
        shippingAddress,
        notes,
        paymentStatus: 'paid',
        status: 'confirmed',
        loyaltyPointsUsed,
        couponApplied,
        insuranceData,
        estimatedDelivery: hasLabTests ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      
      console.log('Order object created, saving to database...');
      console.log('Order object before save:', {
        userId: order.userId,
        itemsCount: order.items.length,
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress
      });
      
      // Save the order first to ensure orderId is generated
      await order.save();
      
      // Ensure orderId is available
      if (!order.orderId) {
        console.error('Order ID not generated after save');
        return res.status(500).json({ success: false, message: 'Failed to generate order ID' });
      }
      
      // Verify the order was actually saved to the database
      const savedOrder = await Order.findById(order._id);
      if (!savedOrder) {
        console.error('Order not found in database after save');
        return res.status(500).json({ success: false, message: 'Order was not saved to database' });
      }
      
      console.log('Order saved successfully with ID:', order.orderId);
      console.log('Order object after save:', {
        _id: order._id,
        orderId: order.orderId,
        userId: order.userId,
        totalAmount: order.totalAmount,
        status: order.status
      });
    } catch (orderSaveError) {
      console.error('Error saving order to database:', orderSaveError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to save order to database', 
        error: orderSaveError.message,
        errorType: orderSaveError.name
      });
    }

    // Handle lab test entries
    if (hasLabTests) {
      console.log('Processing lab test entries...');
      try {
        for (const item of orderItems) {
          if (item.category === 'lab-test') {
            const labTestReport = new LabTestReport({
              patientId: userId,
              doctorId: req.user._id,
              testName: item.name,
              testCategory: 'lab-test',
              testDetails: {
                testType: item.productId?.testType || '',
                sampleType: item.productId?.sampleType || '',
                preparationInstructions: item.productId?.preparationInstructions || '',
                reportDeliveryTime: item.productId?.reportDeliveryTime || '',
              },
              price: item.price,
              status: 'ordered',
              reportStatus: 'pending',
            });
            await labTestReport.save();
            console.log('Lab test report created for:', item.name);
          }
        }
      } catch (labTestError) {
        console.error('Error creating lab test reports:', labTestError);
        // Don't fail the entire order if lab test report creation fails
        // The order is already created and paid
      }
    }

    // Decrement stock for medicines
    console.log('Updating product stock...');
    try {
      for (const item of cart.items) {
        if (item.productId.category !== 'lab-test') {
          await Product.findByIdAndUpdate(item.productId._id, { $inc: { stock: -item.quantity } });
          console.log(`Stock updated for ${item.productId.name}: -${item.quantity}`);
        }
      }
    } catch (stockUpdateError) {
      console.error('Error updating product stock:', stockUpdateError);
      // Don't fail the entire order if stock update fails
      // The order is already created and paid
    }

    // Clear cart
    console.log('Clearing cart...');
    try {
      cart.items = [];
      await cart.save();
      console.log('Cart cleared successfully');
    } catch (cartError) {
      console.error('Error clearing cart:', cartError);
      // Don't fail the order if cart clearing fails
      // The order is already created and paid
    }

    // Record payment linked to order - ensure orderId is available
    try {
      console.log('Creating payment record...');
      console.log('Payment data to create:', {
        orderId: order.orderId,
        userId,
        amount: totalAmount,
        paymentMethod: payment.paymentMethod,
        paymentType: 'marketplace',
        status: 'completed',
        transactionId: payment.transactionId,
        paymentDetails: payment.details || {},
        currency: 'INR',
      });
      
      // Check if Payment model is properly imported
      console.log('Payment model:', Payment);
      console.log('Payment model name:', Payment?.modelName);
      console.log('Payment model schema:', Payment?.schema);
      console.log('Payment model db:', Payment?.db);
      console.log('Payment model ready state:', Payment?.db?.readyState);
      console.log('Payment model schema paths:', Object.keys(Payment?.schema?.paths || {}));
      console.log('Payment model enum values:', {
        paymentMethod: Payment?.schema?.paths?.paymentMethod?.enumValues,
        status: Payment?.schema?.paths?.status?.enumValues
      });
      console.log('Payment model field types:', Object.keys(Payment?.schema?.paths || {}).reduce((acc, path) => {
        acc[path] = Payment?.schema?.paths?.[path]?.instance;
        return acc;
      }, {}));
      console.log('Payment model field validators:', Object.keys(Payment?.schema?.paths || {}).reduce((acc, path) => {
        acc[path] = Payment?.schema?.paths?.[path]?.validators;
        return acc;
      }, {}));
      console.log('Payment model field defaults:', Object.keys(Payment?.schema?.paths || {}).reduce((acc, path) => {
        acc[path] = Payment?.schema?.paths?.[path]?.defaultValue;
        return acc;
      }, {}));
      console.log('Payment model field required:', Object.keys(Payment?.schema?.paths || {}).reduce((acc, path) => {
        acc[path] = Payment?.schema?.paths?.[path]?.isRequired;
        return acc;
      }, {}));
      console.log('Payment model field indexes:', Object.keys(Payment?.schema?.paths || {}).reduce((acc, path) => {
        acc[path] = Payment?.schema?.paths?.[path]?.index;
        return acc;
      }, {}));
      console.log('Payment model field refs:', Object.keys(Payment?.schema?.paths || {}).reduce((acc, path) => {
        acc[path] = Payment?.schema?.paths?.[path]?.ref;
        return acc;
      }, {}));
      console.log('Payment model field min/max:', Object.keys(Payment?.schema?.paths || {}).reduce((acc, path) => {
        acc[path] = {
          min: Payment?.schema?.paths?.[path]?.validators?.find(v => v.validator.name === 'min')?.arguments[0],
          max: Payment?.schema?.paths?.[path]?.validators?.find(v => v.validator.name === 'max')?.arguments[0]
        };
        return acc;
      }, {}));
      console.log('Payment model field unique:', Object.keys(Payment?.schema?.paths || {}).reduce((acc, path) => {
        acc[path] = Payment?.schema?.paths?.[path]?.unique;
        return acc;
      }, {}));
      console.log('Payment model field sparse:', Object.keys(Payment?.schema?.paths || {}).reduce((acc, path) => {
        acc[path] = Payment?.schema?.paths?.[path]?.sparse;
        return acc;
      }, {}));
      console.log('Payment model field trim:', Object.keys(Payment?.schema?.paths || {}).reduce((acc, path) => {
        acc[path] = Payment?.schema?.paths?.[path]?.trim;
        return acc;
      }, {}));
      console.log('Payment model field lowercase:', Object.keys(Payment?.schema?.paths || {}).reduce((acc, path) => {
        acc[path] = Payment?.schema?.paths?.[path]?.lowercase;
        return acc;
      }, {}));
      
      // Validate the payment data before creating
      const testPayment = new Payment({
        orderId: order.orderId,
        userId,
        amount: totalAmount,
        paymentMethod: payment.paymentMethod,
        paymentType: 'marketplace',
        status: 'completed',
        transactionId: payment.transactionId,
        paymentDetails: payment.details || {},
        currency: 'INR',
      });
      
      const validationError = testPayment.validateSync();
      if (validationError) {
        console.error('Payment validation error before creation:', validationError);
        console.error('Validation error details:', {
          name: validationError.name,
          message: validationError.message,
          errors: validationError.errors
        });
      } else {
        console.log('Payment validation passed, proceeding with creation');
      }
      
      const paymentRecord = await Payment.create({
        orderId: order.orderId,
        userId,
        amount: totalAmount,
        paymentMethod: payment.paymentMethod,
        paymentType: 'marketplace',
        status: 'completed',
        transactionId: payment.transactionId,
        paymentDetails: payment.details || {},
        currency: 'INR',
      });
      console.log('Payment record created successfully:', paymentRecord._id);
      console.log('Payment record details:', paymentRecord);
    } catch (paymentError) {
      console.error('Error creating payment record:', paymentError);
      console.error('Payment error details:', {
        name: paymentError.name,
        message: paymentError.message,
        stack: paymentError.stack
      });
      // Don't fail the entire order if payment record creation fails
      // The order is already created and paid
    }

    // Update user loyalty points (2 points per ₹100 as in gateway UI)
    const pointsEarned = Math.floor((amount || totalAmount) / 100) * 2;
    if (pointsEarned > 0) {
      console.log('Updating user loyalty points:', pointsEarned);
      try {
        await User.findByIdAndUpdate(userId, { $inc: { loyaltyPoints: pointsEarned } });
        console.log('Loyalty points updated successfully');
      } catch (loyaltyError) {
        console.error('Error updating loyalty points:', loyaltyError);
        // Don't fail the entire order if loyalty points update fails
      }
    }

    // Deduct used loyalty points if any
    if (loyaltyPointsUsed > 0) {
      console.log('Deducting used loyalty points:', loyaltyPointsUsed);
      try {
        await User.findByIdAndUpdate(userId, { $inc: { loyaltyPoints: -loyaltyPointsUsed } });
        console.log('Used loyalty points deducted successfully');
      } catch (loyaltyDeductError) {
        console.error('Error deducting loyalty points:', loyaltyDeductError);
        // Don't fail the entire order if loyalty points deduction fails
      }
    }

    // Save insurance data to user profile if provided
    if (insuranceData) {
      console.log('Saving insurance data to user profile...');
      try {
        await User.findByIdAndUpdate(userId, {
          'billing.insurance': {
            provider: insuranceData.provider,
            policyNumber: insuranceData.policyNumber,
            coverage: insuranceData.coverage,
            validTill: insuranceData.validTill
          }
        });
        console.log('Insurance data saved successfully');
      } catch (insuranceError) {
        console.error('Error saving insurance data:', insuranceError);
        // Don't fail the entire order if insurance data saving fails
      }
    }

    console.log('Populating order items...');
    try {
      await order.populate('items.productId');
      console.log('Order items populated successfully');
    } catch (populateError) {
      console.error('Error populating order items:', populateError);
      // Don't fail the entire order if population fails
      // The order is already created and paid
    }

    // Send payment confirmation email
    console.log('Sending payment confirmation email...');
    try {
      // Get user details for email
      const user = await User.findById(userId);
      if (user && user.email) {
        const orderEmailData = {
          customerName: user.fullName || user.email,
          orderId: order.orderId,
          totalAmount: order.totalAmount,
          paymentMethod: payment.paymentMethod,
          transactionId: payment.transactionId,
          items: order.items,
          shippingAddress: order.shippingAddress,
          estimatedDelivery: order.estimatedDelivery,
          createdAt: order.createdAt
        };

        await sendPaymentConfirmationEmail(user.email, orderEmailData);
        console.log('Payment confirmation email sent successfully to:', user.email);
      } else {
        console.log('User email not found, skipping email notification');
      }
    } catch (emailError) {
      console.error('Error sending payment confirmation email:', emailError);
      // Don't fail the entire order if email sending fails
      // The order is already created and paid
    }
    
    console.log('Order created successfully:', order.orderId);
    console.log('=== createOrderAfterPayment END ===');
    
    return res.status(201).json({ success: true, message: 'Order created successfully', data: order });
  } catch (error) {
    console.error('=== createOrderAfterPayment ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Error creating order';
    
    if (error.name === 'ValidationError') {
      errorMessage = `Validation error: ${error.message}`;
    } else if (error.name === 'CastError') {
      errorMessage = `Invalid data format: ${error.message}`;
    } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      errorMessage = `Database error: ${error.message}`;
    } else if (error.name === 'TypeError') {
      errorMessage = `Type error: ${error.message}`;
    } else if (error.name === 'ReferenceError') {
      errorMessage = `Reference error: ${error.message}`;
    }
    
    console.error('=== END ERROR ===');
    
    return res.status(500).json({ 
      success: false, 
      message: errorMessage, 
      error: error.message,
      errorType: error.name,
      errorStack: error.stack
    });
  }
};

// Test function to debug order creation
export const testOrderCreation = async (req, res) => {
  try {
    console.log('=== testOrderCreation START ===');
    console.log('User:', req.user);
    console.log('User ID:', req.user._id);
    
    // Test database connection by checking if we can query the database
    console.log('Testing database connection...');
    
    // Test User model
    const userCount = await User.countDocuments();
    console.log('User count:', userCount);
    
    // Test Order model
    const orderCount = await Order.countDocuments();
    console.log('Order count:', orderCount);
    
    // Test Cart model
    const cartCount = await Cart.countDocuments();
    console.log('Cart count:', cartCount);
    
    // Test Product model
    const productCount = await Product.countDocuments();
    console.log('Product count:', productCount);
    
    // Test creating a simple order object (without saving)
    const testOrder = new Order({
      userId: req.user._id,
      items: [{
        productId: '507f1f77bcf86cd799439011', // Test product ID
        name: 'Test Product',
        category: 'medicine',
        quantity: 1,
        price: 100,
        total: 100
      }],
      totalAmount: 100,
      shippingAddress: {
        street: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'India'
      },
      status: 'pending',
      paymentStatus: 'pending'
    });
    
    console.log('Test order object created:', testOrder);
    console.log('Test order ID before save:', testOrder.orderId);
    
    // Test validation without saving
    const validationError = testOrder.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return res.status(400).json({
        success: false,
        message: 'Order validation failed',
        error: validationError.message
      });
    }
    
    console.log('Order validation passed');
    
    console.log('=== testOrderCreation END ===');
    
    res.status(200).json({
      success: true,
      message: 'Database connection and order validation test successful',
      userCount,
      orderCount,
      cartCount,
      productCount,
      testOrderId: testOrder.orderId
    });
  } catch (error) {
    console.error('=== testOrderCreation ERROR ===');
    console.error('Error:', error);
    console.error('=== END ERROR ===');
    
    res.status(500).json({
      success: false,
      message: 'Order creation test failed',
      error: error.message,
      errorType: error.name
    });
  }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    let query = { userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('items.productId')
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get single order
export const getOrderById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    // Check if orderId is a valid ObjectId format or a custom orderId string
    let query;
    if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a MongoDB ObjectId
      query = { 
        $or: [
          { _id: orderId, userId },
          { orderId: orderId, userId }
        ]
      };
    } else {
      // It's a custom orderId string (like ORD-xxx)
      query = { orderId: orderId, userId };
    }

    const order = await Order.findOne(query).populate('items.productId');

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
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// Cancel order (only if status is pending or confirmed)
export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    // Check if orderId is a valid ObjectId format or a custom orderId string
    let query;
    if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a MongoDB ObjectId
      query = { 
        $or: [
          { _id: orderId, userId },
          { orderId: orderId, userId }
        ]
      };
    } else {
      // It's a custom orderId string (like ORD-xxx)
      query = { orderId: orderId, userId };
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    // Restore product stock
    for (const item of order.items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(
          item.productId._id,
          { $inc: { stock: item.quantity } }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

// Generate and download invoice
export const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    console.log('Generating invoice for order:', orderId, 'user:', userId);

    // Find the order
    const order = await Order.findOne({ orderId })
      .populate('userId', 'name email phone billing')
      .populate('items.productId', 'name category price manufacturer');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.userId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    // Get payment information
    const payment = await Payment.findOne({ orderId: order.orderId });

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${orderId}.pdf"`);

    // Stream the PDF to the response
    doc.pipe(res);

    // Add company logo and header
    doc.fontSize(20)
       .fillColor('#2563eb')
       .text('WEHEAL', 50, 50, { align: 'left' })
       .fontSize(12)
       .fillColor('#6b7280')
       .text('Healthcare Marketplace', 50, 75)
       .text('Digital Healthcare Solutions', 50, 90)
       .text('Email: support@weheal.com', 50, 105)
       .text('Phone: +91-XXXX-XXXX-XX', 50, 120);

    // Add invoice title and details on the right side
    doc.fontSize(24)
       .fillColor('#1f2937')
       .text('INVOICE', 400, 50, { align: 'right', width: 140 });

    // Add invoice details with proper spacing
    const invoiceY = 80;
    doc.fontSize(11)
       .fillColor('#374151')
       .text(`Invoice Number:`, 350, invoiceY, { align: 'left', width: 100 })
       .text(`${orderId}`, 450, invoiceY, { align: 'left', width: 140 })
       .text(`Order Date:`, 350, invoiceY + 15, { align: 'left', width: 100 })
       .text(`${new Date(order.orderDate).toLocaleDateString('en-IN')}`, 450, invoiceY + 15, { align: 'left', width: 140 })
       .text(`Payment Status:`, 350, invoiceY + 30, { align: 'left', width: 100 })
       .text(`${order.paymentStatus}`, 450, invoiceY + 30, { align: 'left', width: 140 })
       .text(`Order Status:`, 350, invoiceY + 45, { align: 'left', width: 100 })
       .text(`${order.status}`, 450, invoiceY + 45, { align: 'left', width: 140 });

    // Add customer information
    const customerY = 160;
    doc.fontSize(14)
       .fillColor('#1f2937')
       .text('Bill To:', 50, customerY)
       .fontSize(12)
       .fillColor('#374151')
       .text(order.userId.name, 50, customerY + 20)
       .text(order.userId.email, 50, customerY + 35)
       .text(order.userId.phone || 'N/A', 50, customerY + 50);

    // Add shipping address
    if (order.shippingAddress) {
      const shippingY = customerY + 80;
      doc.fontSize(14)
         .fillColor('#1f2937')
         .text('Ship To:', 50, shippingY)
         .fontSize(12)
         .fillColor('#374151')
         .text(order.shippingAddress.street, 50, shippingY + 20)
         .text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`, 50, shippingY + 35)
         .text(`${order.shippingAddress.zipCode}, ${order.shippingAddress.country}`, 50, shippingY + 50);
    }

    // Add items table
    const tableY = 350;
    const tableHeaders = ['Item', 'Category', 'Qty', 'Unit Price', 'Total'];
    const columnWidths = [200, 80, 50, 80, 80];
    let currentX = 50;

    // Table header
    doc.fontSize(12)
       .fillColor('#1f2937');
    
    tableHeaders.forEach((header, index) => {
      doc.text(header, currentX, tableY, { width: columnWidths[index], align: 'left' });
      currentX += columnWidths[index];
    });

    // Table header line
    doc.moveTo(50, tableY + 20)
       .lineTo(540, tableY + 20)
       .strokeColor('#d1d5db')
       .stroke();

    // Table rows
    let currentY = tableY + 30;
    order.items.forEach((item, index) => {
      currentX = 50;
      
      doc.fontSize(10)
         .fillColor('#374151');

      const itemData = [
        item.name || 'Unknown Item',
        item.category || 'N/A',
        item.quantity.toString(),
        `₹${item.price.toFixed(2)}`,
        `₹${item.total.toFixed(2)}`
      ];

      itemData.forEach((data, colIndex) => {
        doc.text(data, currentX, currentY, { 
          width: columnWidths[colIndex], 
          align: colIndex > 1 ? 'right' : 'left' 
        });
        currentX += columnWidths[colIndex];
      });

      currentY += 20;

      // Add item separator line
      if (index < order.items.length - 1) {
        doc.moveTo(50, currentY - 5)
           .lineTo(540, currentY - 5)
           .strokeColor('#f3f4f6')
           .stroke();
      }
    });

    // Add totals section with proper spacing
    const totalsY = currentY + 30;
    const labelX = 380;
    const valueX = 500;
    
    // Subtotal
    doc.fontSize(12)
       .fillColor('#374151')
       .text('Subtotal:', labelX, totalsY, { align: 'left', width: 120 })
       .text(`₹${order.totalAmount.toFixed(2)}`, valueX, totalsY, { align: 'left', width: 90 });

    let nextLineY = totalsY + 20;

    // If loyalty points were used
    if (order.loyaltyPointsUsed && order.loyaltyPointsUsed > 0) {
      doc.text('Loyalty Points Discount:', labelX, nextLineY, { align: 'left', width: 120 })
         .text(`-₹${order.loyaltyPointsUsed.toFixed(2)}`, valueX, nextLineY, { align: 'left', width: 90 });
      nextLineY += 20;
    }

    // If coupon was applied
    if (order.couponApplied && order.couponApplied.discount > 0) {
      doc.text(`Coupon (${order.couponApplied.code}):`, labelX, nextLineY, { align: 'left', width: 120 })
         .text(`-₹${order.couponApplied.discount.toFixed(2)}`, valueX, nextLineY, { align: 'left', width: 90 });
      nextLineY += 20;
    }

    // Add line separator before total
    doc.moveTo(labelX, nextLineY + 5)
       .lineTo(590, nextLineY + 5)
       .strokeColor('#d1d5db')
       .stroke();

    // Total with bold styling
    const finalTotalY = nextLineY + 15;
    doc.fontSize(14)
       .fillColor('#1f2937')
       .text('Total Amount:', labelX, finalTotalY, { align: 'left', width: 120 })
       .text(`₹${order.totalAmount.toFixed(2)}`, valueX, finalTotalY, { align: 'left', width: 90 });

    // Add payment information if available
    if (payment) {
      const paymentY = finalTotalY + 50;
      doc.fontSize(12)
         .fillColor('#374151')
         .text('Payment Information:', 50, paymentY)
         .text(`Payment Method: ${payment.paymentMethod}`, 50, paymentY + 20)
         .text(`Transaction ID: ${payment.transactionId || 'N/A'}`, 50, paymentY + 35)
         .text(`Payment Date: ${payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-IN') : 'N/A'}`, 50, paymentY + 50);
    }

    // Add footer
    const footerY = 700;
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text('Thank you for choosing WeHeal!', 50, footerY, { align: 'center', width: 500 })
       .text('For any queries, please contact us at support@weheal.com', 50, footerY + 15, { align: 'center', width: 500 })
       .text('This is a computer-generated invoice.', 50, footerY + 30, { align: 'center', width: 500 });

    // Finalize the PDF
    doc.end();

    console.log('Invoice generated successfully for order:', orderId);

  } catch (error) {
    console.error('Error generating invoice:', error);
    
    // If headers are not sent yet, send error response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error generating invoice',
        error: error.message
      });
    }
  }
};
