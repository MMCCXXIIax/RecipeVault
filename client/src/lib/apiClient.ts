import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    apiClient.get(`/api/market-scan?type=${type}`),
  
  getMarketData: (symbol: string) => 
    apiClient.get(`/api/market/${symbol}`),
  
  getCandles: (symbol: string, period: string, interval: string) => 
    apiClient.get(`/api/candles?symbol=${symbol}&period=${period}&interval=${interval}`),
};

export const scannerAPI = {
  startScan: (config: { symbols?: string[], interval: number, auto_alerts: boolean }) =>
    apiClient.post('/api/scan/start', config),
  
  stopScan: () => 
    apiClient.post('/api/scan/stop'),
  
  getStatus: () => 
    apiClient.get('/api/scan/status'),
  
  getConfig: () => 
    apiClient.get('/api/scan/config'),
  
  updateConfig: (config: any) => 
    apiClient.post('/api/scan/config', config),
};

export const patternAPI = {
  detectPatterns: (symbol: string) => 
    apiClient.post('/api/detect-enhanced', { symbol }),
  
  getPatternStats: () => 
    apiClient.get('/api/pattern-stats'),
  
  getPatternsList: () => 
    apiClient.get('/api/patterns/list'),
  
  explainPattern: (patternName: string) => 
    apiClient.get(`/api/explain/pattern/${patternName}`),
  
  explainAlert: (alertData: { alert_id?: string, alert_type?: string, symbol?: string }) =>
    apiClient.post('/api/explain/alert', alertData),
};

export const sentimentAPI = {
  getSentiment: (symbol: string) => 
    apiClient.get(`/api/sentiment/${symbol}`),
  
  enhanceConfidence: (data: any) => 
    apiClient.post('/api/sentiment/enhance-confidence', data),
  
  alertCondition: (data: any) => 
    apiClient.post('/api/sentiment/alert-condition', data),
  
  getTwitterHealth: () => 
    apiClient.get('/api/sentiment/twitter-health'),
};

export const signalsAPI = {
  getEntryExitSignals: (symbol: string, timeframe: string, type: string = 'all') =>
    apiClient.get(`/api/signals/entry-exit?symbol=${symbol}&timeframe=${timeframe}&type=${type}`),
  
  createSignals: (data: { symbols: string[], timeframe: string, min_confidence: number }) =>
    apiClient.post('/api/signals/entry-exit', data),
};

export const alertsAPI = {
  getActiveAlerts: () => 
    apiClient.get('/api/get_active_alerts'),
  
  dismissAlert: (alertId: number) => 
    apiClient.post(`/api/alerts/dismiss/${alertId}`),
  
  handleAlertResponse: (data: { alert_id: string, response: string, action?: string }) =>
    apiClient.post('/api/handle_alert_response', data),
};

export const paperTradingAPI = {
  getTrades: () => 
    apiClient.get('/api/paper-trades'),
  
  placeTrade: (data: { 
    symbol: string, 
    side: 'BUY' | 'SELL', 
    quantity: number, 
    price?: number, 
    pattern?: string, 
    confidence?: number 
  }) =>
    apiClient.post('/api/paper-trades', data),
  
  closePosition: (data: { symbol?: string, trade_id?: string }) =>
    apiClient.post('/api/close-position', data),
};

export const backtestAPI = {
  getStrategies: () => 
    apiClient.get('/api/strategies'),
  
  runBacktest: (data: any) => 
    apiClient.post('/api/backtest', data),
  
  runPatternBacktest: (data: any) => 
    apiClient.post('/api/backtest/pattern', data),
  
  runStrategyBacktest: (data: any) => 
    apiClient.post('/api/backtest/strategy', data),
};

export const analyticsAPI = {
  getAnalyticsSummary: () => 
    apiClient.get('/api/analytics/summary'),
  
  getTradingStats: () => 
    apiClient.get('/api/trading-stats'),
  
  getDetectionStats: () => 
    apiClient.get('/api/detection_stats'),
  
  getDetectionLogs: (params: { limit?: number, offset?: number, symbol?: string, pattern?: string }) =>
    apiClient.get('/api/detection_logs', { params }),
  
  exportDetectionLogs: (params: { symbol?: string, pattern?: string, days?: number }) =>
    apiClient.get('/api/export_detection_logs', { params }),
};

export const riskAPI = {
  getRiskSettings: () => 
    apiClient.get('/api/risk-settings'),
  
  updateRiskSettings: (data: any) => 
    apiClient.post('/api/risk-settings', data),
  
  preTradeCheck: (data: {
    symbol: string,
    position_size: number,
    entry_price: number,
    stop_loss?: number,
    take_profit?: number
  }) =>
    apiClient.post('/api/risk/pre-trade-check', data),
};

export const recommendationAPI = {
  getCompleteRecommendation: (symbol: string) => 
    apiClient.get(`/api/recommend/complete?symbol=${symbol}`),
};

export const dataAPI = {
  getAssetsList: () => 
    apiClient.get('/api/assets/list'),
  
  getFeatures: () => 
    apiClient.get('/api/features'),
  
  getCoverage: () => 
    apiClient.get('/api/coverage'),
};

export const profileAPI = {
  saveProfile: (data: {
    user_id: string,
    email?: string,
    display_name?: string,
    avatar_url?: string,
    preferences?: Record<string, any>
  }) =>
    apiClient.post('/api/save-profile', data),
};
