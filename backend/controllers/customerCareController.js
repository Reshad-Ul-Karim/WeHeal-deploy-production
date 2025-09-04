import { User } from "../models/userModel.js";
import { EditRequest } from "../models/editRequestModel.js";
import mongoose from "mongoose";

// Test endpoint to check basic functionality
export const testEndpoint = async (req, res) => {
  try {
    console.log('=== testEndpoint called ===');
    console.log('Request user:', req.user);
    console.log('Request headers:', req.headers);
    
    // Test database connection
    try {
      const mongoose = await import('mongoose');
      console.log('Mongoose connection state:', mongoose.connection.readyState);
      console.log('Mongoose models:', Object.keys(mongoose.connection.models));
    } catch (dbError) {
      console.error('Error checking database:', dbError);
    }
    
    res.status(200).json({
      success: true,
      message: "Test endpoint working",
      user: req.user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      message: "Test endpoint error"
    });
  }
};

// Submit an edit request
export const submitEditRequest = async (req, res) => {
  try {
    console.log('=== submitEditRequest called ===');
    console.log('Request body:', req.body);
    console.log('User from token:', req.user);
    
    const {
      userEmail,
      requestType,
      currentData,
      requestedChanges,
      reason,
      customerCareOfficerId,
      customerCareOfficerName
    } = req.body;

    // Validate required fields
    if (!userEmail || !requestType || !requestedChanges || !reason || !customerCareOfficerId) {
      console.log('Missing required fields:', { userEmail, requestType, requestedChanges, reason, customerCareOfficerId });
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(customerCareOfficerId)) {
      console.log('Invalid ObjectId format for customerCareOfficerId:', customerCareOfficerId);
      return res.status(400).json({
        success: false,
        message: "Invalid customer care officer ID format"
      });
    }

    // Check if the user exists
    console.log('Looking for user with email:', userEmail);
    let user;
    try {
      user = await User.findOne({ email: userEmail });
    } catch (dbError) {
      console.error('Database error finding user:', dbError);
      return res.status(500).json({
        success: false,
        message: "Database error while finding user"
      });
    }
    
    if (!user) {
      console.log('User not found with email:', userEmail);
      return res.status(404).json({
        success: false,
        message: "User not found with the provided email"
      });
    }
    console.log('User found:', user._id, user.name);

    // Create the edit request
    const editRequestData = {
      customerCareOfficerId: customerCareOfficerId.toString(),
      customerCareOfficerName,
      userId: user._id.toString(),
      userName: user.name,
      requestType,
      currentData: currentData || '',
      requestedChanges,
      reason,
      status: 'pending'
    };
    
    console.log('Creating edit request with data:', editRequestData);
    
    let editRequest;
    try {
      editRequest = new EditRequest(editRequestData);
      await editRequest.save();
    } catch (saveError) {
      console.error('Database error saving edit request:', saveError);
      return res.status(500).json({
        success: false,
        message: "Database error while saving edit request"
      });
    }
    
    console.log('Edit request saved successfully:', editRequest.requestId);

    res.status(201).json({
      success: true,
      message: "Edit request submitted successfully",
      requestId: editRequest.requestId
    });

  } catch (error) {
    console.error('Error submitting edit request:', error);
    console.error('Request body:', req.body);
    console.error('User from token:', req.user);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all edit requests for admin review
export const getEditRequests = async (req, res) => {
  try {
    const editRequests = await EditRequest.find()
      .populate('customerCareOfficerId', 'name')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: editRequests
    });

  } catch (error) {
    console.error('Error fetching edit requests:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Approve an edit request
export const approveEditRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;

    const editRequest = await EditRequest.findOne({ requestId });
    if (!editRequest) {
      return res.status(404).json({
        success: false,
        message: "Edit request not found"
      });
    }

    if (editRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Request has already been processed"
      });
    }

    // Update the edit request status
    editRequest.status = 'approved';
    editRequest.adminNotes = adminNotes || '';
    editRequest.adminId = req.user._id;
    editRequest.adminName = req.user.name;
    editRequest.processedAt = new Date();

    await editRequest.save();

    // TODO: Implement automatic changes based on request type
    // This would involve updating the user's data based on the requested changes

    res.status(200).json({
      success: true,
      message: "Edit request approved successfully"
    });

  } catch (error) {
    console.error('Error approving edit request:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Reject an edit request
export const rejectEditRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;

    const editRequest = await EditRequest.findOne({ requestId });
    if (!editRequest) {
      return res.status(404).json({
        success: false,
        message: "Edit request not found"
      });
    }

    if (editRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Request has already been processed"
      });
    }

    // Update the edit request status
    editRequest.status = 'rejected';
    editRequest.adminNotes = adminNotes || '';
    editRequest.adminId = req.user._id;
    editRequest.adminName = req.user.name;
    editRequest.processedAt = new Date();

    await editRequest.save();

    res.status(200).json({
      success: true,
      message: "Edit request rejected successfully"
    });

  } catch (error) {
    console.error('Error rejecting edit request:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get edit requests by customer care officer
export const getMyEditRequests = async (req, res) => {
  try {
    const { customerCareOfficerId } = req.params;

    const editRequests = await EditRequest.find({ customerCareOfficerId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: editRequests
    });

  } catch (error) {
    console.error('Error fetching edit requests:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
