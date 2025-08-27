// Simple WebSocket service for Emergency UI. This is a basic stub that
// connects to a WebSocket endpoint and relays JSON messages by type.
// You can replace the URL or adapt this to use Socket.IO if needed.

let singletonInstance = null;

class WebSocketService {
  constructor() {
    if (singletonInstance) {
      return singletonInstance;
    }
    singletonInstance = this;

    this.websocket = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelayMs = 2000;
    this.messageQueue = [];
    this.isConnecting = false;
  }

  connect() {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      return;
    }
    if (this.isConnecting) {
      return;
    }
    this.isConnecting = true;
    try {
      // Adjust this URL to your WS endpoint if different
      this.websocket = new WebSocket('ws://localhost:5001');

      this.websocket.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        while (this.messageQueue.length > 0) {
          const queued = this.messageQueue.shift();
          this.send(queued.type, queued.data);
        }
      };

      this.websocket.onclose = () => {
        this.isConnecting = false;
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts += 1;
            this.connect();
          }, this.reconnectDelayMs);
        }
      };

      this.websocket.onerror = () => {
        this.isConnecting = false;
      };

      this.websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const listeners = this.subscribers.get(message.type) || [];
          listeners.forEach((cb) => {
            try { cb(message); } catch (_) { /* ignore */ }
          });
        } catch (_) {
          // ignore parse errors
        }
      };
    } catch (_) {
      this.isConnecting = false;
    }
  }

  subscribe(type, callback) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type).add(callback);
    return callback;
  }

  unsubscribe(type, callback) {
    const set = this.subscribers.get(type);
    if (set) set.delete(callback);
  }

  send(type, data) {
    const msg = { type, data, timestamp: new Date().toISOString() };
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(msg));
    } else {
      this.messageQueue.push(msg);
      if (!this.isConnecting) this.connect();
    }
  }
}

export const websocketService = new WebSocketService();


