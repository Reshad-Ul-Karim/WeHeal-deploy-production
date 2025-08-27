import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { initPayment, verifyPayment, getPaymentStatus, getUserPayments, generateReceipt } from '../controllers/paymentController.js';

const router = express.Router();

// Add logging middleware
router.use((req, res, next) => {
  console.log('=== Payment Route Hit ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('User:', req.user);
  console.log('User ID:', req.user?._id);
  next();
});

router.use(verifyToken);

router.post('/init', initPayment);
router.post('/verify/:orderId', verifyPayment);
router.get('/status/:orderId', getPaymentStatus);
router.get('/history', getUserPayments);
router.get('/receipt/:orderId', generateReceipt);

// Test route to check payments
router.get('/test', async (req, res) => {
  try {
    const Payment = (await import('../models/paymentModel.js')).default;
    const count = await Payment.countDocuments();
    const samplePayments = await Payment.find().limit(5);

    res.json({
      success: true,
      message: 'Payment test successful',
      totalPayments: count,
      samplePayments: samplePayments
    });
  } catch (error) {
    console.error('Payment test error:', error);
    res.status(500).json({ success: false, message: 'Payment test failed', error: error.message });
  }
});

// Simple endpoint to get all payment history (marketplace + consultation)
router.get('/all-history', async (req, res) => {
  try {
    console.log('=== FETCHING ALL PAYMENT HISTORY ===');
    console.log('User:', req.user._id, req.user.name, req.user.role);
    
    const userId = req.user._id;
    
    // Fetch marketplace payments
    const Payment = (await import('../models/paymentModel.js')).default;
    const marketplacePayments = await Payment.find({ userId }).sort({ createdAt: -1 });
    console.log('Marketplace payments found:', marketplacePayments.length);
    
    // Note: Consultation payments model not available yet
    const consultationPayments = [];
    console.log('Consultation payments found:', consultationPayments.length);
    
    // Combine and format all payments
    const allPayments = [
      ...marketplacePayments.map(payment => ({
        ...payment.toObject(),
        paymentType: 'marketplace',
        source: 'marketplace'
      })),
      ...consultationPayments.map(payment => ({
        ...payment.toObject(),
        paymentType: 'consultation',
        source: 'consultation'
      }))
    ];
    
    // Sort by date (newest first)
    allPayments.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    
    console.log('Total payments to return:', allPayments.length);
    
    res.json({
      success: true,
      message: 'Payment history fetched successfully',
      data: allPayments,
      summary: {
        total: allPayments.length,
        marketplace: marketplacePayments.length,
        consultation: consultationPayments.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching all payment history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment history', 
      error: error.message 
    });
  }
});

export default router;


