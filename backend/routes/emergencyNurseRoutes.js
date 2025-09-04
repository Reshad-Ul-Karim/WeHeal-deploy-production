import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAvailableNurses,
  requestEmergencyNurse,
  getNurseRequests,
  acceptEmergencyRequest,
  completeEmergencyRequest,
  rateNurse,
  getPatientRequests,
  initEmergencyPayment,
  confirmEmergencyPaymentAndCreate
} from "../controllers/emergencyNurseController.js";

const router = express.Router();

// Public routes (for browsing available nurses)
router.get("/available-nurses", getAvailableNurses);

// Protected routes
router.use(protect);

// Debug logger for this router
router.use((req, _res, next) => {
  console.log(`[EmergencyNurseRoutes] ${req.method} ${req.originalUrl}`);
  next();
});

// Patient routes
router.post("/payment/init", initEmergencyPayment);
router.post("/payment/confirm", confirmEmergencyPaymentAndCreate);
router.post("/request-nurse", requestEmergencyNurse);
router.get("/patient/requests", getPatientRequests);
router.post("/rate-nurse", rateNurse);

// Nurse routes
router.get("/nurse/requests", getNurseRequests);
router.put("/nurse/accept/:requestId", acceptEmergencyRequest);
router.put("/nurse/complete/:requestId", completeEmergencyRequest);

export default router;
