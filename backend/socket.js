import { Server } from 'socket.io';
import Driver from './models/emergency/driver.model.js';
import EmergencyRequest from './models/emergency/emergencyRequest.model.js';

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
        
        // If it's a driver, update their socket ID in DB
        if (userType === 'driver') {
          try {
            await Driver.findOneAndUpdate(
              { driverId: userId },
              { 
                socketId: socket.id,
                isOnline: true,
                'currentLocation.lastUpdated': new Date()
              },
              { upsert: true, new: true }
            );
            console.log(`Driver ${userId} is now online with socket ${socket.id}`);
            
            // Join driver room for broadcasting
            socket.join('drivers');
          } catch (error) {
            console.error('Error updating driver status:', error);
          }
        } else if (userType === 'patient') {
          // Join patients room
          socket.join('patients');
          console.log(`Patient ${userId} is now online with socket ${socket.id}`);
        } else if (userType === 'customercare') {
          // Customer care agents group
          socket.join('customer-care');
          console.log(`CustomerCare ${userId} is now online with socket ${socket.id}`);
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
        io.to('drivers').emit('new_request', data);
        
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
        // Broadcast to all customer care agents
        io.to('customer-care').emit('chat:new', data);
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
    
    // Handle request acceptance from driver
    socket.on('accept_request', async (data) => {
      try {
        console.log('Driver accepting request:', data);
        
        if (!socket.userId || socket.userType !== 'driver') {
          return socket.emit('error', { message: 'Unauthorized - Only drivers can accept requests' });
        }
        
        const { requestId, driver } = data;
        
        // Update request in database
        try {
          const updatedRequest = await EmergencyRequest.findOneAndUpdate(
            { requestId },
            { 
              status: 'accepted',
              driverId: driver.id || socket.userId,
              driverInfo: driver,
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
          driverId: driver.id || socket.userId,
          driver: driver
        });
        
        // Forward the acceptance to the patient who made the request
        const patient = await EmergencyRequest.findOne({ requestId }).select('patientId');
        if (patient && patient.patientId) {
          const patientSocketId = connectedSockets.get(patient.patientId);
          if (patientSocketId) {
            io.to(patientSocketId).emit('request_status_update', {
              requestId,
              status: 'accepted',
              driver: driver
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

    // Update driver location
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