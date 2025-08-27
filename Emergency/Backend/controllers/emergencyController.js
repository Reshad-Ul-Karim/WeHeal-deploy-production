import EmergencyRequest from '../models/emergencyRequest.model.js';
import Driver from '../models/driver.model.js';
import Ambulance from '../models/ambulance.model.js';
import { sendMessageToSocketId } from '../socket.js';

// Create new emergency request
export const createEmergencyRequest = async (req, res) => {
    try {
        const {
            pickupLocation,
            destination,
            vehicleType,
            emergencyType,
            notes
        } = req.body;

        const patient = req.user.id;

        // Calculate estimated amount based on vehicle type
        const baseAmount = {
            'AC': 1000,
            'ICU': 2000,
            'VIP': 3000
        };

        const request = await EmergencyRequest.create({
            patient,
            pickupLocation,
            destination,
            vehicleType,
            emergencyType,
            notes,
            amount: baseAmount[vehicleType]
        });

        // Find available drivers with matching vehicle type
        const availableAmbulances = await Ambulance.find({
            vehicleType,
            isAvailable: true
        }).populate('driver');

        // Notify all available drivers
        availableAmbulances.forEach(ambulance => {
            if (ambulance.driver.socketId) {
                sendMessageToSocketId(ambulance.driver.socketId, {
                    event: 'new-emergency-request',
                    data: {
                        requestId: request._id,
                        pickupLocation,
                        destination,
                        vehicleType,
                        emergencyType,
                        notes
                    }
                });
            }
        });

        res.status(201).json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Error creating emergency request:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating emergency request'
        });
    }
};

// Accept emergency request
export const acceptRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const driverId = req.user.id;

        const request = await EmergencyRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Request is no longer available'
            });
        }

        const driver = await Driver.findById(driverId);
        const ambulance = await Ambulance.findOne({ driver: driverId });

        request.driver = driverId;
        request.ambulance = ambulance._id;
        request.status = 'accepted';
        await request.save();

        // Update driver and ambulance status
        driver.isAvailable = false;
        driver.currentRequest = requestId;
        await driver.save();

        ambulance.isAvailable = false;
        await ambulance.save();

        // Notify patient
        if (req.user.socketId) {
            sendMessageToSocketId(req.user.socketId, {
                event: 'request-accepted',
                data: {
                    requestId,
                    driver: {
                        name: driver.fullName,
                        phone: driver.phone,
                        vehicleDetails: {
                            type: ambulance.vehicleType,
                            name: ambulance.vehicleName,
                            plateNumber: ambulance.plateNumber
                        }
                    }
                }
            });
        }

        res.status(200).json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Error accepting request:', error);
        res.status(500).json({
            success: false,
            message: 'Error accepting request'
        });
    }
};

// Update request status
export const updateRequestStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body;
        const driverId = req.user.id;

        const request = await EmergencyRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.driver.toString() !== driverId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this request'
            });
        }

        request.status = status;
        await request.save();

        // If request is completed, update driver and ambulance status
        if (status === 'completed') {
            const driver = await Driver.findById(driverId);
            const ambulance = await Ambulance.findOne({ driver: driverId });

            driver.isAvailable = true;
            driver.currentRequest = null;
            await driver.save();

            ambulance.isAvailable = true;
            await ambulance.save();
        }

        // Notify patient
        if (req.user.socketId) {
            sendMessageToSocketId(req.user.socketId, {
                event: 'request-status-update',
                data: {
                    requestId,
                    status
                }
            });
        }

        res.status(200).json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating request status'
        });
    }
};

// Get request details
export const getRequestDetails = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;

        const request = await EmergencyRequest.findById(requestId)
            .populate('driver', 'fullName phone')
            .populate('ambulance', 'vehicleType vehicleName plateNumber');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // Check if user is authorized to view this request
        if (request.patient.toString() !== userId && 
            (!request.driver || request.driver._id.toString() !== userId)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this request'
            });
        }

        res.status(200).json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Error getting request details:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting request details'
        });
    }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;

        const request = await EmergencyRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.patient.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update payment status'
            });
        }

        request.paymentStatus = 'completed';
        await request.save();

        res.status(200).json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating payment status'
        });
    }
}; 