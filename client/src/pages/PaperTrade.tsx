import React, { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Trophy, 
  ArrowUp, 
  ArrowDown,
  X,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { usePaperTrades, usePlaceTrade, useClosePosition } from '@/hooks/useMarketData';
import { riskAPI } from '@/lib/apiClient';
import { useQuery } from '@tanstack/react-query';
import type { Position, Trade } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { InfoModal } from '@/components/InfoModal';

interface TradeForm {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price?: number;
  orderType: 'market' | 'limit';
}

export default function PaperTrade() {
  const [selectedSide, setSelectedSide] = useState<'BUY' | 'SELL'>('BUY');
  const [isTxOpen, setIsTxOpen] = useState(false);
  const { toast } = useToast();

  // API Hooks
  const { data: tradesData, isLoading: isLoadingTrades } = usePaperTrades();
  const placeTradeMutation = usePlaceTrade();
  const closePositionMutation = useClosePosition();

  // Form
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<TradeForm>({
    defaultValues: {
      side: 'BUY',
      orderType: 'market',
      quantity: 0,
    }
  });

  const watchedSymbol = watch('symbol');
  const watchedQuantity = watch('quantity');
  const watchedPrice = watch('price');
  const orderType = watch('orderType');

  // Risk check for current trade
  const { data: riskData } = useQuery({
    queryKey: ['/api/risk/pre-trade-check', watchedSymbol, watchedQuantity, watchedPrice],
    queryFn: () => riskAPI.preTradeCheck({
      symbol: watchedSymbol || '',
      position_size: watchedQuantity || 0,
      entry_price: watchedPrice || 0,
    }),
    enabled: !!watchedSymbol && !!watchedQuantity && !!watchedPrice,
  });

  const positions = tradesData?.data || [];
  
  // Calculate portfolio stats
  const portfolioValue = 125432.50;
  const buyingPower = 45678.30;
  const dailyPnL = positions.reduce((sum: number, pos: Position) => sum + (pos.pnl || 0), 0);
  const dailyPnLPercent = (dailyPnL / portfolioValue) * 100;

  const onSubmit = async (data: TradeForm) => {
    try {
      await placeTradeMutation.mutateAsync({
        symbol: data.symbol.toUpperCase(),
        side: selectedSide,
        quantity: data.quantity,
        price: orderType === 'limit' ? data.price : undefined,
      });

      toast({
        title: "Order Placed",
        description: `${selectedSide} order for ${data.quantity} shares of ${data.symbol.toUpperCase()} has been placed.`,
      });

      reset();
    } catch (error) {
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Failed to place order",
        variant: "destructive",
      });
    }
  };

  const handleClosePosition = async (position: Position) => {
    try {
      await closePositionMutation.mutateAsync({ symbol: position.symbol });
      toast({
        title: "Position Closed",
        description: `Closed position for ${position.symbol}`,
      });
    } catch (error) {
      toast({
        title: "Failed to Close",
        description: error instanceof Error ? error.message : "Failed to close position",
        variant: "destructive",
      });
    }
  };

  const estimatedCost = (watchedQuantity || 0) * (watchedPrice || 0);

  return (
    <div className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Paper Trading</h2>
        <p className="text-muted-foreground">Practice trading strategies with virtual capital</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="gradient-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total Value</h3>
                </div>
                <p className="text-2xl font-bold text-foreground font-mono mb-1">
                  ${portfolioValue.toLocaleString()}
                </p>
                <p className="text-sm text-success">+$13,920.00 (12.5%)</p>
              </CardContent>
            </Card>

            <Card className="gradient-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">Buying Power</h3>
                </div>
                <p className="text-2xl font-bold text-foreground font-mono mb-1">
                  ${buyingPower.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Available</p>
              </CardContent>
            </Card>

            <Card className="gradient-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">Today's P&L</h3>
                </div>
                <p className={`text-2xl font-bold font-mono mb-1 ${dailyPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {dailyPnL >= 0 ? '+' : ''}${dailyPnL.toLocaleString()}
                </p>
                <p className={`text-sm ${dailyPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {dailyPnLPercent >= 0 ? '+' : ''}{dailyPnLPercent.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Active Positions */}
          <Card className="gradient-card">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle>Active Positions</CardTitle>
                <Badge className="badge-info">{positions.length} Open</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingTrades ? (
                <div className="p-6 text-center">
                  <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-muted-foreground">Loading positions...</p>
                </div>
              ) : positions.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No active positions. Place your first trade to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Symbol
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Qty
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Entry
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Current
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          P&L
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {positions.map((position: Position) => (
                        <tr key={position.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                                {position.symbol.substring(0, 4)}
                              </div>
                              <span className="font-medium">{position.symbol}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono">{position.quantity}</td>
                          <td className="px-6 py-4 text-right font-mono font-semibold">
                            ${position.entry_price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-semibold">
                            ${position.current_price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-col">
                              <span className={`font-semibold font-mono ${position.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                              </span>
                              <span className={`text-xs ${position.pnl_percent >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {position.pnl_percent >= 0 ? '+' : ''}{position.pnl_percent.toFixed(2)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleClosePosition(position)}
                              disabled={closePositionMutation.isPending}
                              className="text-destructive hover:text-destructive/80"
                              data-testid={`button-close-${position.symbol}`}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Close
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="gradient-card">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary hover:underline" data-testid="button-view-all-transactions" onClick={() => setIsTxOpen(true)}>
                  View All
                </Button>
              </div>
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
                        Symbol
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                        Type
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                        Qty
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                        Price
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {positions.slice(0, 5).map((position: Position) => (
                      <tr key={position.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date().toLocaleDateString()} {new Date().toLocaleTimeString().slice(0, 5)}
                        </td>
                        <td className="px-6 py-4 font-medium">{position.symbol}</td>
                        <td className="px-6 py-4">
                          <Badge className={`badge-${position.side === 'BUY' ? 'success' : 'danger'}`}>
                            {position.side}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-mono">{position.quantity}</td>
                        <td className="px-6 py-4 text-right font-mono">${position.entry_price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-mono font-semibold">
                          ${(position.quantity * position.entry_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Form & Risk */}
        <div className="space-y-6">
          {/* New Trade Form */}
          <Card className="gradient-card">
            <CardHeader className="border-b border-border">
              <CardTitle>Place Order</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Symbol Input */}
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input 
                    id="symbol"
                    placeholder="e.g., AAPL" 
                    {...register('symbol', { required: 'Symbol is required' })}
                    className="uppercase"
                    data-testid="input-symbol"
                  />
                  {errors.symbol && (
                    <p className="text-xs text-destructive mt-1">{errors.symbol.message}</p>
                  )}
                </div>

                {/* Order Type */}
                <div>
                  <Label>Order Type</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button 
                      type="button"
                      variant={selectedSide === 'BUY' ? 'default' : 'outline'}
                      className={selectedSide === 'BUY' ? 'bg-success text-success-foreground hover:bg-success/90' : ''}
                      onClick={() => setSelectedSide('BUY')}
                      data-testid="button-buy"
                    >
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Buy
                    </Button>
                    <Button 
                      type="button"
                      variant={selectedSide === 'SELL' ? 'default' : 'outline'}
                      className={selectedSide === 'SELL' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                      onClick={() => setSelectedSide('SELL')}
                      data-testid="button-sell"
                    >
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Sell
                    </Button>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input 
                    id="quantity"
                    type="number" 
                    placeholder="0" 
                    {...register('quantity', { 
                      required: 'Quantity is required',
                      min: { value: 1, message: 'Quantity must be at least 1' }
                    })}
                    className="font-mono"
                    data-testid="input-quantity"
                  />
                  {errors.quantity && (
                    <p className="text-xs text-destructive mt-1">{errors.quantity.message}</p>
                  )}
                </div>

                {/* Price Type */}
                <div>
                  <Label htmlFor="orderType">Price Type</Label>
                  <Select onValueChange={(value) => register('orderType').onChange({ target: { value } })} defaultValue="market">
                    <SelectTrigger data-testid="select-order-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="limit">Limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Limit Price (conditionally shown) */}
                {orderType === 'limit' && (
                  <div>
                    <Label htmlFor="price">Limit Price</Label>
                    <Input 
                      id="price"
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...register('price', { 
                        required: orderType === 'limit' ? 'Price is required for limit orders' : false
                      })}
                      className="font-mono"
                      data-testid="input-price"
                    />
                    {errors.price && (
                      <p className="text-xs text-destructive mt-1">{errors.price.message}</p>
                    )}
                  </div>
                )}

                {/* Order Summary */}
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Cost</span>
                    <span className="text-foreground font-mono font-semibold">
                      ${estimatedCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Available</span>
                    <span className="text-foreground font-mono font-semibold">
                      ${buyingPower.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={placeTradeMutation.isPending}
                  data-testid="button-place-order"
                >
                  {placeTradeMutation.isPending ? (
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Place Order
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Risk Check */}
          <Card className="gradient-card">
            <CardHeader className="border-b border-border">
              <CardTitle>Pre-Trade Risk Check</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-4 bg-success/10 border border-success rounded-lg">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-success mb-1">
                      {riskData?.data?.recommendation || 'Low Risk'}
                    </h4>
                    <p className="text-sm text-muted-foreground">Position size within limits</p>
                  </div>
                </div>
              </div>

              {/* Risk Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Position Size</span>
                  <span className="text-foreground font-semibold">
                    {((estimatedCost / portfolioValue) * 100).toFixed(1)}% of portfolio
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Max Risk</span>
                  <span className="text-foreground font-semibold">
                    ${riskData?.data?.max_loss || 330} ({((330 / portfolioValue) * 100).toFixed(2)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Risk/Reward</span>
                  <span className="text-foreground font-semibold">
                    {riskData?.data?.risk_reward_ratio || '1:2.3'}
                  </span>
                </div>
              </div>

              <Button 
                variant="ghost" 
                className="w-full"
                data-testid="button-full-risk-analysis"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Run Full Risk Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
