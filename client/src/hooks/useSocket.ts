import { useEffect, useState, useCallback } from 'react';
import { socketManager } from '@/lib/socket';
import type { Alert, Pattern } from '@/types';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const connect = async () => {
      try {
        await socketManager.connect();
        setIsConnected(true);
        setConnectionError(null);
      } catch (error) {
        console.error('Socket connection failed:', error);
        setConnectionError(error instanceof Error ? error.message : 'Connection failed');
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      socketManager.disconnect();
      setIsConnected(false);
    };
  }, []);

  const subscribeToAlerts = useCallback((callback: (alert: Alert) => void) => {
    if (!isConnected) return;
    
    try {
      socketManager.subscribeToAlerts(callback);
    } catch (error) {
      console.error('Failed to subscribe to alerts:', error);
    }
  }, [isConnected]);

  const subscribeToScanResults = useCallback((callback: (scanData: any) => void) => {
    if (!isConnected) return;
    
    try {
      socketManager.subscribeToScanResults(callback);
    } catch (error) {
      console.error('Failed to subscribe to scan results:', error);
    }
  }, [isConnected]);

  const unsubscribeFromAlerts = useCallback(() => {
    socketManager.unsubscribeFromAlerts();
  }, []);

  const unsubscribeFromScanResults = useCallback(() => {
    socketManager.unsubscribeFromScanResults();
  }, []);

  return {
    isConnected,
    connectionError,
    subscribeToAlerts,
    subscribeToScanResults,
    unsubscribeFromAlerts,
    unsubscribeFromScanResults,
  };
}
