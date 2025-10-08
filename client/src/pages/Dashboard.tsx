import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Bell, 
  Globe, 
  ArrowUp, 
  ArrowDown, 
  Activity,
  Play,
  Square,
  Settings,
  Eye,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMarketScan, useActiveAlerts, useScannerStatus, useStartScanner, useStopScanner } from '@/hooks/useMarketData';
import { useSocket } from '@/hooks/useSocket';
import type { Alert, MarketData } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { patternAPI } from '@/lib/apiClient';
import { useLocation } from 'wouter';
import { InfoModal } from '@/components/InfoModal';

export default function Dashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [topType, setTopType] = useState<'trending' | 'volume'>('trending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fmt = (v: any, d: number = 2) => (typeof v === 'number' && isFinite(v) ? v.toFixed(d) : '--');
  
  // API Hooks
  const { data: trendingData, isLoading: isLoadingTrending, refetch: refetchMovers } = useMarketScan(topType);
  const { data: alertsData, refetch: refetchAlerts } = useActiveAlerts();
  const { data: scannerData, refetch: refetchScanner } = useScannerStatus();
  const startScannerMutation = useStartScanner();
  const stopScannerMutation = useStopScanner();
  
  // Socket for real-time updates
  const { isConnected, subscribeToAlerts, unsubscribeFromAlerts } = useSocket();

  // Subscribe to real-time alerts
  useEffect(() => {
    if (isConnected) {
      subscribeToAlerts((newAlert: Alert) => {
        setAlerts(prev => [newAlert, ...prev.slice(0, 9)]); // Keep only last 10
        toast({
          title: "New Pattern Alert",
          description: `${newAlert.alert_type} detected for ${newAlert.symbol}`,
        });
      });
    }

    return () => {
      unsubscribeFromAlerts();
    };
  }, [isConnected, subscribeToAlerts, unsubscribeFromAlerts, toast]);

  // Initialize alerts from API
  useEffect(() => {
    if (alertsData?.data) {
      setAlerts(alertsData.data.slice(0, 10));
    }
  }, [alertsData]);

  const handleStartScanner = () => {
    startScannerMutation.mutate({
      interval: 5,
      auto_alerts: true,
    });
  };

  const handleStopScanner = () => {
    stopScannerMutation.mutate();
  };

  const handleRefresh = () => {
    refetchMovers();
    refetchAlerts();
    refetchScanner();
  };

  const handleViewSymbol = (symbol: string) => {
    setLocation(`/charts?symbol=${encodeURIComponent(symbol)}`);
  };

  const handleConfigureScanner = () => {
    setLocation('/scanner');
  };

  const handleAlertDetails = async (alert: Alert) => {
    try {
      const res = await patternAPI.explainAlert({ alert_id: alert.id, symbol: alert.symbol, alert_type: alert.alert_type });
      setModalContent(
        <div>
          <p className="mb-2 text-sm text-muted-foreground">{new Date(alert.timestamp).toLocaleString()}</p>
          <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded-md border border-border">{JSON.stringify(res.data, null, 2)}</pre>
        </div>
      );
      setIsModalOpen(true);
    } catch (e) {
      toast({ title: 'Details unavailable', description: e instanceof Error ? e.message : 'Failed to fetch alert details', variant: 'destructive' });
    }
  };

  const topMovers = trendingData?.data || [];
  const scannerStatus = scannerData?.data;
  const coveragePercent = scannerStatus ? (scannerStatus.symbols_scanned / 500) * 100 : 49;

  return (
    <div className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
            <p className="text-muted-foreground">Real-time market overview and active alerts</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" data-testid="button-filter" onClick={() => setTopType(prev => prev === 'trending' ? 'volume' : 'trending')}>
              <Filter className="h-4 w-4 mr-2" />
              {topType === 'trending' ? 'Show Volume' : 'Show Trending'}
            </Button>
            <Button size="sm" data-testid="button-refresh" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Portfolio Value */}
        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <Badge className="badge-success">+12.5%</Badge>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Portfolio Value</h3>
            <p className="text-3xl font-bold text-foreground font-mono mb-2">$125,432.50</p>
            <p className="text-sm text-success">+$13,920.00 today</p>
          </CardContent>
        </Card>

        {/* Active Positions */}
        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <Badge className="badge-info">8 Open</Badge>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Active Positions</h3>
            <p className="text-3xl font-bold text-foreground font-mono mb-2">8</p>
            <p className="text-sm text-muted-foreground">6 profitable</p>
          </CardContent>
        </Card>

        {/* Alerts Today */}
        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                <Bell className="h-6 w-6 text-secondary" />
              </div>
              <Badge className="badge-warning">High</Badge>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Alerts Today</h3>
            <p className="text-3xl font-bold text-foreground font-mono mb-2">{alerts.length || 24}</p>
            <p className="text-sm text-muted-foreground">12 patterns detected</p>
          </CardContent>
        </Card>

        {/* Market Coverage */}
        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                <Globe className="h-6 w-6 text-success" />
              </div>
              <div className={`status-dot ${scannerStatus?.active ? 'active' : 'inactive'}`}></div>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Market Coverage</h3>
            <p className="text-3xl font-bold text-foreground font-mono mb-2">
              {scannerStatus?.symbols_scanned || 245}/500
            </p>
            <Progress aria-label="Market coverage" value={coveragePercent} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Market Movers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Movers */}
          <Card className="gradient-card">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle>Top Movers</CardTitle>
                <div className="flex space-x-2">
                  <Button variant={topType === 'trending' ? 'secondary' : 'ghost'} size="sm" className={topType === 'trending' ? 'bg-primary text-primary-foreground' : ''} onClick={() => setTopType('trending')}>
                    Trending
                  </Button>
                  <Button variant={topType === 'volume' ? 'secondary' : 'ghost'} size="sm" className={topType === 'volume' ? 'bg-primary text-primary-foreground' : ''} onClick={() => setTopType('volume')}>
                    Volume
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingTrending ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
                  Loading market data...
                </div>
              ) : topMovers.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No market data available. Please check your API connection.
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
                          Price
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Change
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Volume
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {topMovers.map((stock: MarketData) => (
                        <tr key={stock.symbol} className="hover:bg-muted/50 transition-colors animate-slide-in">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                                {stock.symbol.substring(0, 4)}
                              </div>
                              <span className="font-medium">{stock.symbol}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-semibold">
                            ${fmt(stock.price, 2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-semibold ${typeof stock.changePercent === 'number' && stock.changePercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {typeof stock.changePercent === 'number' && stock.changePercent >= 0 ? '+' : ''}{typeof stock.changePercent === 'number' ? stock.changePercent.toFixed(2) : '--'}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-muted-foreground">
                            {typeof stock.volume === 'number' ? (stock.volume / 1000000).toFixed(1) + 'M' : '--'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" data-testid={`button-view-${stock.symbol}`} onClick={() => handleViewSymbol(stock.symbol)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
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
        </div>

        {/* Right Column - Scanner Control & Alerts */}
        <div className="space-y-6">
          {/* Scanner Control */}
          <Card className="gradient-card">
            <CardHeader className="border-b border-border">
              <CardTitle>Scanner Control</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Scanner Status */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`status-dot ${scannerStatus?.active ? 'active' : 'inactive'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Status</p>
                    <p className="text-xs text-muted-foreground">
                      {scannerStatus?.active ? 'Active Scanning' : 'Inactive'}
                    </p>
                  </div>
                </div>
                <Activity className={`h-6 w-6 text-primary ${scannerStatus?.active ? 'animate-spin' : ''}`} />
              </div>

              {/* Control Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleStartScanner}
                  disabled={startScannerMutation.isPending || scannerStatus?.active}
                  className="bg-success text-success-foreground hover:bg-success/90"
                  data-testid="button-start-scanner"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
                <Button 
                  onClick={handleStopScanner}
                  disabled={stopScannerMutation.isPending || !scannerStatus?.active}
                  variant="destructive"
                  data-testid="button-stop-scanner"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>

              {/* Scanner Stats */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Scan</span>
                  <span className="text-foreground font-medium font-mono">
                    {scannerStatus?.last_scan ? new Date(scannerStatus.last_scan).toLocaleTimeString() : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Patterns Found</span>
                  <span className="text-primary font-semibold font-mono">
                    {scannerStatus?.patterns_found || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Symbols Scanned</span>
                  <span className="text-foreground font-medium font-mono">
                    {scannerStatus?.symbols_scanned || 0}
                  </span>
                </div>
              </div>

              {/* Config Link */}
              <Button variant="ghost" className="w-full" data-testid="button-configure-scanner" onClick={handleConfigureScanner}>
                <Settings className="h-4 w-4 mr-2" />
                Configure Scanner
              </Button>
            </CardContent>
          </Card>

          {/* Live Alerts */}
          <Card className="gradient-card">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle>Live Alerts</CardTitle>
                <Badge className="badge-info">{alerts.length} Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    {isConnected ? 'No alerts yet. Patterns will appear here when detected.' : 'Connecting to live data...'}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="p-4 hover:bg-muted/50 transition-colors animate-slide-in">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={`badge-${alert.alert_type.toLowerCase().includes('bull') ? 'success' : 
                              alert.alert_type.toLowerCase().includes('bear') ? 'danger' : 'warning'}`}>
                              {alert.alert_type.toLowerCase().includes('bull') ? 'Bullish' : 
                               alert.alert_type.toLowerCase().includes('bear') ? 'Bearish' : 'Neutral'}
                            </Badge>
                            <span className="font-semibold text-foreground">{alert.symbol}</span>
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mb-2">{alert.alert_type}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs">
                            <span className="text-muted-foreground">Confidence:</span>
                            <span className="text-success font-semibold font-mono">{alert.confidence_pct}%</span>
                            <span className="text-muted-foreground">Price:</span>
                            <span className="text-foreground font-semibold font-mono">${fmt(alert.price, 2)}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs text-primary hover:underline" data-testid={`button-alert-details-${alert.id}`} onClick={() => handleAlertDetails(alert)}>
                            Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {alerts.length > 0 && (
                <div className="p-4 border-t border-border">
                  <Button variant="ghost" className="w-full text-sm" data-testid="button-view-all-alerts" onClick={() => setLocation('/scanner')}>
                    View All Alerts <ArrowUp className="h-4 w-4 ml-2 rotate-45" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <InfoModal open={isModalOpen} onOpenChange={setIsModalOpen} title="Alert Details">
        {modalContent}
      </InfoModal>
    </div>
  );
}
