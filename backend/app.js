import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoute.js";
import dashboardRoutes from "./routes/dashboardRoute.js";
import adminRoutes from './routes/adminRoutes.js';
import adminMarketplaceRoutes from './routes/adminMarketplaceRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import videoCallRoutes from './routes/videoCallRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import flashSaleRoutes from './routes/flashSaleRoutes.js';

const app = express();

// Global request logger
app.use((req, res, next) => {
  console.log('=== Incoming Request ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  next();
});

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "https://weheal-frontend.onrender.com",
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/marketplace', adminMarketplaceRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/video-call', videoCallRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/flash-sales', flashSaleRoutes);

// Catch-all 404 handler
app.use((req, res) => {
  console.log('Route not found:', req.method, req.originalUrl);
  res.status(404).send('Route not found');
});

export default app;