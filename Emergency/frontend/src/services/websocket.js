// Create a single instance of WebSocketService
let instance = null;

class WebSocketService {
  constructor() {
    if (instance) {
      return instance;
    }
    instance = this;

    this.ws = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000; // 2 seconds
    this.messageQueue = [];
    this.isConnecting = false;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return;
    }

    this.isConnecting = true;
    console.log('Connecting to WebSocket...');

    try {
      this.ws = new WebSocket('ws://localhost:3001');

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        // Send any queued messages
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          this.send(message.type, message.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, this.reconnectDelay);
        } else {
          console.log('Max reconnection attempts reached');
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received WebSocket message:', message);
          
          // Broadcast to all subscribers of this message type
          const subscribers = this.subscribers.get(message.type) || [];
          subscribers.forEach(callback => {
            try {
              callback(message);
            } catch (error) {
              console.error('Error in subscriber callback:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
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
      type,
      data,
      timestamp: new Date().toISOString()
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.log('WebSocket not connected, queueing message:', message);
      this.messageQueue.push(message);
      if (!this.isConnecting) {
        this.connect();
      }
    }
  }
}

// Export a single instance
export const websocketService = new WebSocketService(); 