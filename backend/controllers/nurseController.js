import { User } from "../models/userModel.js";
import bcryptjs from "bcryptjs";
import mongoose from "mongoose";

// Get nurse dashboard data
export const getNurseDashboard = async (req, res) => {
  try {
    // Get nurse's profile
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify user is a nurse
    if (user.role !== "Nurse") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Nurse privileges required.",
      });
    }

    // Get nurse's current status and availability
    const nurseData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profilePicture: user.profilePicture,
      nurseDetails: user.nurseDetails,
      lastLogin: user.lastLogin,
      isVerified: user.isVerified
    };

    // Get emergency requests assigned to this nurse (if any)
    // This would be implemented based on your emergency system structure
    const emergencyRequests = []; // Placeholder for emergency requests

    res.json({
      success: true,
      data: {
        nurse: nurseData,
        emergencyRequests,
        stats: {
          totalRequests: emergencyRequests.length,
          activeRequests: emergencyRequests.filter(req => req.status === 'active').length,
          completedRequests: emergencyRequests.filter(req => req.status === 'completed').length
        }
      }
    });

  } catch (error) {
    console.error("Error in getNurseDashboard:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching nurse dashboard",
      error: error.message,
    });
  }
};

// Update nurse profile
export const updateNurseProfile = async (req, res) => {
  try {
    const { name, phone, nurseDetails } = req.body;
    const nurseId = req.user._id;

    // Verify user is a nurse
    const user = await User.findById(nurseId);
    if (!user || user.role !== "Nurse") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Nurse privileges required.",
      });
    }

    // Update user data
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (nurseDetails) {
      updateData.nurseDetails = {
        ...user.nurseDetails,
        ...nurseDetails
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      nurseId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Nurse profile updated successfully",
      data: { nurse: updatedUser }
    });

  } catch (error) {
    console.error("Error in updateNurseProfile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating nurse profile",
      error: error.message,
    });
  }
};

// Update nurse availability status
export const updateNurseAvailability = async (req, res) => {
  try {
    const { isAvailable, currentStatus } = req.body;
    const nurseId = req.user._id;

    // Verify user is a nurse
    const user = await User.findById(nurseId);
    if (!user || user.role !== "Nurse") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Nurse privileges required.",
      });
    }

    // Update availability
    const updateData = {};
    if (isAvailable !== undefined) {
      updateData["nurseDetails.isAvailable"] = isAvailable;
    }
    if (currentStatus) {
      updateData["nurseDetails.currentStatus"] = currentStatus;
    }

    const updatedUser = await User.findByIdAndUpdate(
      nurseId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Nurse availability updated successfully",
      data: { nurse: updatedUser }
    });

  } catch (error) {
    console.error("Error in updateNurseAvailability:", error);
    res.status(500).json({
      success: false,
      message: "Error updating nurse availability",
      error: error.message,
    });
  }
};

// Get all nurses (admin only)
export const getAllNurses = async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const nurses = await User.find({ role: "Nurse" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { nurses }
    });

  } catch (error) {
    console.error("Error in getAllNurses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching nurses",
      error: error.message,
    });
  }
};

// Get nurse by ID (admin only)
export const getNurseById = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user is admin
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid nurse ID format"
      });
    }

    const nurse = await User.findOne({ _id: id, role: "Nurse" })
      .select("-password");

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: "Nurse not found"
      });
    }

    res.json({
      success: true,
      data: { nurse }
    });

  } catch (error) {
    console.error("Error in getNurseById:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching nurse",
      error: error.message,
    });
  }
};

// Update nurse by ID (admin only)
export const updateNurseById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verify user is admin
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid nurse ID format"
      });
    }

    // Remove password from update data if present
    delete updateData.password;

    const updatedNurse = await User.findOneAndUpdate(
      { _id: id, role: "Nurse" },
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedNurse) {
      return res.status(404).json({
        success: false,
        message: "Nurse not found"
      });
    }

    res.json({
      success: true,
      message: "Nurse updated successfully",
      data: { nurse: updatedNurse }
    });

  } catch (error) {
    console.error("Error in updateNurseById:", error);
    res.status(500).json({
      success: false,
      message: "Error updating nurse",
      error: error.message,
    });
  }
};

// Delete nurse by ID (admin only)
export const deleteNurseById = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user is admin
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid nurse ID format"
      });
    }

    const deletedNurse = await User.findOneAndDelete({ _id: id, role: "Nurse" });

    if (!deletedNurse) {
      return res.status(404).json({
        success: false,
        message: "Nurse not found"
      });
    }

    res.json({
      success: true,
      message: "Nurse deleted successfully"
    });

  } catch (error) {
    console.error("Error in deleteNurseById:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting nurse",
      error: error.message,
    });
  }
};
