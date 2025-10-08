import { io, Socket } from 'socket.io-client';

const SOCKET_BASE = import.meta.env.VITE_SOCKET_BASE || import.meta.env.VITE_API_BASE || 'http://localhost:5000';

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Normalize various backend alert payload shapes to the UI Alert shape
  private normalizeAlert(raw: any) {
    try {
      const r = raw || {};
      // handle nested structures or metadata
      const meta = r.metadata || r.meta || {};
      // map common variations
      const alert = {
        id: r.id ?? r.alert_id ?? r._id ?? undefined,
        symbol: r.symbol ?? r.ticker ?? r.sym ?? '',
        alert_type: r.alert_type ?? r.type ?? r.pattern_type ?? r.name ?? 'Pattern',
        message: r.message ?? meta.message ?? undefined,
        confidence: typeof r.confidence === 'number' ? r.confidence : (typeof r.conf === 'number' ? r.conf : (typeof meta.confidence === 'number' ? meta.confidence : undefined)),
        confidence_pct: typeof r.confidence_pct === 'number' ? r.confidence_pct : (typeof r.confidence === 'number' ? Math.round(r.confidence * 1000) / 10 : undefined),
        price: typeof r.price === 'number' ? r.price : (typeof r.entry === 'number' ? r.entry : undefined),
        timestamp: r.timestamp ?? r.created_at ?? r.detected_at ?? new Date().toISOString(),
      } as any;
      if (alert.confidence_pct == null && typeof alert.confidence === 'number') {
        alert.confidence_pct = Math.round(alert.confidence * 1000) / 10;
      }
      return alert;
    } catch {
      return raw;
    }
  }

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      const forcePolling = (import.meta.env.VITE_SOCKET_TRANSPORT?.toLowerCase?.() === 'polling') || import.meta.env.PROD;
      this.socket = io(SOCKET_BASE, {
        transports: forcePolling ? ['polling'] : ['websocket', 'polling'],
        timeout: 10000,
        withCredentials: false,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id, 'to', SOCKET_BASE);
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
    this.socket.on('pattern_alert', (payload: any) => {
      const norm = this.normalizeAlert(payload);
      console.debug('[socket] pattern_alert', norm);
      callback(norm);
    });
    this.socket.on('new_alert', (payload: any) => {
      const norm = this.normalizeAlert(payload);
      console.debug('[socket] new_alert', norm);
      callback(norm);
    });
  }

  subscribeToScanResults(callback: (scanData: any) => void) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('subscribe_scan_results');
    this.socket.on('scan_update', (data: any) => {
      console.debug('[socket] scan_update', data?.symbol ?? '', data);
      callback(data);
    });
    // Also listen to background worker variant from Flask
    this.socket.on('market_scan_update', (data: any) => {
      console.debug('[socket] market_scan_update', data);
      callback(data);
    });
  }

  unsubscribeFromAlerts() {
    if (this.socket) {
      this.socket.off('pattern_alert');
      this.socket.off('new_alert');
    }
  }

  unsubscribeFromScanResults() {
    if (this.socket) {
      this.socket.off('scan_update');
      this.socket.off('market_scan_update');
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
