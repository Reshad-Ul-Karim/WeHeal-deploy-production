import { WebSocketServer as WSServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

class WebSocketServer {
  constructor(server) {
    this.wss = new WSServer({ server });
    this.clients = new Map(); // Map to store connected clients

    this.wss.on('connection', (ws) => {
      const clientId = uuidv4();
      this.clients.set(clientId, ws);
      console.log(`Client connected: ${clientId}`);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('Received message:', data);

          // Handle different message types
          switch (data.type) {
            case 'new_request':
              this.broadcastToAll(data, clientId);
              break;

            case 'accept_request':
              this.broadcastToAll(data, clientId);
              // Also broadcast a request_status_update
              this.broadcastToAll({
                type: 'request_status_update',
                data: {
                  requestId: data.data.requestId,
                  status: 'accepted',
                  driver: data.data.driver,
                  timestamp: new Date().toISOString()
                }
              }, clientId);
              break;

            case 'request_status_update':
              this.broadcastToAll(data, clientId);
              break;

            case 'driver_status_update':
              this.broadcastToAll(data, clientId);
              // Also broadcast a request_status_update
              this.broadcastToAll({
                type: 'request_status_update',
                data: {
                  requestId: data.data.requestId,
                  status: data.data.status,
                  driver: data.data.driver,
                  timestamp: new Date().toISOString()
                }
              }, clientId);
              break;

            case 'cancel_request':
              this.broadcastToAll(data, clientId);
              // Also broadcast a request_status_update
              this.broadcastToAll({
                type: 'request_status_update',
                data: {
                  requestId: data.data.requestId,
                  status: 'cancelled',
                  timestamp: new Date().toISOString()
                }
              }, clientId);
              break;

            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

      ws.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });
  }

  broadcastToAll(message, excludeClientId = null) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((ws, clientId) => {
      if (clientId !== excludeClientId && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
}

export default WebSocketServer; 