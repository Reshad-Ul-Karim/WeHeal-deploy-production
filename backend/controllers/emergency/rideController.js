import EmergencyRequest from '../../models/emergency/emergencyRequest.model.js';
import { sendMessageToSocketId } from '../../socket.js';

// Create or update ride details
export const updateRideDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const {
      pickup,
      destination,
      route,
      timing,
      metrics,
      fare,
      rideStatus
    } = req.body;

    const updateData = {};
    
    // Update ride details
    if (pickup) updateData['rideDetails.pickup'] = pickup;
    if (destination) updateData['rideDetails.destination'] = destination;
    if (route) updateData['rideDetails.route'] = route;
    if (timing) updateData['rideDetails.timing'] = timing;
    if (metrics) updateData['rideDetails.metrics'] = metrics;
    if (fare) updateData['rideDetails.fare'] = fare;
    if (rideStatus) updateData['rideDetails.rideStatus'] = rideStatus;

    const updatedRequest = await EmergencyRequest.findOneAndUpdate(
      { requestId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }

    // Notify relevant parties via WebSocket
    if (updatedRequest.patientId) {
      sendMessageToSocketId(updatedRequest.patientId, 'ride_details_updated', {
        requestId,
        rideDetails: updatedRequest.rideDetails
      });
    }

    if (updatedRequest.driverId) {
      sendMessageToSocketId(updatedRequest.driverId, 'ride_details_updated', {
        requestId,
        rideDetails: updatedRequest.rideDetails
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ride details updated successfully',
      data: {
        requestId: updatedRequest.requestId,
        rideDetails: updatedRequest.rideDetails
      }
    });
  } catch (error) {
    console.error('Error updating ride details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ride details',
      error: error.message
    });
  }
};

// Get ride details for a specific request
export const getRideDetails = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await EmergencyRequest.findOne({ requestId })
      .select('requestId rideDetails status driverInfo patientInfo');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ride details retrieved successfully',
      data: {
        requestId: request.requestId,
        status: request.status,
        rideDetails: request.rideDetails,
        driverInfo: request.driverInfo,
        patientInfo: request.patientInfo
      }
    });
  } catch (error) {
    console.error('Error getting ride details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ride details',
      error: error.message
    });
  }
};

// Start ride journey
export const startRide = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { pickupLocation, estimatedPickupTime } = req.body;

    const updateData = {
      'rideDetails.rideStatus.isStarted': true,
      'rideDetails.timing.pickupTime': new Date(),
      status: 'started_journey',
      'statusHistory.started_journey': new Date()
    };

    if (pickupLocation) {
      updateData['rideDetails.pickup'] = pickupLocation;
    }

    if (estimatedPickupTime) {
      updateData['rideDetails.timing.estimatedPickupTime'] = new Date(estimatedPickupTime);
    }

    const updatedRequest = await EmergencyRequest.findOneAndUpdate(
      { requestId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }

    // Notify patient that ride has started
    if (updatedRequest.patientId) {
      sendMessageToSocketId(updatedRequest.patientId, 'ride_started', {
        requestId,
        pickupLocation: updatedRequest.rideDetails.pickup,
        estimatedPickupTime: updatedRequest.rideDetails.timing.estimatedPickupTime
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ride started successfully',
      data: {
        requestId: updatedRequest.requestId,
        rideDetails: updatedRequest.rideDetails
      }
    });
  } catch (error) {
    console.error('Error starting ride:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start ride',
      error: error.message
    });
  }
};

// Complete ride journey
export const completeRide = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { 
      dropoffLocation, 
      totalDistance, 
      totalDuration, 
      averageSpeed,
      finalFare 
    } = req.body;

    const updateData = {
      'rideDetails.rideStatus.isCompleted': true,
      'rideDetails.timing.dropoffTime': new Date(),
      'rideDetails.timing.actualDropoffTime': new Date(),
      status: 'completed',
      'statusHistory.completed': new Date()
    };

    if (dropoffLocation) {
      updateData['rideDetails.destination'] = dropoffLocation;
    }

    if (totalDistance) {
      updateData['rideDetails.metrics.totalDistance'] = totalDistance;
    }

    if (totalDuration) {
      updateData['rideDetails.metrics.totalDuration'] = totalDuration;
    }

    if (averageSpeed) {
      updateData['rideDetails.metrics.averageSpeed'] = averageSpeed;
    }

    if (finalFare) {
      updateData['rideDetails.fare.totalFare'] = finalFare;
      updateData['payment.amount'] = finalFare;
    }

    const updatedRequest = await EmergencyRequest.findOneAndUpdate(
      { requestId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }

    // Notify patient that ride has completed
    if (updatedRequest.patientId) {
      sendMessageToSocketId(updatedRequest.patientId, 'ride_completed', {
        requestId,
        rideDetails: updatedRequest.rideDetails,
        totalFare: finalFare
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ride completed successfully',
      data: {
        requestId: updatedRequest.requestId,
        rideDetails: updatedRequest.rideDetails
      }
    });
  } catch (error) {
    console.error('Error completing ride:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete ride',
      error: error.message
    });
  }
};

// Update ride location and progress
export const updateRideProgress = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { 
      currentLocation, 
      remainingDistance, 
      remainingTime, 
      currentSpeed,
      waypoint 
    } = req.body;

    const updateData = {};

    if (currentLocation) {
      updateData['driverLocation'] = currentLocation;
    }

    if (remainingDistance !== undefined) {
      updateData['rideDetails.route.distance.remaining'] = remainingDistance;
    }

    if (remainingTime !== undefined) {
      updateData['rideDetails.route.duration.remaining'] = remainingTime;
    }

    if (currentSpeed !== undefined) {
      updateData['driverLocation.speed'] = currentSpeed;
    }

    if (waypoint) {
      updateData['$push'] = {
        'rideDetails.route.waypoints': {
          ...waypoint,
          timestamp: new Date()
        }
      };
    }

    const updatedRequest = await EmergencyRequest.findOneAndUpdate(
      { requestId },
      updateData,
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }

    // Notify patient of progress update
    if (updatedRequest.patientId) {
      sendMessageToSocketId(updatedRequest.patientId, 'ride_progress_update', {
        requestId,
        currentLocation: updatedRequest.driverLocation,
        remainingDistance: updatedRequest.rideDetails.route.distance.remaining,
        remainingTime: updatedRequest.rideDetails.route.duration.remaining,
        currentSpeed: updatedRequest.driverLocation.speed
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ride progress updated successfully',
      data: {
        requestId: updatedRequest.requestId,
        driverLocation: updatedRequest.driverLocation,
        rideDetails: updatedRequest.rideDetails
      }
    });
  } catch (error) {
    console.error('Error updating ride progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ride progress',
      error: error.message
    });
  }
};

// Calculate fare for ride
export const calculateFare = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { distance, duration, emergencyType } = req.body;

    // Base fare calculation logic
    let baseFare = 100; // Base fare in BDT
    let distanceFare = 0;
    let timeFare = 0;
    let emergencySurcharge = 0;

    // Distance-based fare (BDT per km)
    if (distance) {
      distanceFare = distance * 15; // 15 BDT per km
    }

    // Time-based fare (BDT per minute)
    if (duration) {
      timeFare = duration * 2; // 2 BDT per minute
    }

    // Emergency surcharge based on type
    if (emergencyType) {
      switch (emergencyType) {
        case 'cardiac':
          emergencySurcharge = 500;
          break;
        case 'trauma':
          emergencySurcharge = 300;
          break;
        case 'stroke':
          emergencySurcharge = 400;
          break;
        default:
          emergencySurcharge = 200;
      }
    }

    const totalFare = baseFare + distanceFare + timeFare + emergencySurcharge;

    // Update the request with calculated fare
    await EmergencyRequest.findOneAndUpdate(
      { requestId },
      {
        'rideDetails.fare': {
          baseFare,
          distanceFare,
          timeFare,
          emergencySurcharge,
          totalFare,
          currency: 'BDT'
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Fare calculated successfully',
      data: {
        requestId,
        fare: {
          baseFare,
          distanceFare,
          timeFare,
          emergencySurcharge,
          totalFare,
          currency: 'BDT'
        }
      }
    });
  } catch (error) {
    console.error('Error calculating fare:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate fare',
      error: error.message
    });
  }
};

// Get ride history for a user
export const getRideHistory = async (req, res) => {
  try {
    const { userId, userType } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let query = {};
    
    if (userType === 'patient') {
      query.patientId = userId;
    } else if (userType === 'driver') {
      query.driverId = userId;
    }

    const rides = await EmergencyRequest.find(query)
      .select('requestId rideDetails status driverInfo patientInfo createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const totalRides = await EmergencyRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Ride history retrieved successfully',
      data: {
        rides,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalRides / limit),
          totalRides,
          hasNextPage: page * limit < totalRides,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error getting ride history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ride history',
      error: error.message
    });
  }
};
