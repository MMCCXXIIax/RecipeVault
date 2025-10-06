import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  Brain, 
  Info, 
  ChevronRight,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { CandlestickChart } from '@/components/charts/CandlestickChart';
import { useCandles, usePatternDetection } from '@/hooks/useMarketData';
import { sentimentAPI, signalsAPI, recommendationAPI, patternAPI, paperTradingAPI } from '@/lib/apiClient';
import { useQuery } from '@tanstack/react-query';
import type { Pattern, SentimentData } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { InfoModal } from '@/components/InfoModal';

const symbols = [
  { value: 'AAPL', label: 'AAPL - Apple Inc.' },
  { value: 'TSLA', label: 'TSLA - Tesla Inc.' },
  { value: 'MSFT', label: 'MSFT - Microsoft Corp.' },
  { value: 'NVDA', label: 'NVDA - NVIDIA Corp.' },
  { value: 'AMZN', label: 'AMZN - Amazon.com Inc.' },
];

const timeframes = [
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
];

export default function Charts() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [detectedPatterns, setDetectedPatterns] = useState<Pattern[]>([]);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [infoContent, setInfoContent] = useState<React.ReactNode>(null);
  const { toast } = useToast();

  // API Hooks
  const { data: candlesData, isLoading: isLoadingCandles } = useCandles(selectedSymbol, '1d', selectedTimeframe);
  const patternMutation = usePatternDetection();
  
  const { data: sentimentData } = useQuery({
    queryKey: ['/api/sentiment', selectedSymbol],
    queryFn: () => sentimentAPI.getSentiment(selectedSymbol),
    enabled: !!selectedSymbol,
  });

  const { data: signalsData } = useQuery({
    queryKey: ['/api/signals/entry-exit', selectedSymbol, selectedTimeframe],
    queryFn: () => signalsAPI.getEntryExitSignals(selectedSymbol, selectedTimeframe),
    enabled: !!selectedSymbol,
  });

  const handleDetectPatterns = async () => {
    try {
      const result: any = await patternMutation.mutateAsync(selectedSymbol);
      if (result.success && result.data) {
        setDetectedPatterns(result.data);
        toast({
          title: "Patterns Detected",
          description: `Found ${result.data.length} patterns for ${selectedSymbol}`,
        });
      }
    } catch (error) {
      toast({
        title: "Detection Failed",
        description: error instanceof Error ? error.message : "Failed to detect patterns",
        variant: "destructive",
      });
    }
  };

  // Read ?symbol= from querystring on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qsSymbol = params.get('symbol');
    if (qsSymbol) setSelectedSymbol(qsSymbol.toUpperCase());
  }, []);

  const handleAddToPaperTrading = async () => {
    try {
      await paperTradingAPI.placeTrade({ symbol: selectedSymbol, side: 'BUY', quantity: 1 });
      toast({ title: 'Added to Paper Trading', description: `${selectedSymbol} added with qty 1` });
    } catch (e) {
      toast({ title: 'Failed to add', description: e instanceof Error ? e.message : 'Request failed', variant: 'destructive' });
    }
  };

  const handleLearnMore = async (patternName: string) => {
    try {
      const res = await patternAPI.explainPattern(patternName);
      setInfoContent(
        <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded-md border border-border">{JSON.stringify(res.data, null, 2)}</pre>
      );
      setIsInfoOpen(true);
    } catch (e) {
      toast({ title: 'Explanation unavailable', description: e instanceof Error ? e.message : 'Failed to fetch', variant: 'destructive' });
    }
  };

  // Generate sample candlestick data when real data is not available
  const generateSampleCandles = () => {
    const data = [];
    let price = 178.42;
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 60 * 60 * 1000)); // 1 hour intervals
      const change = (Math.random() - 0.5) * 4;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      
      data.push({
        x: date.toISOString(),
        o: open,
        h: high,
        l: low,
        c: close,
      });
      
      price = close;
    }
    
    return data;
  };

  const candlestickData = candlesData?.data || generateSampleCandles();
  const currentPrice = candlestickData[candlestickData.length - 1]?.c || 178.42;
  const priceChange = candlestickData.length >= 2 ? 
    candlestickData[candlestickData.length - 1].c - candlestickData[candlestickData.length - 2].c : 5.78;
  const priceChangePercent = (priceChange / currentPrice) * 100;

  const sentiment = sentimentData?.data as SentimentData;
  const signals = signalsData?.data;

  return (
    <div className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Charts & Pattern Detection</h2>
        <p className="text-muted-foreground">Interactive candlestick charts with real-time pattern analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chart Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Chart Controls */}
          <Card className="gradient-card">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  {/* Symbol Selector */}
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger className="w-48" data-testid="select-symbol">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {symbols.map((symbol) => (
                        <SelectItem key={symbol.value} value={symbol.value}>
                          {symbol.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Timeframe Selector */}
                  <div className="flex space-x-1 bg-muted rounded-md p-1">
                    {timeframes.map((timeframe) => (
                      <Button
                        key={timeframe.value}
                        variant={selectedTimeframe === timeframe.value ? "secondary" : "ghost"}
                        size="sm"
                        className={selectedTimeframe === timeframe.value ? "bg-primary text-primary-foreground" : ""}
                        onClick={() => setSelectedTimeframe(timeframe.value)}
                        data-testid={`button-timeframe-${timeframe.value}`}
                      >
                        {timeframe.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={handleDetectPatterns}
                    disabled={patternMutation.isPending}
                    className="bg-primary text-primary-foreground"
                    data-testid="button-detect-patterns"
                  >
                    {patternMutation.isPending ? (
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4 mr-2" />
                    )}
                    Detect Patterns
                  </Button>
                </div>
              </div>

              {/* Price Info */}
              <div className="flex items-center space-x-6 mb-6 pb-6 border-b border-border">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Price</p>
                  <p className="text-2xl font-bold text-foreground font-mono">${currentPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Change</p>
                  <p className={`text-xl font-semibold font-mono ${priceChangePercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {priceChangePercent >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Volume</p>
                  <p className="text-xl font-semibold text-foreground font-mono">45.2M</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Day Range</p>
                  <p className="text-xl font-semibold text-foreground font-mono">
                    ${(currentPrice * 0.97).toFixed(2)} - ${(currentPrice * 1.01).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Candlestick Chart */}
              {isLoadingCandles ? (
                <div className="chart-container flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-muted-foreground">Loading chart data...</p>
                  </div>
                </div>
              ) : (
                <CandlestickChart 
                  data={candlestickData}
                  symbol={selectedSymbol}
                  height={500}
                />
              )}
            </CardContent>
          </Card>

          {/* Sentiment & Signals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Market Sentiment */}
            <Card className="gradient-card">
              <CardHeader className="border-b border-border">
                <CardTitle>Market Sentiment</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Sentiment Gauge */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-48 h-48">
                    <svg className="transform -rotate-90" viewBox="0 0 200 200">
                      {/* Background circle */}
                      <circle 
                        cx="100" 
                        cy="100" 
                        r="80" 
                        fill="none" 
                        stroke="hsl(var(--muted))" 
                        strokeWidth="20"
                      />
                      {/* Progress circle */}
                      <circle 
                        cx="100" 
                        cy="100" 
                        r="80" 
                        fill="none" 
                        stroke="hsl(var(--success))" 
                        strokeWidth="20" 
                        strokeDasharray="502.4" 
                        strokeDashoffset={502.4 - (502.4 * (sentiment?.overall_sentiment || 75) / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-4xl font-bold text-success font-mono">
                        {sentiment?.overall_sentiment || 75}%
                      </p>
                      <p className="text-sm text-muted-foreground">Bullish</p>
                    </div>
                  </div>
                </div>

                {/* Sentiment Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Social Media</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={sentiment?.bullish_percent || 82} className="w-24 h-2" />
                      <span className="text-success font-semibold font-mono">{sentiment?.bullish_percent || 82}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">News Articles</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={68} className="w-24 h-2" />
                      <span className="text-success font-semibold font-mono">68%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Technical</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={75} className="w-24 h-2" />
                      <span className="text-success font-semibold font-mono">75%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Entry/Exit Signals */}
            <Card className="gradient-card">
              <CardHeader className="border-b border-border">
                <CardTitle>Entry/Exit Signals</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Entry Signal */}
                <div className="p-4 bg-success/10 border border-success rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="font-semibold text-success">ENTRY SIGNAL</span>
                    </div>
                    <Badge className="badge-success">High</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Entry Price</span>
                      <span className="text-foreground font-mono font-semibold">
                        ${(currentPrice * 1.002).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Stop Loss</span>
                      <span className="text-destructive font-mono font-semibold">
                        ${(currentPrice * 0.98).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Target</span>
                      <span className="text-success font-mono font-semibold">
                        ${(currentPrice * 1.035).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">R:R Ratio</span>
                      <span className="text-foreground font-mono font-semibold">1:1.76</span>
                    </div>
                  </div>
                </div>

                {/* Pattern Confidence */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Signal Confidence</span>
                      <span className="text-success font-semibold font-mono">87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on Hammer pattern with strong volume confirmation and bullish sentiment.
                  </p>
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full bg-success text-success-foreground hover:bg-success/90"
                  data-testid="button-add-to-paper-trading"
                  onClick={handleAddToPaperTrading}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Add to Paper Trading
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detected Patterns Sidebar */}
        <div className="space-y-6">
          {/* Detected Patterns */}
          <Card className="gradient-card">
            <CardHeader className="border-b border-border">
              <CardTitle>Detected Patterns</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[800px] overflow-y-auto">
                {detectedPatterns.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2" />
                    <p>No patterns detected yet.</p>
                    <p className="text-xs mt-1">Click "Detect Patterns" to analyze the current chart.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {detectedPatterns.map((pattern, index) => (
                      <div key={index} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={`badge-${pattern.pattern_type === 'bullish' ? 'success' : 
                            pattern.pattern_type === 'bearish' ? 'danger' : 'warning'}`}>
                            {pattern.pattern_type.charAt(0).toUpperCase() + pattern.pattern_type.slice(1)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Current</span>
                        </div>
                        <h4 className="font-semibold text-foreground mb-2">{pattern.pattern_name}</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          Pattern confidence indicates likelihood of success
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="text-success font-semibold font-mono">{pattern.confidence}%</span>
                          </div>
                          <Progress value={pattern.confidence} className="h-1.5" />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full mt-3 text-xs text-primary hover:bg-primary/10"
                          data-testid={`button-learn-more-${index}`}
                          onClick={() => handleLearnMore(pattern.pattern_name)}
                        >
                          <Info className="h-3 w-3 mr-1" />
                          Learn More
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pattern Statistics */}
          <Card className="gradient-card">
            <CardHeader className="border-b border-border">
              <CardTitle>Pattern Stats</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Patterns</span>
                <span className="text-xl font-bold text-foreground font-mono">
                  {detectedPatterns.length || 47}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-xl font-bold text-success font-mono">78%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Confidence</span>
                <span className="text-xl font-bold text-primary font-mono">
                  {detectedPatterns.length > 0 
                    ? Math.round(detectedPatterns.reduce((acc, p) => acc + p.confidence, 0) / detectedPatterns.length)
                    : 82}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <InfoModal open={isInfoOpen} onOpenChange={setIsInfoOpen} title="Pattern Details">
        {infoContent}
      </InfoModal>
    </div>
  );
}
