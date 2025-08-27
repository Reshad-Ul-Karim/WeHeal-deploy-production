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
            this.socket.emit('authenticate', { userId, userType });
          }
        } catch (_) {
          // ignore
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

      // Handle all event types dynamically
      this.socket.onAny((eventName, ...args) => {
        console.log(`Received Socket.IO event "${eventName}":`, args[0]);
        
        // Broadcast to all subscribers of this message type
        const subscribers = this.subscribers.get(eventName) || [];
        subscribers.forEach(callback => {
          try {
            callback(args[0]);
          } catch (error) {
            console.error(`Error in subscriber callback for "${eventName}":`, error);
          }
        });
      });
    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
      this.isConnecting = false;
    }
  }

  subscribe(type, callback) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type).add(callback);
    return callback; // Return the callback for unsubscribing
  }

  unsubscribe(type, callback) {
    const subscribers = this.subscribers.get(type);
    if (subscribers) {
      subscribers.delete(callback);
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
}

// Export a single instance
export const websocketService = new WebSocketService(); 