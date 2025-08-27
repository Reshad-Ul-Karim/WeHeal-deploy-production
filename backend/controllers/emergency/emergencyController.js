import EmergencyRequest from '../../models/emergency/emergencyRequest.model.js';
import Driver from '../../models/emergency/driver.model.js';
import Ambulance from '../../models/emergency/ambulance.model.js';
import { sendMessageToSocketId } from '../../socket.js';

// Create an emergency request
export const createEmergencyRequest = async (req, res) => {
  try {
    const { pickup, destination, patientName, patientContact, requestType } = req.body;
    const userId = req.user._id;

    if (!pickup || !destination || !patientName || !patientContact || !requestType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const emergencyRequest = await EmergencyRequest.create({
      userId,
      pickup,
      destination,
      patientName,
      patientContact,
      requestType,
      status: 'pending'
    });

    // Broadcast to available drivers
    // Implementation depends on your socket setup

    res.status(201).json({
      success: true,
      message: 'Emergency request created successfully',
      data: emergencyRequest
    });
  } catch (error) {
    console.error('Error creating emergency request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create emergency request',
      error: error.message
    });
  }
};

// Accept an emergency request
export const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const driverId = req.user._id;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }

    // Find the emergency request
    const emergencyRequest = await EmergencyRequest.findById(requestId);
    if (!emergencyRequest) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }

    // Check if request is already accepted
    if (emergencyRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been ' + emergencyRequest.status
      });
    }

    // Update the emergency request
    emergencyRequest.driverId = driverId;
    emergencyRequest.status = 'accepted';
    emergencyRequest.acceptedAt = new Date();
    await emergencyRequest.save();

    res.status(200).json({
      success: true,
      message: 'Emergency request accepted successfully',
      data: emergencyRequest
    });
  } catch (error) {
    console.error('Error accepting emergency request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept emergency request',
      error: error.message
    });
  }
};

// Update request status
export const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!status || !['accepted', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }

    // Find the emergency request
    const emergencyRequest = await EmergencyRequest.findById(requestId);
    if (!emergencyRequest) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }

    // Only the driver who accepted the request can update it
    if (emergencyRequest.driverId && emergencyRequest.driverId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this request'
      });
    }

    // Update status
    emergencyRequest.status = status;
    if (status === 'completed') {
      emergencyRequest.completedAt = new Date();
    }
    await emergencyRequest.save();

    res.status(200).json({
      success: true,
      message: 'Emergency request status updated successfully',
      data: emergencyRequest
    });
  } catch (error) {
    console.error('Error updating emergency request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emergency request status',
      error: error.message
    });
  }
};

// Get request details
export const getRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const emergencyRequest = await EmergencyRequest.findById(requestId)
      .populate('driverId', 'name phone vehicle')
      .populate('userId', 'name email');
    
    if (!emergencyRequest) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: emergencyRequest
    });
  } catch (error) {
    console.error('Error getting emergency request details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency request details',
      error: error.message
    });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { paymentStatus, paymentMethod, amount } = req.body;
    
    if (!paymentStatus || !['pending', 'completed'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment status is required'
      });
    }
    
    const emergencyRequest = await EmergencyRequest.findById(requestId);
    if (!emergencyRequest) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }
    
    emergencyRequest.payment = {
      status: paymentStatus,
      method: paymentMethod || emergencyRequest.payment?.method,
      amount: amount || emergencyRequest.payment?.amount,
      paidAt: paymentStatus === 'completed' ? new Date() : null
    };
    
    await emergencyRequest.save();
    
    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: emergencyRequest
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  }
}; 