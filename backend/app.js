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
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
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
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/flash-sales', flashSaleRoutes);

// Catch-all 404 handler
app.use((req, res) => {
  console.log('Route not found:', req.method, req.originalUrl);
  res.status(404).send('Route not found');
});

export default app;