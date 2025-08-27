import { Appointment } from '../models/appointmentModel.js';
import { User } from '../models/userModel.js';
import Payment from '../models/paymentModel.js';

// Initialize consultation payment
export const initConsultationPayment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const patientId = req.user._id;

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId', 'name consultationFee')
      .populate('patientId', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify the appointment belongs to this patient
    if (appointment.patientId._id.toString() !== patientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only pay for your own appointments'
      });
    }

    // Check if consultation is completed
    if (appointment.videoCallStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Consultation must be completed before payment'
      });
    }

    // Check if already paid
    if (appointment.consultationPaymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Consultation has already been paid for'
      });
    }

    // Calculate consultation fee
    const consultationFee = appointment.consultationFee || 500; // Default fee

    // Create payment record
    const payment = new Payment({
      userId: patientId,
      doctorId: appointment.doctorId._id,
      amount: consultationFee,
      currency: 'INR',
      paymentType: 'consultation',
      appointmentId: appointmentId,
      description: `Consultation with Dr. ${appointment.doctorId.name}`,
      status: 'pending'
    });

    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Consultation payment initialized',
      data: {
        paymentId: payment._id,
        amount: consultationFee,
        appointmentId: appointmentId,
        doctorName: appointment.doctorId.name,
        patientName: appointment.patientId.name
      }
    });
  } catch (error) {
    console.error('Error initializing consultation payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing consultation payment',
      error: error.message
    });
  }
};

// Complete consultation payment
export const completeConsultationPayment = async (req, res) => {
  try {
    const { paymentId, transactionId, paymentMethod } = req.body;
    const patientId = req.user._id;

    // Find the payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify the payment belongs to this patient
    if (payment.userId.toString() !== patientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only complete your own payments'
      });
    }

    // Update payment status
    payment.status = 'completed';
    payment.transactionId = transactionId;
    payment.paymentMethod = paymentMethod;
    payment.completedAt = new Date();

    await payment.save();

    // Update appointment payment status
    await Appointment.findByIdAndUpdate(payment.appointmentId, {
      consultationPaymentStatus: 'completed',
      consultationPaymentId: paymentId,
      consultationPaymentDate: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Consultation payment completed successfully',
      data: {
        paymentId: payment._id,
        amount: payment.amount,
        status: payment.status,
        transactionId: payment.transactionId
      }
    });
  } catch (error) {
    console.error('Error completing consultation payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing consultation payment',
      error: error.message
    });
  }
};

// Get consultation payment status
export const getConsultationPaymentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const patientId = req.user._id;

    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId', 'name consultationFee')
      .populate('patientId', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify the appointment belongs to this patient
    if (appointment.patientId.toString() !== patientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const payment = await Payment.findOne({
      appointmentId: appointmentId,
      userId: patientId,
      paymentType: 'consultation'
    });

    res.status(200).json({
      success: true,
      data: {
        appointmentId: appointmentId,
        consultationFee: appointment.doctorId.consultationFee,
        paymentStatus: appointment.consultationPaymentStatus,
        videoCallStatus: appointment.videoCallStatus,
        payment: payment ? {
          id: payment._id,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt
        } : null
      }
    });
  } catch (error) {
    console.error('Error getting consultation payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting payment status',
      error: error.message
    });
  }
};

// Get consultation payment history for patient
export const getConsultationPaymentHistory = async (req, res) => {
  try {
    const patientId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    
    console.log('getConsultationPaymentHistory called for patient:', patientId);
    console.log('Page:', page, 'Limit:', limit);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find({
      userId: patientId,
      paymentType: 'consultation'
    })
    .populate('appointmentId', 'appointmentDate startTime endTime')
    .populate('doctorId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    console.log('Found consultation payments:', payments.length);
    console.log('Consultation payments data:', payments);

    const total = await Payment.countDocuments({
      userId: patientId,
      paymentType: 'consultation'
    });

    console.log('Total consultation payments:', total);

    res.status(200).json({
      success: true,
      data: {
        payments: payments.map(payment => ({
          id: payment._id,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt,
          appointment: payment.appointmentId ? {
            date: payment.appointmentId.appointmentDate,
            time: payment.appointmentId.startTime
          } : null,
          doctorName: payment.doctorId ? payment.doctorId.name : 'Unknown'
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total
        }
      }
    });
  } catch (error) {
    console.error('Error getting consultation payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting payment history',
      error: error.message
    });
  }
};
