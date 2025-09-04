import { Server } from 'socket.io';
import Driver from './models/emergency/driver.model.js';
import EmergencyRequest from './models/emergency/emergencyRequest.model.js';
import LocationService from './services/locationService.js';

// Global socket.io instance
let io;
let connectedSockets = new Map(); // Map to store connected sockets

// Initialize Socket.IO
export function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:5001'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle user authentication
    socket.on('authenticate', async (data) => {
      try {
        const { userId, userType } = data;
        
        if (!userId) {
          return socket.emit('error', { message: 'User ID is required' });
        }
        
        console.log(`Authenticating user: ${userId} as ${userType}`);

        // Store the socket connection with user ID
        connectedSockets.set(userId, socket.id);
        
        // If it's a driver, update their socket ID in DB and join drivers room
        if (userType === 'driver') {
          try {
            // Always join the drivers room first (for immediate broadcasting)
            socket.join('drivers');
            console.log(`Driver ${userId} joined 'drivers' room with socket ${socket.id}`);
            
            // Try to update emergency Driver model, create if doesn't exist
            await Driver.findOneAndUpdate(
              { driverId: userId },
              { 
                socketId: socket.id,
                isOnline: true,
                'currentLocation.lastUpdated': new Date()
              },
              { upsert: true, new: true }
            );
            console.log(`Driver ${userId} database record updated`);
            
            // Debug: Check drivers room membership
            const driversRoom = io.sockets.adapter.rooms.get('drivers');
            console.log(`Drivers room now has ${driversRoom ? driversRoom.size : 0} members`);
            
          } catch (error) {
            console.error('Error updating driver status:', error);
            // Still join the room even if DB update fails
            socket.join('drivers');
            console.log(`Driver ${userId} joined 'drivers' room despite DB error`);
          }
        } else if (userType === 'patient') {
          // Join patients room
          socket.join('patients');
          console.log(`Patient ${userId} is now online with socket ${socket.id}`);
        } else if (userType === 'customercare') {
          // Customer care agents group
          socket.join('customer-care');
          console.log(`CustomerCare ${userId} is now online with socket ${socket.id}`);
          console.log(`CustomerCare ${userId} joined customer-care room`);
          
          // Debug: Check room membership
          const customerCareRoom = io.sockets.adapter.rooms.get('customer-care');
          console.log(`Customer care room now has ${customerCareRoom ? customerCareRoom.size : 0} members`);
        }
        
        socket.userId = userId;
        socket.userType = userType;
        
        socket.emit('authenticated', { success: true });
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Handle emergency request from patient
    socket.on('new_request', async (data) => {
      try {
        console.log('Received new emergency request:', data);
        
        // Validate the request
        if (!socket.userId) {
          return socket.emit('error', { message: 'Unauthorized - Please authenticate first' });
        }
        
        // Store request in database (if needed)
        try {
          const request = new EmergencyRequest({
            requestId: data.id,
            patientId: data.patientInfo?.patientId || socket.userId,
            location: data.location,
            emergencyType: data.emergencyType,
            description: data.description,
            status: 'pending',
            patientInfo: data.patientInfo,
          });
          await request.save();
          console.log(`Emergency request ${data.id} saved to database`);
        } catch (dbError) {
          console.error('Error saving emergency request to database:', dbError);
          // Continue even if DB saving fails
        }
        
        // Broadcast to all connected drivers
        console.log('Broadcasting emergency request to all drivers...');
        const driversRoom = io.sockets.adapter.rooms.get('drivers');
        console.log(`Current drivers room has ${driversRoom ? driversRoom.size : 0} members`);
        io.to('drivers').emit('new_request', data);
        console.log('Emergency request broadcasted to drivers room');
        
        // Acknowledge receipt to the requesting patient
        socket.emit('request_received', {
          requestId: data.id,
          status: 'pending',
          message: 'Your emergency request has been received and is being processed'
        });
      } catch (error) {
        console.error('Error processing new request:', error);
        socket.emit('error', { message: 'Error processing your request' });
      }
    });

    // ===== Customer Care Chat Events =====
    // Patient starts or continues a chat -> notify available customer care
    socket.on('chat:new', async (data) => {
      try {
        console.log('=== CHAT:NEW EVENT RECEIVED ===');
        console.log('Data:', data);
        console.log('Socket user ID:', socket.userId);
        console.log('Socket user type:', socket.userType);
        console.log('Connected sockets count:', connectedSockets.size);
        
        // Get all customer care agents in the room
        const customerCareRoom = io.sockets.adapter.rooms.get('customer-care');
        console.log('Customer care room members:', customerCareRoom ? customerCareRoom.size : 0);
        
        // Broadcast to all customer care agents
        console.log('Broadcasting chat:new to customer-care room...');
        io.to('customer-care').emit('chat:new', data);
        console.log('=== END CHAT:NEW EVENT ===');
      } catch (err) {
        console.error('chat:new error', err);
      }
    });

    // Agent accepts chat -> notify specific patient, and all agents to update state
    socket.on('chat:assign', async (data) => {
      try {
        const { patientId, agent } = data;
        const patientSocketId = connectedSockets.get(patientId);
        if (patientSocketId) {
          io.to(patientSocketId).emit('chat:assigned', { agent });
        }
        io.to('customer-care').emit('chat:assigned', { patientId, agent });
      } catch (err) {
        console.error('chat:assign error', err);
      }
    });

    // Message relay between participants
    socket.on('chat:message', async (data) => {
      try {
        const { toUserId, message } = data;
        const target = connectedSockets.get(toUserId);
        if (target) io.to(target).emit('chat:message', message);
      } catch (err) {
        console.error('chat:message error', err);
      }
    });

    // Handle chat termination
    socket.on('chat:end', async (data) => {
      try {
        const { patientId, agentId } = data;
        
        // Notify the patient that the chat has ended
        const patientSocketId = connectedSockets.get(patientId);
        if (patientSocketId) {
          io.to(patientSocketId).emit('chat:ended', { 
            message: 'Chat session has ended by the agent',
            timestamp: new Date().toISOString()
          });
        }
        
        // Notify the agent that the chat has ended
        const agentSocketId = connectedSockets.get(agentId);
        if (agentSocketId) {
          io.to(agentSocketId).emit('chat:ended', { 
            message: 'Chat session has ended by the patient',
            timestamp: new Date().toISOString()
          });
        }
        
        // Notify all customer care agents to update their queue
        io.to('customer-care').emit('chat:ended', { 
          patientId, 
          agentId,
          timestamp: new Date().toISOString()
        });
        
        console.log(`Chat ended between patient ${patientId} and agent ${agentId}`);
      } catch (err) {
        console.error('chat:end error', err);
      }
    });
    
    // Handle request acceptance from driver
    socket.on('accept_request', async (data) => {
      try {
        console.log('Driver accepting request:', data);
        
        if (!socket.userId || socket.userType !== 'driver') {
          return socket.emit('error', { message: 'Unauthorized - Only drivers can accept requests' });
        }
        
        const { requestId, driver } = data;
        
        // Get complete driver information from database
        let completeDriverInfo = driver;
        try {
          const driverFromDB = await Driver.findById(socket.userId)
            .populate('vehicle', 'registrationNumber chassisNumber type')
            .select('-password');
          
          if (driverFromDB) {
            completeDriverInfo = {
              id: driverFromDB._id,
              name: driverFromDB.name,
              phone: driverFromDB.phone,
              email: driverFromDB.email,
              licenseNumber: driverFromDB.licenseNumber,
              vehicleType: driverFromDB.vehicleType,
              vehicleNumber: driverFromDB.vehicleNumber,
              carRegistration: driverFromDB.vehicle?.registrationNumber || driverFromDB.vehicleDetails?.registrationNumber,
              ambulanceType: driverFromDB.vehicle?.type || driverFromDB.vehicleDetails?.ambulanceType,
              chassisNumber: driverFromDB.vehicle?.chassisNumber || driverFromDB.vehicleDetails?.chassisNumber,
              isOnline: driverFromDB.isOnline,
              rating: driverFromDB.rating
            };
          }
        } catch (dbError) {
          console.error('Error fetching driver info from database:', dbError);
          // Continue with provided driver info if DB fetch fails
        }
        
        // Update request in database
        try {
          const updatedRequest = await EmergencyRequest.findOneAndUpdate(
            { requestId },
            { 
              status: 'accepted',
              driverId: completeDriverInfo.id || socket.userId,
              driverInfo: completeDriverInfo,
              'statusHistory.accepted': new Date()
            },
            { new: true }
          );
          
          if (!updatedRequest) {
            return socket.emit('error', { message: 'Request not found' });
          }
        } catch (dbError) {
          console.error('Error updating request in database:', dbError);
          // Continue even if DB update fails
        }
        
        // Broadcast the acceptance to all drivers (to remove from their lists)
        io.to('drivers').emit('request_status_update', {
          requestId,
          status: 'accepted',
          driverId: completeDriverInfo.id || socket.userId,
          driver: completeDriverInfo
        });
        
        // Forward the acceptance to the patient who made the request
        const patient = await EmergencyRequest.findOne({ requestId }).select('patientId');
        if (patient && patient.patientId) {
          const patientSocketId = connectedSockets.get(patient.patientId);
          if (patientSocketId) {
            io.to(patientSocketId).emit('request_status_update', {
              requestId,
              status: 'accepted',
              driver: completeDriverInfo
            });
          }
        }
        
        socket.emit('request_accepted', { success: true, requestId });
      } catch (error) {
        console.error('Error accepting request:', error);
        socket.emit('error', { message: 'Error accepting request' });
      }
    });
    
    // Handle request status updates
    socket.on('request_status_update', async (data) => {
      try {
        console.log('Updating request status:', data);
        const { requestId, status, driver } = data;
        
        // Update the request in database
        try {
          await EmergencyRequest.findOneAndUpdate(
            { requestId },
            { 
              status,
              [`statusHistory.${status}`]: new Date(),
              ...(driver && { driverInfo: driver })
            }
          );
        } catch (dbError) {
          console.error('Error updating request status in database:', dbError);
          // Continue even if DB update fails
        }
        
        // Broadcast to all drivers
        io.to('drivers').emit('request_status_update', data);
        
        // Forward to the patient
        const patient = await EmergencyRequest.findOne({ requestId }).select('patientId');
        if (patient && patient.patientId) {
          const patientSocketId = connectedSockets.get(patient.patientId);
          if (patientSocketId) {
            io.to(patientSocketId).emit('request_status_update', data);
          }
        }
        
        socket.emit('status_updated', { success: true, requestId, status });
      } catch (error) {
        console.error('Error updating request status:', error);
        socket.emit('error', { message: 'Error updating request status' });
      }
    });

    // Update driver location (legacy - keeping for backward compatibility)
    socket.on('update-location', async (data) => {
      try {
        if (!socket.userId || socket.userType !== 'driver') {
          return socket.emit('error', { message: 'Unauthorized' });
        }
        
        const { latitude, longitude } = data;
        
        await Driver.findOneAndUpdate(
          { driverId: socket.userId },
          {
            'currentLocation.latitude': latitude,
            'currentLocation.longitude': longitude,
            'currentLocation.lastUpdated': new Date()
          },
          { upsert: true }
        );
      } catch (error) {
        console.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // === RIDE MANAGEMENT EVENTS ===
    
    // Handle ride start
    socket.on('ride:start', async (data) => {
      try {
        if (!socket.userId || socket.userType !== 'driver') {
          return socket.emit('error', { message: 'Unauthorized - Only drivers can start rides' });
        }
        
        const { requestId, pickupLocation, estimatedPickupTime } = data;
        
        console.log(`Driver ${socket.userId} starting ride for request ${requestId}`);
        
        // Update ride status in database
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
          return socket.emit('error', { message: 'Request not found' });
        }
        
        // Notify patient that ride has started
        if (updatedRequest.patientId) {
          const patientSocketId = connectedSockets.get(updatedRequest.patientId);
          if (patientSocketId) {
            io.to(patientSocketId).emit('ride:started', {
              requestId,
              pickupLocation: updatedRequest.rideDetails.pickup,
              estimatedPickupTime: updatedRequest.rideDetails.timing.estimatedPickupTime
            });
          }
        }
        
        socket.emit('ride:started', { success: true, requestId });
      } catch (error) {
        console.error('Error starting ride:', error);
        socket.emit('error', { message: 'Error starting ride' });
      }
    });
    
    // Handle ride completion
    socket.on('ride:complete', async (data) => {
      try {
        if (!socket.userId || socket.userType !== 'driver') {
          return socket.emit('error', { message: 'Unauthorized - Only drivers can complete rides' });
        }
        
        const { requestId, dropoffLocation, totalDistance, totalDuration, averageSpeed, finalFare } = data;
        
        console.log(`Driver ${socket.userId} completing ride for request ${requestId}`);
        
        // Update ride completion in database
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
          return socket.emit('error', { message: 'Request not found' });
        }
        
        // Notify patient that ride has completed
        if (updatedRequest.patientId) {
          const patientSocketId = connectedSockets.get(updatedRequest.patientId);
          if (patientSocketId) {
            io.to(patientSocketId).emit('ride:completed', {
              requestId,
              rideDetails: updatedRequest.rideDetails,
              totalFare: finalFare
            });
          }
        }
        
        socket.emit('ride:completed', { success: true, requestId });
      } catch (error) {
        console.error('Error completing ride:', error);
        socket.emit('error', { message: 'Error completing ride' });
      }
    });
    
    // Handle ride progress updates
    socket.on('ride:progress', async (data) => {
      try {
        if (!socket.userId || socket.userType !== 'driver') {
          return socket.emit('error', { message: 'Unauthorized - Only drivers can update ride progress' });
        }
        
        const { requestId, currentLocation, remainingDistance, remainingTime, currentSpeed, waypoint } = data;
        
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
          return socket.emit('error', { message: 'Request not found' });
        }
        
        // Notify patient of progress update
        if (updatedRequest.patientId) {
          const patientSocketId = connectedSockets.get(updatedRequest.patientId);
          if (patientSocketId) {
            io.to(patientSocketId).emit('ride:progress_update', {
              requestId,
              currentLocation: updatedRequest.driverLocation,
              remainingDistance: updatedRequest.rideDetails.route.distance.remaining,
              remainingTime: updatedRequest.rideDetails.route.duration.remaining,
              currentSpeed: updatedRequest.driverLocation.speed
            });
          }
        }
        
        socket.emit('ride:progress_updated', { success: true, requestId });
      } catch (error) {
        console.error('Error updating ride progress:', error);
        socket.emit('error', { message: 'Error updating ride progress' });
      }
    });

    // === REAL-TIME LOCATION TRACKING EVENTS ===
    
    // Request location sharing permission
    socket.on('location:request-permission', async (data) => {
      try {
        const { requestId } = data;
        
        if (!socket.userId) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        console.log(`Location permission requested for request ${requestId} by ${socket.userType} ${socket.userId}`);

        // Update request to mark permission requested
        await EmergencyRequest.findOneAndUpdate(
          { requestId },
          { 'locationPermissions.requestedAt': new Date() }
        );

        // Notify the other party about permission request
        const request = await EmergencyRequest.findOne({ requestId });
        if (request) {
          const targetUserId = socket.userType === 'driver' ? request.patientId : request.driverId;
          const targetSocketId = connectedSockets.get(targetUserId);
          
          if (targetSocketId) {
            io.to(targetSocketId).emit('location:permission-requested', {
              requestId,
              requesterType: socket.userType,
              message: `${socket.userType === 'driver' ? 'Driver' : 'Patient'} is requesting to share location`
            });
          }
        }

        socket.emit('location:permission-request-sent', { requestId });
      } catch (error) {
        console.error('Location permission request error:', error);
        socket.emit('error', { message: 'Failed to request location permission' });
      }
    });

    // Grant location sharing permission
    socket.on('location:grant-permission', async (data) => {
      try {
        const { requestId } = data;
        
        if (!socket.userId) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        console.log(`Location permission granted for request ${requestId} by ${socket.userType} ${socket.userId}`);

        // Update permission in database
        await LocationService.grantLocationPermission(requestId, socket.userType);

        // Notify all parties about permission granted
        const request = await EmergencyRequest.findOne({ requestId });
        if (request) {
          const targetUserId = socket.userType === 'driver' ? request.patientId : request.driverId;
          const targetSocketId = connectedSockets.get(targetUserId);
          
          if (targetSocketId) {
            io.to(targetSocketId).emit('location:permission-granted', {
              requestId,
              granterType: socket.userType,
              message: `${socket.userType === 'driver' ? 'Driver' : 'Patient'} has granted location sharing`
            });
          }

          // Check if both parties have granted permission
          const permissions = await LocationService.getLocationSharingStatus(requestId);
          if (permissions.bothSharing) {
            // Notify both parties that real-time tracking is active
            [request.patientId, request.driverId].forEach(userId => {
              const socketId = connectedSockets.get(userId);
              if (socketId) {
                io.to(socketId).emit('location:tracking-active', {
                  requestId,
                  message: 'Real-time location tracking is now active'
                });
              }
            });
          }
        }

        socket.emit('location:permission-granted-success', { requestId });
      } catch (error) {
        console.error('Location permission grant error:', error);
        socket.emit('error', { message: 'Failed to grant location permission' });
      }
    });

    // Deny location sharing permission
    socket.on('location:deny-permission', async (data) => {
      try {
        const { requestId } = data;
        
        if (!socket.userId) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        console.log(`Location permission denied for request ${requestId} by ${socket.userType} ${socket.userId}`);

        // Notify the other party about permission denial
        const request = await EmergencyRequest.findOne({ requestId });
        if (request) {
          const targetUserId = socket.userType === 'driver' ? request.patientId : request.driverId;
          const targetSocketId = connectedSockets.get(targetUserId);
          
          if (targetSocketId) {
            io.to(targetSocketId).emit('location:permission-denied', {
              requestId,
              denierType: socket.userType,
              message: `${socket.userType === 'driver' ? 'Driver' : 'Patient'} has denied location sharing`
            });
          }
        }

        socket.emit('location:permission-denied-success', { requestId });
      } catch (error) {
        console.error('Location permission denial error:', error);
        socket.emit('error', { message: 'Failed to deny location permission' });
      }
    });

    // Update real-time location
    socket.on('location:update', async (data) => {
      try {
        const { requestId, latitude, longitude, accuracy, heading, speed, address } = data;
        
        if (!socket.userId) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        if (!LocationService.isValidLocation(latitude, longitude)) {
          return socket.emit('error', { message: 'Invalid location coordinates' });
        }

        console.log(`Location update from ${socket.userType} ${socket.userId} for request ${requestId}`);

        // Check if location sharing is permitted
        const permissions = await LocationService.getLocationSharingStatus(requestId);
        const canShare = socket.userType === 'patient' ? permissions.patientSharing : permissions.driverSharing;
        
        if (!canShare) {
          return socket.emit('error', { message: 'Location sharing not permitted' });
        }

        // Update location in database
        const locationData = { latitude, longitude, accuracy, heading, speed, address };
        let updatedRequest;

        if (socket.userType === 'driver') {
          updatedRequest = await LocationService.updateDriverLocation(requestId, socket.userId, locationData);
          
          // Also update driver model for legacy support
          await Driver.findOneAndUpdate(
            { driverId: socket.userId },
            {
              'currentLocation.latitude': latitude,
              'currentLocation.longitude': longitude,
              'currentLocation.lastUpdated': new Date()
            },
            { upsert: true }
          );
        } else {
          updatedRequest = await LocationService.updatePatientLocation(requestId, locationData);
        }

        if (updatedRequest) {
          // Get distance and ETA if both locations are available
          let distanceInfo = null;
          try {
            distanceInfo = await LocationService.getDistanceAndETA(requestId);
          } catch (etaError) {
            console.log('Could not calculate ETA:', etaError.message);
          }

          // Broadcast location update to the other party
          const targetUserId = socket.userType === 'driver' ? updatedRequest.patientId : updatedRequest.driverId;
          const targetSocketId = connectedSockets.get(targetUserId);
          
          if (targetSocketId) {
            io.to(targetSocketId).emit('location:received', {
              requestId,
              userType: socket.userType,
              location: { latitude, longitude, accuracy, heading, speed, address },
              timestamp: new Date().toISOString(),
              distanceInfo
            });
          }

          // Send confirmation to sender
          socket.emit('location:update-success', {
            requestId,
            timestamp: new Date().toISOString(),
            distanceInfo
          });
        }

      } catch (error) {
        console.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Get current distance and ETA
    socket.on('location:get-distance', async (data) => {
      try {
        const { requestId } = data;
        
        if (!socket.userId) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        const distanceInfo = await LocationService.getDistanceAndETA(requestId);
        
        socket.emit('location:distance-info', {
          requestId,
          ...distanceInfo,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Distance calculation error:', error);
        socket.emit('error', { message: 'Failed to calculate distance' });
      }
    });

    // Stop location sharing
    socket.on('location:stop-sharing', async (data) => {
      try {
        const { requestId } = data;
        
        if (!socket.userId) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        console.log(`Location sharing stopped by ${socket.userType} ${socket.userId} for request ${requestId}`);

        // Revoke permission
        await LocationService.revokeLocationPermission(requestId, socket.userType);

        // Notify the other party
        const request = await EmergencyRequest.findOne({ requestId });
        if (request) {
          const targetUserId = socket.userType === 'driver' ? request.patientId : request.driverId;
          const targetSocketId = connectedSockets.get(targetUserId);
          
          if (targetSocketId) {
            io.to(targetSocketId).emit('location:sharing-stopped', {
              requestId,
              stopperType: socket.userType,
              message: `${socket.userType === 'driver' ? 'Driver' : 'Patient'} has stopped sharing location`
            });
          }
        }

        socket.emit('location:stop-sharing-success', { requestId });

      } catch (error) {
        console.error('Stop location sharing error:', error);
        socket.emit('error', { message: 'Failed to stop location sharing' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      if (socket.userId && socket.userType === 'driver') {
        try {
          await Driver.findOneAndUpdate(
            { driverId: socket.userId },
            { 
              isOnline: false,
              socketId: ''
            }
          );
          console.log(`Driver ${socket.userId} is now offline`);
        } catch (error) {
          console.error('Error updating driver status on disconnect:', error);
        }
      }
      
      // Remove from connected sockets Map
      if (socket.userId) {
        connectedSockets.delete(socket.userId);
      }
    });
  });

  console.log('Socket.IO initialized');
  return io;
}

// Export io instance for use in other modules
export { io };

// Function to send message to specific socket ID
export function sendMessageToSocketId(socketId, messageObject) {
  if (io && socketId) {
    io.to(socketId).emit(messageObject.type, messageObject.data);
    return true;
  }
  return false;
}

// Function to broadcast to all drivers
export function broadcastToDrivers(messageObject) {
  if (io) {
    console.log(`Broadcasting to drivers: ${messageObject.type}`, messageObject.data);
    io.to('drivers').emit(messageObject.type, messageObject.data);
    return true;
  }
  return false;
}

// Function to get socket.io instance
export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

// Function to get user's socket ID
export function getSocketId(userId) {
  return connectedSockets.get(userId);
} 