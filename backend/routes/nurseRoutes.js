import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNurseDashboard,
  updateNurseProfile,
  updateNurseAvailability,
  getAllNurses,
  getNurseById,
  updateNurseById,
  deleteNurseById
} from "../controllers/nurseController.js";

const router = express.Router();

// Protect all nurse routes with authentication
router.use(protect);

// Nurse-specific routes (requires Nurse role)
router.get("/dashboard", getNurseDashboard);
router.put("/profile", updateNurseProfile);
router.put("/availability", updateNurseAvailability);

// Admin routes for nurse management (requires Admin role)
router.get("/admin/nurses", getAllNurses);
router.get("/admin/nurses/:id", getNurseById);
router.put("/admin/nurses/:id", updateNurseById);
router.delete("/admin/nurses/:id", deleteNurseById);

export default router;
