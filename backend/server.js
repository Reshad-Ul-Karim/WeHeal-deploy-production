import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import path from "path";
import http from "http";

import { connectDB } from "./db/connectDB.js";
import { initializeSocket } from "./socket.js";
import { initFlashSaleAutomation } from "./utils/flashSaleAutomation.js";

import authRoutes from "./routes/authRoute.js";
import adminRoutes from "./routes/adminRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import patientProfileRoutes from "./routes/patientProfileRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import videoCallRoutes from "./routes/videoCallRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import marketplaceRoutes from "./routes/marketplaceRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminMarketplaceRoutes from "./routes/adminMarketplaceRoutes.js";
import labTestReportRoutes from "./routes/labTestReportRoutes.js";
import labCenterRoutes from "./routes/labCenterRoutes.js";
import labTestPricingRoutes from "./routes/labTestPricingRoutes.js";
import reportsRoutes from "./routes/reports.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import consultationPaymentRoutes from "./routes/consultationPaymentRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import flashSaleRoutes from "./routes/flashSaleRoutes.js";
import customerCareRoutes from "./routes/customerCareRoutes.js";
import nurseRoutes from "./routes/nurseRoutes.js";
import emergencyNurseRoutes from "./routes/emergencyNurseRoutes.js";
import oxygenCylinderRoutes from "./routes/oxygenCylinderRoutes.js";
import wheelchairRoutes from "./routes/wheelchairRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

// Initialize Socket.IO
const io = initializeSocket(server);

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5174",
      "http://localhost:5175",
      'https://weheal-1.onrender.com',
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Add request logging middleware
app.use((req, res, next) => {
  console.log("=== Incoming Request ===");
  console.log("Method:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("Headers:", req.headers);
  next();
});

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
console.log("=== Registering API Routes ===");

// Add a simple test endpoint
app.get("/api/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Server is running", 
    timestamp: new Date().toISOString(),
    socketIO: "available"
  });
});

app.use("/api/auth", authRoutes);
console.log("✓ Auth routes registered");
app.use("/api/admin", adminRoutes);
console.log("✓ Admin routes registered");
app.use("/api/patient", patientRoutes);
console.log("✓ Patient routes registered");
app.use("/api/patient-profile", patientProfileRoutes);
console.log("✓ Patient profile routes registered");
app.use("/api/doctor", doctorRoutes);
console.log("✓ Doctor routes registered");
app.use("/api/video-call", videoCallRoutes);
console.log("✓ Video call routes registered");
app.use("/api/emergency", emergencyRoutes);
console.log("✓ Emergency routes registered");
app.use("/api/marketplace", marketplaceRoutes);
console.log("✓ Marketplace routes registered");
app.use("/api/cart", cartRoutes);
console.log("✓ Cart routes registered");
app.use("/api/orders", orderRoutes);
console.log("✓ Order routes registered");
app.use("/api/admin/marketplace", adminMarketplaceRoutes);
console.log("✓ Admin marketplace routes registered");
app.use("/api/lab-tests", labTestReportRoutes);
console.log("✓ Lab test routes registered");
app.use("/api/lab-centers", labCenterRoutes);
console.log("✓ Lab center routes registered");
app.use("/api/lab-test-pricing", labTestPricingRoutes);
console.log("✓ Lab test pricing routes registered");
app.use("/api/reports", reportsRoutes);
console.log("✓ Reports routes registered");
app.use("/api/payments", paymentRoutes);
console.log("✓ Payment routes registered");
app.use("/api/prescriptions", prescriptionRoutes);
console.log("✓ Prescription routes registered");
app.use("/api/consultation-payments", consultationPaymentRoutes);
console.log("✓ Consultation payment routes registered");
app.use("/api/subscriptions", subscriptionRoutes);
console.log("✓ Subscription routes registered");
app.use("/api/flash-sales", flashSaleRoutes);
console.log("✓ Flash sale routes registered");
app.use("/api/customer-care", customerCareRoutes);
console.log("✓ Customer care routes registered");
app.use("/api/nurse", nurseRoutes);
console.log("✓ Nurse routes registered");
app.use("/api/emergency-nurse", emergencyNurseRoutes);
console.log("✓ Emergency nurse routes registered");
app.use("/api/oxygen-cylinder", oxygenCylinderRoutes);
console.log("✓ Oxygen cylinder routes registered");
app.use("/api/wheelchair", wheelchairRoutes);
console.log("✓ Wheelchair routes registered");
console.log("=== All API Routes Registered ===");

// Production static files
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
server.listen(PORT, async () => {
  console.log("=== Server Startup Debug ===");
  console.log(`Server is running on port: ${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
  
  let dbConnected = false;
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      console.log(`Connecting to database (attempt ${attempt}/${maxAttempts})...`);
      await connectDB();
      dbConnected = true;
      console.log("Database connection established successfully");
      break;
    } catch (err) {
      console.error(`Database connection attempt ${attempt} failed:`, err?.message || err);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  if (!dbConnected) {
    console.error("Proceeding without a database connection. Some features will be unavailable.");
  } else {
    try {
      console.log("All routes and middleware registered");
      // Initialize subscription cron jobs
      console.log("Initializing subscription cron jobs...");
      const { initializeSubscriptionCron } = await import("./utils/subscriptionCron.js");
      initializeSubscriptionCron();
      console.log("Subscription cron jobs initialized successfully");

      // Initialize flash sale automation
      console.log("Initializing flash sale automation...");
      initFlashSaleAutomation();
      console.log("Flash sale automation initialized successfully");
    } catch (jobError) {
      console.error("Failed to initialize background jobs:", jobError);
    }
  }

  console.log("=== End Server Startup Debug ===");
});
