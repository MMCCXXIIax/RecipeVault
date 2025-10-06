export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface Pattern {
  symbol: string;
  pattern_name: string;
  confidence: number;
  pattern_type: 'bullish' | 'bearish' | 'neutral';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  symbol: string;
  alert_type: string;
  confidence_pct: number;
  price: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entry_price: number;
  current_price: number;
  pnl: number;
  pnl_percent: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: string;
  pattern?: string;
  confidence?: number;
}

export interface ScannerStatus {
  active: boolean;
  last_scan: string;
  patterns_found: number;
  symbols_scanned: number;
}

export interface BacktestResult {
  total_return: number;
  win_rate: number;
  profit_factor: number;
  total_trades: number;
  avg_trade: number;
  max_drawdown: number;
  sharpe_ratio: number;
  trades: BacktestTrade[];
}

export interface BacktestTrade {
  date: string;
  type: 'LONG' | 'SHORT';
  entry_price: number;
  exit_price: number;
  quantity: number;
  pnl: number;
  return_pct: number;
}

export interface SentimentData {
  symbol: string;
  overall_sentiment: number;
  bullish_percent: number;
  neutral_percent: number;
  bearish_percent: number;
  volume: number;
  mentions: number;
}

export interface RiskAnalysis {
  risk_reward_ratio: string;
  max_loss: number;
  position_risk_percent: number;
  recommendation: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
}
