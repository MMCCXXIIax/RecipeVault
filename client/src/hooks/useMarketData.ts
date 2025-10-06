import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketAPI, scannerAPI, patternAPI, alertsAPI, paperTradingAPI } from '@/lib/apiClient';
import type { MarketData, Pattern, Alert, Position, ScannerStatus } from '@/types';

export function useMarketScan(type: 'trending' | 'volume') {
  return useQuery<{ success: boolean; data: MarketData[] }>({
    queryKey: ['/api/market-scan', type],
    queryFn: () => marketAPI.getMarketScan(type) as Promise<{ success: boolean; data: MarketData[] }>,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarketData(symbol: string) {
  return useQuery<{ success: boolean; data: MarketData }>({
    queryKey: ['/api/market', symbol],
    queryFn: () => marketAPI.getMarketData(symbol) as Promise<{ success: boolean; data: MarketData }>,
    refetchInterval: 5000, // Refetch every 5 seconds
    enabled: !!symbol,
  });
}

export function useCandles(symbol: string, period: string, interval: string) {
  return useQuery({
    queryKey: ['/api/candles', symbol, period, interval],
    queryFn: () => marketAPI.getCandles(symbol, period, interval),
    refetchInterval: 60000, // Refetch every minute
    enabled: !!symbol,
  });
}

export function useScannerStatus() {
  return useQuery<{ success: boolean; data: ScannerStatus }>({
    queryKey: ['/api/scan/status'],
    queryFn: () => scannerAPI.getStatus() as Promise<{ success: boolean; data: ScannerStatus }>,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function usePatternDetection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (symbol: string) => patternAPI.detectPatterns(symbol),
    onSuccess: () => {
      // Invalidate pattern-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/pattern-stats'] });
    },
  });
}

export function useActiveAlerts() {
  return useQuery<{ success: boolean; data: Alert[] }>({
    queryKey: ['/api/get_active_alerts'],
    queryFn: () => alertsAPI.getActiveAlerts() as Promise<{ success: boolean; data: Alert[] }>,
    refetchInterval: 15000, // Refetch every 15 seconds
  });
}

export function usePaperTrades() {
  return useQuery<{ success: boolean; data: Position[] }>({
    queryKey: ['/api/paper-trades'],
    queryFn: () => paperTradingAPI.getTrades() as Promise<{ success: boolean; data: Position[] }>,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function usePlaceTrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: paperTradingAPI.placeTrade,
    onSuccess: () => {
      // Invalidate paper trading related queries
      queryClient.invalidateQueries({ queryKey: ['/api/paper-trades'] });
    },
  });
}

export function useClosePosition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: paperTradingAPI.closePosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/paper-trades'] });
    },
  });
}

export function useStartScanner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (config: { symbols?: string[], interval: number, auto_alerts: boolean }) => 
      scannerAPI.startScan(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scan/status'] });
    },
  });
}

export function useStopScanner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => scannerAPI.stopScan(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scan/status'] });
    },
  });
}
