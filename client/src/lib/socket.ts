import { io, Socket } from 'socket.io-client';

const SOCKET_BASE = import.meta.env.VITE_SOCKET_BASE || import.meta.env.VITE_API_BASE || 'http://localhost:5000';

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      this.socket = io(SOCKET_BASE, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        this.reconnectAttempts = 0;
        resolve(this.socket!);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, reconnect manually
          this.reconnect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        if (this.reconnectAttempts === 0) {
          reject(error);
        }
      });

      this.socket.on('connection_status', (data) => {
        console.log('Connection status:', data);
      });

      // Handle reconnection
      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
      });
    });
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnection attempt ${this.reconnectAttempts}`);

    setTimeout(() => {
      this.socket?.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToAlerts(callback: (alert: any) => void) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    
    this.socket.emit('subscribe_alerts');
    this.socket.on('pattern_alert', callback);
  }

  subscribeToScanResults(callback: (scanData: any) => void) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    
    this.socket.emit('subscribe_scan_results');
    this.socket.on('scan_update', callback);
  }

  unsubscribeFromAlerts() {
    if (this.socket) {
      this.socket.off('pattern_alert');
    }
  }

  unsubscribeFromScanResults() {
    if (this.socket) {
      this.socket.off('scan_update');
    }
  }

  onSubscriptionStatus(callback: (status: any) => void) {
    if (this.socket) {
      this.socket.on('subscription_status', callback);
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketManager = new SocketManager();
export default socketManager;
