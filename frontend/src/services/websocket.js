import { io } from 'socket.io-client';

// Create a single instance of WebSocketService (Socket.IO)
let instance = null;

class WebSocketService {
  constructor() {
    if (instance) {
      return instance;
    }
    instance = this;

    this.socket = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000; // 2 seconds
    this.messageQueue = [];
    this.isConnecting = false;
  }

  connect() {
    if (this.socket?.connected) {
      console.log('Socket.IO already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('Socket.IO connection already in progress');
      return;
    }

    this.isConnecting = true;
    console.log('Connecting to Socket.IO server...');

    try {
      // Create a Socket.IO client connection
      this.socket = io('http://localhost:5001', {
        path: '/socket.io',
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });

      this.socket.on('connect', () => {
        console.log('Socket.IO connected successfully with ID:', this.socket.id);
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Authenticate immediately after connection (before flushing queue)
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const userId = user?._id || user?.id; // support both _id and id
          const userType = (user?.role || user?.userRole || 'patient')
            .toString()
            .toLowerCase();
          if (userId) {
            console.log('Authenticating with:', { userId, userType });
            this.socket.emit('authenticate', { userId, userType });
          }
        } catch (error) {
          console.error('Error during authentication:', error);
        }

        // Now send any queued messages
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          this.send(message.type, message.data);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.isConnecting = false;
      });

      this.socket.on('authenticated', (data) => {
        console.log('Socket.IO authenticated successfully:', data);
      });

      this.socket.on('error', (error) => {
        console.error('Socket.IO server error:', error);
      });

      // Handle specific chat events
      this.socket.on('chat:new', (data) => {
        console.log('Received chat:new event:', data);
        this.broadcastToSubscribers('chat:new', data);
      });

      this.socket.on('chat:assigned', (data) => {
        console.log('Received chat:assigned event:', data);
        this.broadcastToSubscribers('chat:assigned', data);
      });

      this.socket.on('chat:message', (data) => {
        console.log('Received chat:message event:', data);
        this.broadcastToSubscribers('chat:message', data);
      });

      this.socket.on('chat:ended', (data) => {
        console.log('Received chat:ended event:', data);
        this.broadcastToSubscribers('chat:ended', data);
      });

    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
      this.isConnecting = false;
    }
  }

  broadcastToSubscribers(eventName, data) {
    const subscribers = this.subscribers.get(eventName) || [];
    subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in subscriber callback for "${eventName}":`, error);
      }
    });
  }

  subscribe(type, callback) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type).add(callback);
    console.log(`Subscribed to ${type}, total subscribers:`, this.subscribers.get(type).size);
    return callback; // Return the callback for unsubscribing
  }

  unsubscribe(type, callback) {
    const subscribers = this.subscribers.get(type);
    if (subscribers) {
      subscribers.delete(callback);
      console.log(`Unsubscribed from ${type}, remaining subscribers:`, subscribers.size);
    }
  }

  async send(type, data) {
    const message = {
      ...data,
      timestamp: new Date().toISOString()
    };

    if (this.socket?.connected) {
      console.log(`Sending Socket.IO event "${type}":`, message);
      this.socket.emit(type, message);
    } else {
      console.log(`Socket.IO not connected, queueing event "${type}":`, message);
      this.messageQueue.push({ type, data });
      if (!this.isConnecting) {
        this.connect();
      }
    }
  }

  // Disconnect method
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting Socket.IO...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.messageQueue = [];
      this.subscribers.clear();
    }
  }
}

// Export a single instance
export const websocketService = new WebSocketService(); 