import { User } from "../models/userModel.js";
import { EmergencyNurseRequest } from "../models/emergencyNurseRequestModel.js";
import { EmergencyNurseRating } from "../models/emergencyNurseRatingModel.js";
import Payment from "../models/paymentModel.js";

// Get available nurses for emergency services
export const getAvailableNurses = async (req, res) => {
  try {
    const nurses = await User.find({ 
      role: 'Nurse',
      'nurseDetails.isAvailable': true 
    })
    .select('-password')
    .sort({ 'nurseDetails.specialization': 1, name: 1 });

    // Add rating and stats for each nurse
    const nursesWithStats = await Promise.all(nurses.map(async (nurse) => {
      // Get average rating
      const ratings = await EmergencyNurseRating.find({ nurseId: nurse._id });
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
        : 0;

      // Get total patients served
      const totalPatients = await EmergencyNurseRequest.countDocuments({
        nurseId: nurse._id,
        status: 'completed'
      });

      // Get response time (average time to accept request)
      const completedRequests = await EmergencyNurseRequest.find({
        nurseId: nurse._id,
        status: 'completed'
      }).select('createdAt acceptedAt');

      const avgResponseTime = completedRequests.length > 0
        ? completedRequests.reduce((sum, req) => {
            const responseTime = req.acceptedAt ? 
              (new Date(req.acceptedAt) - new Date(req.createdAt)) / (1000 * 60) : 0;
            return sum + responseTime;
          }, 0) / completedRequests.length
        : 0;

      return {
        ...nurse.toObject(),
        rating: Math.round(averageRating * 10) / 10,
        totalPatients,
        avgResponseTime: Math.round(avgResponseTime),
        isOnline: nurse.nurseDetails?.currentStatus === 'available'
      };
    }));

    res.json({
      success: true,
      data: { nurses: nursesWithStats }
    });

  } catch (error) {
    console.error('Error fetching available nurses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available nurses',
      error: error.message
    });
  }
};

// Request emergency nurse service
export const requestEmergencyNurse = async (req, res) => {
  try {
    const {
      nurseId,
      description,
      urgency,
      estimatedDuration,
      preferredTime,
      location
    } = req.body;

    const patientId = req.user._id;

    // Validate required fields
    if (!nurseId || !description || !urgency) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if nurse exists and is available
    const nurse = await User.findOne({
      _id: nurseId,
      role: 'Nurse',
      'nurseDetails.isAvailable': true
    });

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: 'Nurse not found or not available'
      });
    }

    // Create emergency request (post-payment path should call this)
    const emergencyRequest = new EmergencyNurseRequest({
      patientId,
      nurseId,
      description,
      urgency,
      estimatedDuration: parseInt(estimatedDuration) || 1,
      preferredTime: preferredTime ? new Date(preferredTime) : null,
      location,
      status: 'pending',
      createdAt: new Date()
    });

    await emergencyRequest.save();

    // TODO: Send real-time notification to nurse
    // This would integrate with your WebSocket system

    res.json({
      success: true,
      message: 'Emergency request sent successfully',
      data: { request: emergencyRequest }
    });

  } catch (error) {
    console.error('Error creating emergency request:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating emergency request',
      error: error.message
    });
  }
};

// Init payment for emergency nurse request (pre-request)
export const initEmergencyPayment = async (req, res) => {
  try {
    const { nurseId, urgency, estimatedDuration } = req.body;
    const userId = req.user._id;

    if (!nurseId || !urgency || !estimatedDuration) {
      return res.status(400).json({ success: false, message: 'nurseId, urgency, estimatedDuration required' });
    }

    const ratePerHour = urgency === 'critical' ? 800 : urgency === 'high' ? 650 : urgency === 'medium' ? 500 : 380;
    const hours = Math.max(1, parseInt(estimatedDuration));
    const amount = ratePerHour * hours;

    const payment = await Payment.create({
      orderId: `ENR-${Date.now()}`,
      userId,
      amount,
      currency: 'BDT',
      paymentMethod: 'mobile',
      paymentType: 'emergency_nurse',
      status: 'pending',
      description: `Emergency nurse (${urgency}) x ${hours}h`
    });

    return res.status(201).json({ success: true, data: { payment, amount } });
  } catch (error) {
    console.error('initEmergencyPayment error', error);
    return res.status(500).json({ success: false, message: 'Failed to init payment' });
  }
};

// Confirm payment and create request atomically
export const confirmEmergencyPaymentAndCreate = async (req, res) => {
  try {
    const userId = req.user._id;
    const { paymentId, nurseId, description, urgency, estimatedDuration, preferredTime, location, transactionId, status, amount: amountFromClient, paymentMethod } = req.body;

    let payment = null;

    // If a paymentId is provided, update that record; otherwise create one from the client callback
    if (paymentId) {
      payment = await Payment.findOne({ _id: paymentId, userId });
      if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

      if (status !== 'completed') {
        payment.status = 'failed';
        await payment.save();
        return res.status(400).json({ success: false, message: 'Payment not completed' });
      }

      payment.status = 'completed';
      payment.transactionId = transactionId || payment.transactionId;
      // Transaction ID is already set above
      payment.completedAt = new Date();
      await payment.save();
    } else {
      // Create a compact payment record based on gateway result
      if (status !== 'completed') {
        return res.status(400).json({ success: false, message: 'Payment not completed' });
      }
      // If amount wasn't provided, compute from urgency/hours
      const hours = Math.max(1, parseInt(estimatedDuration) || 1);
      const rate = urgency === 'critical' ? 800 : urgency === 'high' ? 650 : urgency === 'medium' ? 500 : 380;
      const computedAmount = rate * hours;
      const created = await Payment.create({
        orderId: `ENR-${Date.now()}`,
        userId,
        amount: Number(amountFromClient) || computedAmount,
        currency: 'BDT',
        paymentMethod: paymentMethod || 'mobile',
        paymentType: 'emergency_nurse',
        status: 'completed',
        transactionId: transactionId || `TX-${Date.now()}`,
        // gatewayTransactionId removed to avoid index conflicts
        paymentDetails: { source: 'gateway-callback' },
        completedAt: new Date(),
      });
      payment = created;
    }

    // Split revenue
    const amount = payment.amount;
    const nursePayout = Math.round(amount * 0.75);
    const platformShare = amount - nursePayout;

    const request = await EmergencyNurseRequest.create({
      patientId: userId,
      nurseId,
      description,
      urgency,
      estimatedDuration: parseInt(estimatedDuration) || 1,
      preferredTime: preferredTime ? new Date(preferredTime) : null,
      location,
      status: 'pending',
      createdAt: new Date(),
      paymentId: payment._id,
      amount,
      nursePayout,
      platformShare
    });

    // Award loyalty points (2 per 100 BDT) to patient
    try {
      const points = Math.floor((amount || 0) / 100) * 2;
      if (points > 0) {
        await User.findByIdAndUpdate(userId, { $inc: { loyaltyPoints: points } });
      }
    } catch (e) {
      console.warn('loyalty update failed', e?.message);
    }

    return res.json({ success: true, data: { request, payment } });
  } catch (error) {
    console.error('confirmEmergencyPaymentAndCreate error', error);
    return res.status(500).json({ success: false, message: 'Failed to confirm payment' });
  }
};

// Get nurse's emergency requests
export const getNurseRequests = async (req, res) => {
  try {
    const nurseId = req.user._id;

    // Verify user is a nurse
    if (req.user.role !== 'Nurse') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Nurse privileges required.'
      });
    }

    const requests = await EmergencyNurseRequest.find({ nurseId })
      .populate('patientId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { requests }
    });

  } catch (error) {
    console.error('Error fetching nurse requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nurse requests',
      error: error.message
    });
  }
};

// Accept emergency request
export const acceptEmergencyRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const nurseId = req.user._id;

    // Verify user is a nurse
    if (req.user.role !== 'Nurse') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Nurse privileges required.'
      });
    }

    const request = await EmergencyNurseRequest.findOne({
      _id: requestId,
      nurseId,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or already processed'
      });
    }

    // Update request status
    request.status = 'accepted';
    request.acceptedAt = new Date();
    await request.save();

    // Update nurse status
    await User.findByIdAndUpdate(nurseId, {
      'nurseDetails.currentStatus': 'on_duty'
    });

    res.json({
      success: true,
      message: 'Emergency request accepted',
      data: { request }
    });

  } catch (error) {
    console.error('Error accepting emergency request:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting emergency request',
      error: error.message
    });
  }
};

// Complete emergency request
export const completeEmergencyRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;
    const nurseId = req.user._id;

    // Verify user is a nurse
    if (req.user.role !== 'Nurse') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Nurse privileges required.'
      });
    }

    const request = await EmergencyNurseRequest.findOne({
      _id: requestId,
      nurseId,
      status: 'accepted'
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or not accepted'
      });
    }

    // Update request status
    request.status = 'completed';
    request.completedAt = new Date();
    request.notes = notes;
    await request.save();

    // Update nurse status back to available
    await User.findByIdAndUpdate(nurseId, {
      'nurseDetails.currentStatus': 'available'
    });

    res.json({
      success: true,
      message: 'Emergency request completed',
      data: { request }
    });

  } catch (error) {
    console.error('Error completing emergency request:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing emergency request',
      error: error.message
    });
  }
};

// Rate nurse after service
export const rateNurse = async (req, res) => {
  try {
    const { requestId, rating, review } = req.body;
    const patientId = req.user._id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if request exists and is completed
    const request = await EmergencyNurseRequest.findOne({
      _id: requestId,
      patientId,
      status: 'completed'
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or not completed'
      });
    }

    // Check if already rated
    const existingRating = await EmergencyNurseRating.findOne({
      requestId,
      patientId
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this service'
      });
    }

    // Create rating
    const nurseRating = new EmergencyNurseRating({
      requestId,
      patientId,
      nurseId: request.nurseId,
      rating: parseInt(rating),
      review: review || '',
      createdAt: new Date()
    });

    await nurseRating.save();

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: { rating: nurseRating }
    });

  } catch (error) {
    console.error('Error rating nurse:', error);
    res.status(500).json({
      success: false,
      message: 'Error rating nurse',
      error: error.message
    });
  }
};

// Get patient's emergency requests
export const getPatientRequests = async (req, res) => {
  try {
    const patientId = req.user._id;

    const requests = await EmergencyNurseRequest.find({ patientId })
      .populate('nurseId', 'name nurseDetails.specialization')
      .sort({ createdAt: -1 });

    // Mark whether a request is already rated
    const requestsWithRatingFlag = await Promise.all(
      requests.map(async (reqDoc) => {
        const rated = await EmergencyNurseRating.findOne({ requestId: reqDoc._id, patientId });
        const obj = reqDoc.toObject();
        obj.alreadyRated = !!rated;
        return obj;
      })
    );

    res.json({
      success: true,
      data: { requests: requestsWithRatingFlag }
    });

  } catch (error) {
    console.error('Error fetching patient requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient requests',
      error: error.message
    });
  }
};
