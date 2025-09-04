import express from "express";
import {
  submitEditRequest,
  getEditRequests,
  approveEditRequest,
  rejectEditRequest,
  getMyEditRequests,
  testEndpoint
} from "../controllers/customerCareController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// Test endpoint
router.get("/test", verifyToken, testEndpoint);

// Submit edit request (Customer Care officers only)
router.post("/edit-request", verifyToken, submitEditRequest);

// Get my edit requests (Customer Care officers only)
router.get("/my-requests/:customerCareOfficerId", verifyToken, getMyEditRequests);

// Admin routes (require admin privileges)
router.get("/edit-requests", verifyToken, isAdmin, getEditRequests);
router.put("/edit-requests/:requestId/approve", verifyToken, isAdmin, approveEditRequest);
router.put("/edit-requests/:requestId/reject", verifyToken, isAdmin, rejectEditRequest);

export default router;
