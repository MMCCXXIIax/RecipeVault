import React, { useState, useEffect } from 'react';
import { 
  Radar, 
  Play, 
  Square, 
  Settings, 
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Globe,
  Filter,
  Eye,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useScannerStatus, useStartScanner, useStopScanner } from '@/hooks/useMarketData';
import { useSocket } from '@/hooks/useSocket';
import { scannerAPI, dataAPI } from '@/lib/apiClient';
import { useQuery } from '@tanstack/react-query';
import type { ScannerStatus, Pattern } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface ScanResult {
  symbol: string;
  patterns: Pattern[];
  price: number;
  change_percent: number;
  timestamp: string;
}

export default function Scanner() {
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scannerConfig, setScannerConfig] = useState({
    interval: 5,
    auto_alerts: true,
    symbols: '',
  });
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // API Hooks
  const { data: scannerData, isLoading: isLoadingStatus } = useScannerStatus();
  const { data: coverageData } = useQuery({
    queryKey: ['/api/coverage'],
    queryFn: () => dataAPI.getCoverage(),
  });
  const startScannerMutation = useStartScanner();
  const stopScannerMutation = useStopScanner();

  // Socket for real-time scan results
  const { isConnected, subscribeToScanResults, unsubscribeFromScanResults } = useSocket();

  // Subscribe to real-time scan updates
  useEffect(() => {
    if (isConnected) {
      subscribeToScanResults((scanData: any) => {
        const newResult: ScanResult = {
          symbol: scanData.symbol,
          patterns: [...(scanData.intraday_patterns || []), ...(scanData.context_patterns || [])],
          price: scanData.price || 0,
          change_percent: scanData.change_percent || 0,
          timestamp: scanData.timestamp || new Date().toISOString(),
        };
        
        setScanResults(prev => [newResult, ...prev.slice(0, 9)]); // Keep only last 10
        
        if (newResult.patterns.length > 0) {
          toast({
            title: "New Scan Result",
            description: `${newResult.patterns.length} patterns detected for ${newResult.symbol}`,
          });
        }
      });
    }

    return () => {
      unsubscribeFromScanResults();
    };
  }, [isConnected, subscribeToScanResults, unsubscribeFromScanResults, toast]);

  const scannerStatus = scannerData?.data;
  const coverage = coverageData?.data;

  const handleStartScanner = () => {
    const symbols = scannerConfig.symbols 
      ? scannerConfig.symbols.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    startScannerMutation.mutate({
      symbols,
      interval: scannerConfig.interval,
      auto_alerts: scannerConfig.auto_alerts,
    });
  };

  const handleStopScanner = () => {
    stopScannerMutation.mutate();
  };

  const updateConfig = (key: string, value: any) => {
    setScannerConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Live Scanner</h2>
        <p className="text-muted-foreground">Real-time pattern detection across markets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Control Panel */}
        <div className="space-y-6">
          <Card className="gradient-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center space-x-2">
                <Radar className="h-5 w-5 text-primary" />
                <span>Control Panel</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Scanner Status */}
              <div className="p-4 rounded-lg border" style={{
                backgroundColor: scannerStatus?.active ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--muted))',
                borderColor: scannerStatus?.active ? 'hsl(var(--success))' : 'hsl(var(--border))'
              }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Scanner Status</span>
                  <div className="flex items-center space-x-2">
                    <div className={`status-dot ${scannerStatus?.active ? 'active' : 'inactive'}`}></div>
                    <span className={`text-sm font-medium ${scannerStatus?.active ? 'text-success' : 'text-muted-foreground'}`}>
                      {scannerStatus?.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Last scan: {scannerStatus?.last_scan 
                    ? new Date(scannerStatus.last_scan).toLocaleString()
                    : 'Never'
                  }
                </div>
              </div>

              {/* Configuration */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="interval" className="text-sm font-medium">Scan Interval</Label>
                  <Select 
                    value={scannerConfig.interval.toString()} 
                    onValueChange={(value) => updateConfig('interval', parseInt(value))}
                  >
                    <SelectTrigger className="mt-2" data-testid="select-scan-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minute</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                  <span className="text-sm font-medium text-foreground">Auto Alerts</span>
                  <Switch 
                    checked={scannerConfig.auto_alerts}
                    onCheckedChange={(checked) => updateConfig('auto_alerts', checked)}
                    data-testid="switch-auto-alerts"
                  />
                </div>

                <div>
                  <Label htmlFor="symbols" className="text-sm font-medium">Symbol Filter</Label>
                  <Input 
                    id="symbols"
                    placeholder="AAPL, TSLA, MSFT (comma separated)" 
                    value={scannerConfig.symbols}
                    onChange={(e) => updateConfig('symbols', e.target.value)}
                    className="mt-2"
                    data-testid="input-symbol-filter"
                  />
                </div>
              </div>

              {/* Control Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleStartScanner}
                  disabled={startScannerMutation.isPending || scannerStatus?.active}
                  className="bg-success text-success-foreground hover:bg-success/90"
                  data-testid="button-start-scanner"
                >
                  {startScannerMutation.isPending ? (
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start
                </Button>
                <Button 
                  onClick={handleStopScanner}
                  disabled={stopScannerMutation.isPending || !scannerStatus?.active}
                  variant="destructive"
                  data-testid="button-stop-scanner"
                >
                  {stopScannerMutation.isPending ? (
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Square className="h-4 w-4 mr-2" />
                  )}
                  Stop
                </Button>
              </div>

              <Button variant="outline" className="w-full" data-testid="button-advanced-settings" onClick={() => setLocation('/scanner?view=advanced')}>
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </Button>
            </CardContent>
          </Card>

          {/* Market Coverage */}
          <Card className="gradient-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-accent" />
                <span>Market Coverage</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-foreground font-mono">
                    {coverage?.total_assets || 500}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Assets</div>
                </div>
                <div className="p-3 bg-success/10 rounded-lg">
                  <div className="text-2xl font-bold text-success font-mono">
                    {scannerStatus?.symbols_scanned || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Scanning</div>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary font-mono">
                    {scannerStatus?.patterns_found || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Patterns</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Coverage Rate</span>
                  <span className="text-foreground font-semibold">
                    {scannerStatus && coverage 
                      ? `${((scannerStatus.symbols_scanned / coverage.total_assets) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <Progress 
                  value={scannerStatus && coverage 
                    ? (scannerStatus.symbols_scanned / coverage.total_assets) * 100 
                    : 0
                  } 
                  className="h-2"
                />
              </div>

              <div className="pt-3 border-t border-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Scan Interval:</span>
                  <span className="text-foreground font-mono">{scannerConfig.interval}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Auto Alerts:</span>
                  <span className="text-foreground">{scannerConfig.auto_alerts ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scan Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="gradient-card">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Symbols Scanned</div>
                <div className="text-2xl font-bold text-foreground font-mono">
                  {scannerStatus?.symbols_scanned || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="gradient-card">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Patterns Found</div>
                <div className="text-2xl font-bold text-primary font-mono">
                  {scannerStatus?.patterns_found || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="gradient-card">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">High Confidence</div>
                <div className="text-2xl font-bold text-success font-mono">
                  {scanResults.filter(r => r.patterns.some(p => p.confidence >= 80)).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Scan Results */}
          <Card className="gradient-card">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Scan Results</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className={`status-dot ${isConnected ? 'active' : 'inactive'}`}></div>
                  <span className="text-xs text-success font-medium">
                    {isConnected ? 'Updating' : 'Offline'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {scanResults.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    {scannerStatus?.active ? (
                      <div>
                        <Activity className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                        <p>Scanner is active. Results will appear here.</p>
                      </div>
                    ) : (
                      <div>
                        <Radar className="h-8 w-8 mx-auto mb-2" />
                        <p>Start the scanner to see real-time pattern detection results.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {scanResults.map((result, index) => (
                      <div key={`${result.symbol}-${result.timestamp}-${index}`} className="p-4 hover:bg-muted/50 transition-colors animate-slide-in">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">
                                {result.symbol.substring(0, 3)}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-foreground">{result.symbol}</h4>
                              <p className="text-xs text-muted-foreground">
                                {result.patterns.length} pattern{result.patterns.length !== 1 ? 's' : ''} detected
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono font-semibold text-foreground">
                              ${result.price.toFixed(2)}
                            </div>
                            <div className={`text-xs ${result.change_percent >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {result.change_percent >= 0 ? '+' : ''}{result.change_percent.toFixed(2)}%
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {result.patterns.slice(0, 3).map((pattern, patternIndex) => (
                            <div key={patternIndex} className="flex items-center justify-between p-2 rounded border" style={{
                              backgroundColor: pattern.pattern_type === 'bullish' ? 'hsl(var(--success) / 0.05)' :
                                              pattern.pattern_type === 'bearish' ? 'hsl(var(--destructive) / 0.05)' :
                                              'hsl(var(--muted) / 0.5)',
                              borderColor: pattern.pattern_type === 'bullish' ? 'hsl(var(--success) / 0.2)' :
                                          pattern.pattern_type === 'bearish' ? 'hsl(var(--destructive) / 0.2)' :
                                          'hsl(var(--border))'
                            }}>
                              <div className="flex items-center space-x-2">
                                {pattern.pattern_type === 'bullish' && <TrendingUp className="h-3 w-3 text-success" />}
                                {pattern.pattern_type === 'bearish' && <TrendingDown className="h-3 w-3 text-destructive" />}
                                {pattern.pattern_type === 'neutral' && <BarChart3 className="h-3 w-3 text-muted-foreground" />}
                                <span className="text-xs font-medium text-foreground">
                                  {pattern.pattern_name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Progress value={pattern.confidence} className="w-16 h-1" />
                                <span className={`text-xs font-mono ${
                                  pattern.pattern_type === 'bullish' ? 'text-success' :
                                  pattern.pattern_type === 'bearish' ? 'text-destructive' :
                                  'text-muted-foreground'
                                }`}>
                                  {pattern.confidence}%
                                </span>
                              </div>
                            </div>
                          ))}
                          {result.patterns.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{result.patterns.length - 3} more pattern{result.patterns.length - 3 !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 h-6 text-xs" data-testid={`button-view-details-${result.symbol}-${index}`} onClick={() => setLocation(`/charts?symbol=${encodeURIComponent(result.symbol)}`)}>
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {scanResults.length > 0 && (
                <div className="p-4 border-t border-border">
                  <Button variant="ghost" className="w-full text-sm" data-testid="button-view-all-results" onClick={() => setLocation('/charts')}>
                    View All Results <Zap className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
