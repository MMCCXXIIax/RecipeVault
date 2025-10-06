import React, { useState } from 'react';
import { 
  History, 
  Play, 
  TrendingUp, 
  Activity,
  Calendar,
  DollarSign,
  Target,
  Shield,
  BarChart3,
  Trophy,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { EquityCurveChart } from '@/components/charts/EquityCurveChart';
import { backtestAPI } from '@/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import type { BacktestResult, BacktestTrade } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface BacktestForm {
  strategy: string;
  symbol: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  position_size: number;
}

export default function Backtest() {
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // API Hooks
  const { data: strategiesData } = useQuery({
    queryKey: ['/api/strategies'],
    queryFn: () => backtestAPI.getStrategies(),
  });

  const backtestMutation = useMutation({
    mutationFn: (data: any) => backtestAPI.runBacktest(data),
    onSuccess: (result: any) => {
      if (result.success) {
        setBacktestResult(result.data);
        toast({
          title: "Backtest Complete",
          description: `Backtest completed with ${result.data.total_trades} trades`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Backtest Failed",
        description: error instanceof Error ? error.message : "Failed to run backtest",
        variant: "destructive",
      });
    },
  });

  // Form
  const { register, handleSubmit, watch, formState: { errors } } = useForm<BacktestForm>({
    defaultValues: {
      strategy: 'pattern_based',
      initial_capital: 100000,
      position_size: 10,
      start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
      end_date: new Date().toISOString().split('T')[0],
    }
  });

  const strategies = strategiesData?.data || [
    { id: 'pattern_based', name: 'Pattern-Based Trading' },
    { id: 'mean_reversion', name: 'Mean Reversion' },
    { id: 'momentum', name: 'Momentum Strategy' },
    { id: 'custom', name: 'Custom Strategy' },
  ];

  const onSubmit = async (data: BacktestForm) => {
    backtestMutation.mutate({
      strategy_type: data.strategy,
      symbol: data.symbol.toUpperCase(),
      start_date: data.start_date,
      end_date: data.end_date,
      initial_capital: data.initial_capital,
      position_size_percent: data.position_size,
    });
  };

  // Generate sample equity curve data if backtest result is available
  const generateEquityCurve = (result: BacktestResult) => {
    if (!result.trades || result.trades.length === 0) return [];
    
    let equity = 100000; // Starting capital
    const equityPoints = [{ date: result.trades[0].date, equity }];
    
    result.trades.forEach(trade => {
      equity += trade.pnl;
      equityPoints.push({ date: trade.date, equity });
    });
    
    return equityPoints;
  };

  const equityData = backtestResult ? generateEquityCurve(backtestResult) : [];

  return (
    <div className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Backtesting</h2>
        <p className="text-muted-foreground">Test your strategies against historical data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backtest Configuration & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Configuration Form */}
          <Card className="gradient-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5 text-primary" />
                <span>Configure Backtest</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strategy Selection */}
                  <div>
                    <Label htmlFor="strategy">Strategy</Label>
                    <Select 
                      onValueChange={(value) => register('strategy').onChange({ target: { value } })}
                      defaultValue="pattern_based"
                    >
                      <SelectTrigger className="mt-2" data-testid="select-strategy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {strategies.map((strategy: any) => (
                          <SelectItem key={strategy.id} value={strategy.id}>
                            {strategy.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Symbol */}
                  <div>
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input 
                      id="symbol"
                      placeholder="e.g., AAPL" 
                      {...register('symbol', { required: 'Symbol is required' })}
                      className="mt-2 uppercase"
                      data-testid="input-symbol"
                    />
                    {errors.symbol && (
                      <p className="text-xs text-destructive mt-1">{errors.symbol.message}</p>
                    )}
                  </div>

                  {/* Start Date */}
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input 
                      id="start_date"
                      type="date" 
                      {...register('start_date', { required: 'Start date is required' })}
                      className="mt-2"
                      data-testid="input-start-date"
                    />
                    {errors.start_date && (
                      <p className="text-xs text-destructive mt-1">{errors.start_date.message}</p>
                    )}
                  </div>

                  {/* End Date */}
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input 
                      id="end_date"
                      type="date" 
                      {...register('end_date', { required: 'End date is required' })}
                      className="mt-2"
                      data-testid="input-end-date"
                    />
                    {errors.end_date && (
                      <p className="text-xs text-destructive mt-1">{errors.end_date.message}</p>
                    )}
                  </div>

                  {/* Initial Capital */}
                  <div>
                    <Label htmlFor="initial_capital">Initial Capital ($)</Label>
                    <Input 
                      id="initial_capital"
                      type="number" 
                      placeholder="100000" 
                      {...register('initial_capital', { 
                        required: 'Initial capital is required',
                        min: { value: 1000, message: 'Minimum capital is $1,000' }
                      })}
                      className="mt-2 font-mono"
                      data-testid="input-initial-capital"
                    />
                    {errors.initial_capital && (
                      <p className="text-xs text-destructive mt-1">{errors.initial_capital.message}</p>
                    )}
                  </div>

                  {/* Position Size */}
                  <div>
                    <Label htmlFor="position_size">Position Size (%)</Label>
                    <Input 
                      id="position_size"
                      type="number" 
                      placeholder="10" 
                      {...register('position_size', { 
                        required: 'Position size is required',
                        min: { value: 1, message: 'Minimum position size is 1%' },
                        max: { value: 100, message: 'Maximum position size is 100%' }
                      })}
                      className="mt-2 font-mono"
                      data-testid="input-position-size"
                    />
                    {errors.position_size && (
                      <p className="text-xs text-destructive mt-1">{errors.position_size.message}</p>
                    )}
                  </div>
                </div>

                {/* Run Backtest Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground"
                  disabled={backtestMutation.isPending}
                  data-testid="button-run-backtest"
                >
                  {backtestMutation.isPending ? (
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run Backtest
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Equity Curve */}
          {backtestResult && (
            <Card className="gradient-card">
              <CardHeader className="border-b border-border">
                <CardTitle>Equity Curve</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <EquityCurveChart 
                  data={equityData}
                  initialCapital={backtestResult.total_trades > 0 ? equityData[0]?.equity || 100000 : 100000}
                  height={400}
                />
              </CardContent>
            </Card>
          )}

          {/* Trade List */}
          {backtestResult && backtestResult.trades && backtestResult.trades.length > 0 && (
            <Card className="gradient-card">
              <CardHeader className="border-b border-border">
                <CardTitle>Trade History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Date
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Type
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Entry
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Exit
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Qty
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          P&L
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Return
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {backtestResult.trades.slice(0, 10).map((trade, index) => (
                        <tr key={index} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(trade.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`badge-${trade.type === 'LONG' ? 'success' : 'danger'}`}>
                              {trade.type}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right font-mono">${trade.entry_price.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-mono">${trade.exit_price.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-mono">{trade.quantity}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-mono font-semibold ${trade.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-semibold ${trade.return_pct >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {trade.return_pct >= 0 ? '+' : ''}{trade.return_pct.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {backtestResult.trades.length > 10 && (
                  <div className="p-4 border-t border-border text-center">
                    <Button variant="ghost" size="sm" data-testid="button-view-all-trades">
                      View All {backtestResult.trades.length} Trades
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Performance Metrics & Analysis */}
        <div className="space-y-6">
          {/* Performance Summary */}
          {backtestResult ? (
            <Card className="gradient-card">
              <CardHeader className="border-b border-border">
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 rounded-lg border" style={{
                  backgroundColor: backtestResult.total_return >= 0 ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--destructive) / 0.1)',
                  borderColor: backtestResult.total_return >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'
                }}>
                  <p className="text-sm text-muted-foreground mb-1">Total Return</p>
                  <p className={`text-2xl font-bold font-mono ${backtestResult.total_return >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {backtestResult.total_return >= 0 ? '+' : ''}{backtestResult.total_return.toFixed(2)}%
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                    <span className="text-foreground font-semibold font-mono">
                      {backtestResult.win_rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Profit Factor</span>
                    <span className="text-foreground font-semibold font-mono">
                      {backtestResult.profit_factor.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Trades</span>
                    <span className="text-foreground font-semibold font-mono">
                      {backtestResult.total_trades}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg Trade</span>
                    <span className={`font-semibold font-mono ${backtestResult.avg_trade >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {backtestResult.avg_trade >= 0 ? '+' : ''}${backtestResult.avg_trade.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Max Drawdown</span>
                    <span className="text-destructive font-semibold font-mono">
                      {backtestResult.max_drawdown.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                    <span className="text-foreground font-semibold font-mono">
                      {backtestResult.sharpe_ratio.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="gradient-card">
              <CardHeader className="border-b border-border">
                <CardTitle>Ready to Test</CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Configure your backtest parameters and click "Run Backtest" to analyze strategy performance.
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Test strategies against historical data</p>
                  <p>• Analyze risk and return metrics</p>
                  <p>• Optimize position sizing</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Metrics */}
          {backtestResult && (
            <Card className="gradient-card">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-accent" />
                  <span>Risk Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Volatility</span>
                      <span className="text-foreground font-semibold">12.4%</span>
                    </div>
                    <Progress value={62} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Max Consecutive Losses</span>
                    <span className="text-destructive font-semibold font-mono">5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Largest Loss</span>
                    <span className="text-destructive font-semibold font-mono">
                      ${Math.abs(Math.min(...(backtestResult.trades?.map(t => t.pnl) || [0]))).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Recovery Factor</span>
                    <span className="text-foreground font-semibold font-mono">2.95</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strategy Comparison */}
          <Card className="gradient-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-secondary" />
                <span>Strategy Comparison</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Pattern-Based</span>
                  <span className="text-success font-semibold text-sm">
                    {backtestResult ? `${backtestResult.total_return >= 0 ? '+' : ''}${backtestResult.total_return.toFixed(1)}%` : '+24.8%'}
                  </span>
                </div>
                <Progress value={82} className="h-2" />
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Mean Reversion</span>
                  <span className="text-success font-semibold text-sm">+18.2%</span>
                </div>
                <Progress value={61} className="h-2" />
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Buy & Hold</span>
                  <span className="text-success font-semibold text-sm">+12.5%</span>
                </div>
                <Progress value={42} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
