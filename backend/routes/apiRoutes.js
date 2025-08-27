import express from 'express';
import authRoutes from './authRoute.js';
import dashboardRoutes from './dashboardRoute.js';
import adminRoutes from './adminRoutes.js';
import adminMarketplaceRoutes from './adminMarketplaceRoutes.js';
import marketplaceRoutes from './marketplaceRoutes.js';
import cartRoutes from './cartRoutes.js';
import orderRoutes from './orderRoutes.js';
import videoCallRoutes from './videoCallRoutes.js';
import doctorRoutes from './doctorRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import flashSaleRoutes from './flashSaleRoutes.js';
import patientRoutes from './patientRoutes.js';
import patientProfileRoutes from './patientProfileRoutes.js';
import emergencyRoutes from './emergencyRoutes.js';
import labTestReportRoutes from './labTestReportRoutes.js';
import labCenterRoutes from './labCenterRoutes.js';
import labTestPricingRoutes from './labTestPricingRoutes.js';
import reportsRoutes from './reports.js';
import paymentRoutes from './paymentRoutes.js';
import prescriptionRoutes from './prescriptionRoutes.js';
import consultationPaymentRoutes from './consultationPaymentRoutes.js';

const router = express.Router();

// API Welcome Message
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'WeHeal API is running successfully!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      patient: '/api/patient',
      doctor: '/api/doctor',
      marketplace: '/api/marketplace',
      cart: '/api/cart',
      orders: '/api/orders',
      videoCall: '/api/video-call',
      subscription: '/api/subscriptions',
      flashSales: '/api/flash-sales',
      emergency: '/api/emergency',
      labTests: '/api/lab-tests',
      labCenters: '/api/lab-centers',
      labTestPricing: '/api/lab-test-pricing',
      reports: '/api/reports',
      payments: '/api/payments',
      prescriptions: '/api/prescriptions',
      consultationPayments: '/api/consultation-payments',
      dashboard: '/api/dashboard'
    }
  });
});

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    message: 'WeHeal API is healthy and running'
  });
});

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/marketplace', adminMarketplaceRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/video-call', videoCallRoutes);
router.use('/doctor', doctorRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/flash-sales', flashSaleRoutes);
router.use('/patient', patientRoutes);
router.use('/patient-profile', patientProfileRoutes);
router.use('/emergency', emergencyRoutes);
router.use('/lab-tests', labTestReportRoutes);
router.use('/lab-centers', labCenterRoutes);
router.use('/lab-test-pricing', labTestPricingRoutes);
router.use('/reports', reportsRoutes);
router.use('/payments', paymentRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/consultation-payments', consultationPaymentRoutes);

export default router;
