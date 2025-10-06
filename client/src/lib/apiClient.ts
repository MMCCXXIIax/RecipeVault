import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export type ApiResponse<T> = { success: boolean; data: T };

// Request interceptor for error handling
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Return the full response data as-is (backend returns { success, data })
    return response.data as any;
  },
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (error.response?.status === 404) {
      throw new Error('API endpoint not found');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your connection.');
    }
    
    throw new Error(error.message || 'An unexpected error occurred');
  }
);

// API endpoints
export const marketAPI = {
  getMarketScan: (type: 'trending' | 'volume') =>
    apiClient
      .get<ApiResponse<any>>(`/api/market-scan?type=${type}`)
      .then((r) => r as unknown as ApiResponse<any>),

  getMarketData: (symbol: string) =>
    apiClient
      .get<ApiResponse<any>>(`/api/market/${symbol}`)
      .then((r) => r as unknown as ApiResponse<any>),

  getCandles: (symbol: string, period: string, interval: string) =>
    apiClient
      .get<ApiResponse<any>>(
        `/api/candles?symbol=${symbol}&period=${period}&interval=${interval}`,
      )
      .then((r) => r as unknown as ApiResponse<any>),
};

export const scannerAPI = {
  startScan: (config: { symbols?: string[]; interval: number; auto_alerts: boolean }) =>
    apiClient.post<ApiResponse<any>>('/api/scan/start', config).then((r) => r as unknown as ApiResponse<any>),

  stopScan: () => apiClient.post<ApiResponse<any>>('/api/scan/stop').then((r) => r as unknown as ApiResponse<any>),

  getStatus: () => apiClient.get<ApiResponse<any>>('/api/scan/status').then((r) => r as unknown as ApiResponse<any>),

  getConfig: () => apiClient.get<ApiResponse<any>>('/api/scan/config').then((r) => r as unknown as ApiResponse<any>),

  updateConfig: (config: any) =>
    apiClient.post<ApiResponse<any>>('/api/scan/config', config).then((r) => r as unknown as ApiResponse<any>),
};

export const patternAPI = {
  detectPatterns: (symbol: string) =>
    apiClient.post<ApiResponse<any>>('/api/detect-enhanced', { symbol }).then((r) => r as unknown as ApiResponse<any>),

  getPatternStats: () =>
    apiClient.get<ApiResponse<any>>('/api/pattern-stats').then((r) => r as unknown as ApiResponse<any>),

  getPatternsList: () =>
    apiClient.get<ApiResponse<any>>('/api/patterns/list').then((r) => r as unknown as ApiResponse<any>),

  explainPattern: (patternName: string) =>
    apiClient.get<ApiResponse<any>>(`/api/explain/pattern/${patternName}`).then((r) => r as unknown as ApiResponse<any>),

  explainAlert: (alertData: { alert_id?: string; alert_type?: string; symbol?: string }) =>
    apiClient.post<ApiResponse<any>>('/api/explain/alert', alertData).then((r) => r as unknown as ApiResponse<any>),
};

export const sentimentAPI = {
  getSentiment: (symbol: string) =>
    apiClient.get<ApiResponse<any>>(`/api/sentiment/${symbol}`).then((r) => r as unknown as ApiResponse<any>),

  enhanceConfidence: (data: any) =>
    apiClient.post<ApiResponse<any>>('/api/sentiment/enhance-confidence', data).then((r) => r as unknown as ApiResponse<any>),

  alertCondition: (data: any) =>
    apiClient.post<ApiResponse<any>>('/api/sentiment/alert-condition', data).then((r) => r as unknown as ApiResponse<any>),

  getTwitterHealth: () =>
    apiClient.get<ApiResponse<any>>('/api/sentiment/twitter-health').then((r) => r as unknown as ApiResponse<any>),
};

export const signalsAPI = {
  getEntryExitSignals: (symbol: string, timeframe: string, type: string = 'all') =>
    apiClient
      .get<ApiResponse<any>>(
        `/api/signals/entry-exit?symbol=${symbol}&timeframe=${timeframe}&type=${type}`,
      )
      .then((r) => r as unknown as ApiResponse<any>),

  createSignals: (data: { symbols: string[]; timeframe: string; min_confidence: number }) =>
    apiClient.post<ApiResponse<any>>('/api/signals/entry-exit', data).then((r) => r as unknown as ApiResponse<any>),
};

export const alertsAPI = {
  getActiveAlerts: () =>
    apiClient.get<ApiResponse<any>>('/api/get_active_alerts').then((r) => r as unknown as ApiResponse<any>),

  dismissAlert: (alertId: number) =>
    apiClient.post<ApiResponse<any>>(`/api/alerts/dismiss/${alertId}`).then((r) => r as unknown as ApiResponse<any>),

  handleAlertResponse: (data: { alert_id: string; response: string; action?: string }) =>
    apiClient.post<ApiResponse<any>>('/api/handle_alert_response', data).then((r) => r as unknown as ApiResponse<any>),
};

export const paperTradingAPI = {
  getTrades: () => apiClient.get<ApiResponse<any>>('/api/paper-trades').then((r) => r as unknown as ApiResponse<any>),

  placeTrade: (data: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price?: number;
    pattern?: string;
    confidence?: number;
  }) => apiClient.post<ApiResponse<any>>('/api/paper-trades', data).then((r) => r as unknown as ApiResponse<any>),

  closePosition: (data: { symbol?: string; trade_id?: string }) =>
    apiClient.post<ApiResponse<any>>('/api/close-position', data).then((r) => r as unknown as ApiResponse<any>),
};

export const backtestAPI = {
  getStrategies: () => apiClient.get<ApiResponse<any>>('/api/strategies').then((r) => r as unknown as ApiResponse<any>),

  runBacktest: (data: any) => apiClient.post<ApiResponse<any>>('/api/backtest', data).then((r) => r as unknown as ApiResponse<any>),

  runPatternBacktest: (data: any) =>
    apiClient.post<ApiResponse<any>>('/api/backtest/pattern', data).then((r) => r as unknown as ApiResponse<any>),

  runStrategyBacktest: (data: any) =>
    apiClient.post<ApiResponse<any>>('/api/backtest/strategy', data).then((r) => r as unknown as ApiResponse<any>),
};

export const analyticsAPI = {
  getAnalyticsSummary: () =>
    apiClient.get<ApiResponse<any>>('/api/analytics/summary').then((r) => r as unknown as ApiResponse<any>),

  getTradingStats: () =>
    apiClient.get<ApiResponse<any>>('/api/trading-stats').then((r) => r as unknown as ApiResponse<any>),

  getDetectionStats: () =>
    apiClient.get<ApiResponse<any>>('/api/detection_stats').then((r) => r as unknown as ApiResponse<any>),

  getDetectionLogs: (params: { limit?: number; offset?: number; symbol?: string; pattern?: string }) =>
    apiClient.get<ApiResponse<any>>('/api/detection_logs', { params }).then((r) => r as unknown as ApiResponse<any>),

  exportDetectionLogs: (params: { symbol?: string; pattern?: string; days?: number }) =>
    apiClient
      .get<ApiResponse<any>>('/api/export_detection_logs', { params })
      .then((r) => r as unknown as ApiResponse<any>),
};

export const riskAPI = {
  getRiskSettings: () =>
    apiClient.get<ApiResponse<any>>('/api/risk-settings').then((r) => r as unknown as ApiResponse<any>),

  updateRiskSettings: (data: any) =>
    apiClient.post<ApiResponse<any>>('/api/risk-settings', data).then((r) => r as unknown as ApiResponse<any>),

  preTradeCheck: (data: {
    symbol: string,
    position_size: number,
    entry_price: number,
    stop_loss?: number,
    take_profit?: number
  }) =>
    apiClient.post<ApiResponse<any>>('/api/risk/pre-trade-check', data).then((r) => r as unknown as ApiResponse<any>),
};

export const recommendationAPI = {
  getCompleteRecommendation: (symbol: string) =>
    apiClient
      .get<ApiResponse<any>>(`/api/recommend/complete?symbol=${symbol}`)
      .then((r) => r as unknown as ApiResponse<any>),
};

export const dataAPI = {
  getAssetsList: () => apiClient.get<ApiResponse<any>>('/api/assets/list').then((r) => r as unknown as ApiResponse<any>),

  getFeatures: () => apiClient.get<ApiResponse<any>>('/api/features').then((r) => r as unknown as ApiResponse<any>),

  getCoverage: () => apiClient.get<ApiResponse<any>>('/api/coverage').then((r) => r as unknown as ApiResponse<any>),
};

export const profileAPI = {
  saveProfile: (data: {
    user_id: string,
    email?: string,
    display_name?: string,
    avatar_url?: string,
    preferences?: Record<string, any>
  }) =>
    apiClient.post<ApiResponse<any>>('/api/save-profile', data).then((r) => r as unknown as ApiResponse<any>),
};
