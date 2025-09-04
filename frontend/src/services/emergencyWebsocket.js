// Emergency WebSocket service that connects to the main backend Socket.IO server
import { io } from 'socket.io-client';

let singletonInstance = null;

class WebSocketService {
  constructor() {
    if (singletonInstance) {
      return singletonInstance;
    }
    singletonInstance = this;

    this.socket = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelayMs = 3000;
    this.messageQueue = [];
    this.isConnecting = false;
  }

  connect() {
    if (this.socket?.connected) {
      console.log('Emergency Socket.IO already connected');
      return;
    }
    if (this.isConnecting) {
      console.log('Emergency Socket.IO connection already in progress');
      return;
    }
    this.isConnecting = true;
    try {
      // Connect to main backend Socket.IO server
      const backendUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';
      this.socket = io(backendUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelayMs,
        timeout: 10000
      });

      this.socket.on('connect', () => {
        console.log('Emergency Socket.IO connected successfully with ID:', this.socket.id);
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Auto-authenticate if we have user data
        try {
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          const userId = userData?._id || userData?.id;
          const userRole = userData?.role?.toLowerCase() || 'patient';
          
          if (userId) {
            console.log('Emergency: Auto-authenticating user on connect:', { userId, userRole });
            this.socket.emit('authenticate', { userId, userType: userRole });
          }
        } catch (error) {
          console.error('Emergency: Error during auto-authentication:', error);
        }

        // Send any queued messages
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          this.send(message.type, message.data);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Emergency Socket.IO disconnected:', reason);
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Emergency Socket.IO connection error:', error);
        this.isConnecting = false;
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts += 1;
            this.connect();
          }, this.reconnectDelayMs);
        }
      });

      this.socket.on('authenticated', (data) => {
        console.log('Emergency Socket.IO authenticated successfully:', data);
      });

      this.socket.on('error', (error) => {
        console.error('Emergency Socket.IO server error:', error);
      });

      // Handle emergency-specific events
      this.socket.on('new_request', (data) => {
        console.log('Emergency: Received new_request event:', data);
        this.broadcastToSubscribers('new_request', data);
      });

      this.socket.on('request_status_update', (data) => {
        console.log('Emergency: Received request_status_update event:', data);
        this.broadcastToSubscribers('request_status_update', data);
      });

      this.socket.on('driver_status_update', (data) => {
        console.log('Emergency: Received driver_status_update event:', data);
        this.broadcastToSubscribers('driver_status_update', data);
      });

      this.socket.on('accept_request', (data) => {
        console.log('Emergency: Received accept_request event:', data);
        this.broadcastToSubscribers('accept_request', data);
      });

      this.socket.on('reject_request', (data) => {
        console.log('Emergency: Received reject_request event:', data);
        this.broadcastToSubscribers('reject_request', data);
      });

      this.socket.on('request_received', (data) => {
        console.log('Emergency: Received request_received event:', data);
        this.broadcastToSubscribers('request_received', data);
      });

      this.socket.on('driver_location_update', (data) => {
        console.log('Emergency: Received driver_location_update event:', data);
        this.broadcastToSubscribers('driver_location_update', data);
      });

      // === LOCATION TRACKING EVENTS ===
      
      // Location permission events
      this.socket.on('location:permission-requested', (data) => {
        console.log('Emergency: Location permission requested:', data);
        this.broadcastToSubscribers('location:permission-requested', data);
      });

      this.socket.on('location:permission-granted', (data) => {
        console.log('Emergency: Location permission granted:', data);
        this.broadcastToSubscribers('location:permission-granted', data);
      });

      this.socket.on('location:permission-denied', (data) => {
        console.log('Emergency: Location permission denied:', data);
        this.broadcastToSubscribers('location:permission-denied', data);
      });

      this.socket.on('location:tracking-active', (data) => {
        console.log('Emergency: Location tracking is now active:', data);
        this.broadcastToSubscribers('location:tracking-active', data);
      });

      // Location update events
      this.socket.on('location:received', (data) => {
        console.log('Emergency: Received location update:', data);
        this.broadcastToSubscribers('location:received', data);
      });

      this.socket.on('location:update-success', (data) => {
        console.log('Emergency: Location update successful:', data);
        this.broadcastToSubscribers('location:update-success', data);
      });

      this.socket.on('location:distance-info', (data) => {
        console.log('Emergency: Received distance info:', data);
        this.broadcastToSubscribers('location:distance-info', data);
      });

      this.socket.on('location:sharing-stopped', (data) => {
        console.log('Emergency: Location sharing stopped:', data);
        this.broadcastToSubscribers('location:sharing-stopped', data);
      });

      // Location confirmation events
      this.socket.on('location:permission-request-sent', (data) => {
        console.log('Emergency: Location permission request sent:', data);
        this.broadcastToSubscribers('location:permission-request-sent', data);
      });

      this.socket.on('location:permission-granted-success', (data) => {
        console.log('Emergency: Location permission granted successfully:', data);
        this.broadcastToSubscribers('location:permission-granted-success', data);
      });

      this.socket.on('location:permission-denied-success', (data) => {
        console.log('Emergency: Location permission denied successfully:', data);
        this.broadcastToSubscribers('location:permission-denied-success', data);
      });

      this.socket.on('location:stop-sharing-success', (data) => {
        console.log('Emergency: Location sharing stopped successfully:', data);
        this.broadcastToSubscribers('location:stop-sharing-success', data);
      });

    } catch (error) {
      console.error('Error creating Emergency Socket.IO connection:', error);
      this.isConnecting = false;
    }
  }

  broadcastToSubscribers(eventName, data) {
    const subscribers = this.subscribers.get(eventName) || new Set();
    subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in emergency subscriber callback for "${eventName}":`, error);
      }
    });
  }

  subscribe(type, callback) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type).add(callback);
    console.log(`Emergency: Subscribed to ${type}, total subscribers:`, this.subscribers.get(type).size);
    return callback;
  }

  unsubscribe(type, callback) {
    const subscribers = this.subscribers.get(type);
    if (subscribers) {
      subscribers.delete(callback);
      console.log(`Emergency: Unsubscribed from ${type}, remaining subscribers:`, subscribers.size);
    }
  }

  send(type, data) {
    const message = {
      ...data,
      timestamp: new Date().toISOString()
    };

    if (this.socket?.connected) {
      console.log(`Emergency: Sending Socket.IO event "${type}":`, message);
      this.socket.emit(type, message);
    } else {
      console.log(`Emergency: Socket.IO not connected, queueing event "${type}":`, message);
      this.messageQueue.push({ type, data });
      if (!this.isConnecting) {
        this.connect();
      }
    }
  }

  // Handle authentication (for compatibility with existing code)
  authenticate(userId, userType) {
    console.log('Emergency: Manual authentication requested:', { userId, userType });
    if (this.socket?.connected) {
      console.log('Emergency: Sending authentication directly');
      this.socket.emit('authenticate', { userId, userType });
    } else {
      console.log('Emergency: Socket not connected, authentication will happen auto on connect');
      this.connect();
    }
  }

  // === LOCATION CONVENIENCE METHODS ===

  /**
   * Request location sharing permission
   * @param {string} requestId 
   */
  requestLocationPermission(requestId) {
    this.send('location:request-permission', { requestId });
  }

  /**
   * Grant location sharing permission
   * @param {string} requestId 
   */
  grantLocationPermission(requestId) {
    this.send('location:grant-permission', { requestId });
  }

  /**
   * Deny location sharing permission
   * @param {string} requestId 
   */
  denyLocationPermission(requestId) {
    this.send('location:deny-permission', { requestId });
  }

  /**
   * Send location update
   * @param {string} requestId 
   * @param {object} locationData 
   */
  sendLocationUpdate(requestId, locationData) {
    this.send('location:update', {
      requestId,
      ...locationData
    });
  }

  /**
   * Request distance and ETA information
   * @param {string} requestId 
   */
  requestDistanceInfo(requestId) {
    this.send('location:get-distance', { requestId });
  }

  /**
   * Stop location sharing
   * @param {string} requestId 
   */
  stopLocationSharing(requestId) {
    this.send('location:stop-sharing', { requestId });
  }

  /**
   * Subscribe to location-related events for a specific request
   * @param {string} requestId 
   * @param {object} callbacks 
   * @returns {function} Cleanup function
   */
  subscribeToLocationUpdates(requestId, callbacks = {}) {
    const {
      onLocationReceived,
      onPermissionRequested,
      onPermissionGranted,
      onPermissionDenied,
      onTrackingActive,
      onDistanceInfo,
      onSharingStoped,
      onError
    } = callbacks;

    const subscriptions = [];

    if (onLocationReceived) {
      const handler = (data) => {
        if (data.requestId === requestId) onLocationReceived(data);
      };
      subscriptions.push(['location:received', handler]);
      this.subscribe('location:received', handler);
    }

    if (onPermissionRequested) {
      const handler = (data) => {
        if (data.requestId === requestId) onPermissionRequested(data);
      };
      subscriptions.push(['location:permission-requested', handler]);
      this.subscribe('location:permission-requested', handler);
    }

    if (onPermissionGranted) {
      const handler = (data) => {
        if (data.requestId === requestId) onPermissionGranted(data);
      };
      subscriptions.push(['location:permission-granted', handler]);
      this.subscribe('location:permission-granted', handler);
    }

    if (onPermissionDenied) {
      const handler = (data) => {
        if (data.requestId === requestId) onPermissionDenied(data);
      };
      subscriptions.push(['location:permission-denied', handler]);
      this.subscribe('location:permission-denied', handler);
    }

    if (onTrackingActive) {
      const handler = (data) => {
        if (data.requestId === requestId) onTrackingActive(data);
      };
      subscriptions.push(['location:tracking-active', handler]);
      this.subscribe('location:tracking-active', handler);
    }

    if (onDistanceInfo) {
      const handler = (data) => {
        if (data.requestId === requestId) onDistanceInfo(data);
      };
      subscriptions.push(['location:distance-info', handler]);
      this.subscribe('location:distance-info', handler);
    }

    if (onSharingStoped) {
      const handler = (data) => {
        if (data.requestId === requestId) onSharingStoped(data);
      };
      subscriptions.push(['location:sharing-stopped', handler]);
      this.subscribe('location:sharing-stopped', handler);
    }

    if (onError) {
      const handler = (data) => {
        onError(data);
      };
      subscriptions.push(['error', handler]);
      this.subscribe('error', handler);
    }

    // Return cleanup function
    return () => {
      subscriptions.forEach(([eventType, handler]) => {
        this.unsubscribe(eventType, handler);
      });
    };
  }

  // Disconnect method
  disconnect() {
    if (this.socket) {
      console.log('Emergency: Disconnecting Socket.IO...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.messageQueue = [];
      this.subscribers.clear();
    }
  }
}

export const websocketService = new WebSocketService();