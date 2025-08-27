import { Server } from 'socket.io';
import Driver from './models/driver.model.js';
import EmergencyRequest from './models/emergencyRequest.model.js';

let io;

export function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Handle user connection
        socket.on('join', async (data) => {
            const { userId, userType } = data;

            if (userType === 'driver') {
                await Driver.findByIdAndUpdate(userId, { socketId: socket.id });
            }
        });

        // Handle driver location updates
        socket.on('update-location', async (data) => {
            const { driverId, location } = data;

            if (!location || !location.latitude || !location.longitude) {
                return socket.emit('error', { message: 'Invalid location data' });
            }

            const driver = await Driver.findById(driverId);
            if (!driver || !driver.currentRequest) return;

            const request = await EmergencyRequest.findById(driver.currentRequest)
                .populate('patient');

            if (request && request.patient.socketId) {
                io.to(request.patient.socketId).emit('driver-location-update', {
                    requestId: request._id,
                    location
                });
            }
        });

        // Handle driver status updates
        socket.on('update-status', async (data) => {
            const { driverId, status } = data;

            const driver = await Driver.findById(driverId);
            if (!driver || !driver.currentRequest) return;

            const request = await EmergencyRequest.findById(driver.currentRequest)
                .populate('patient');

            if (request && request.patient.socketId) {
                io.to(request.patient.socketId).emit('driver-status-update', {
                    requestId: request._id,
                    status
                });
            }
        });

        // Handle disconnection
        socket.on('disconnect', async () => {
            console.log(`Client disconnected: ${socket.id}`);
            
            // Update driver status if they were handling a request
            const driver = await Driver.findOne({ socketId: socket.id });
            if (driver) {
                driver.socketId = null;
                await driver.save();
            }
        });
    });
}

export function sendMessageToSocketId(socketId, messageObject) {
    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('Socket.io not initialized.');
    }
} 