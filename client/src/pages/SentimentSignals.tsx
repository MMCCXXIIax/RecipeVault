import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sentimentAPI, signalsAPI, dataAPI, type ApiResponse } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity } from 'lucide-react';

type SentimentResponse = {
  overall?: string;
  confidence_pct?: number;
  news_score?: number;
  social_score?: number;
};

type SignalItem = {
  timestamp?: string | number;
  type?: string;
  name?: string;
  signal?: string;
  confidence?: number;
};

export default function SentimentSignals() {
  const [symbol, setSymbol] = useState<string>('AAPL');
  const [timeframe, setTimeframe] = useState<string>('1h');

  const assetsQuery = useQuery<ApiResponse<string[]>>({
    queryKey: ['assets_list'],
    queryFn: () => dataAPI.getAssetsList(),
  });

  const sentimentQuery = useQuery<ApiResponse<SentimentResponse>>({
    queryKey: ['sentiment', symbol],
    queryFn: () => sentimentAPI.getSentiment(symbol),
    enabled: !!symbol,
    refetchInterval: 60000,
  });

  const signalsQuery = useQuery<ApiResponse<{ all?: SignalItem[]; entry?: SignalItem[]; exit?: SignalItem[] }>>({
    queryKey: ['signals', symbol, timeframe],
    queryFn: () => signalsAPI.getEntryExitSignals(symbol, timeframe, 'all'),
    enabled: !!symbol && !!timeframe,
    refetchInterval: 60000,
  });

  const assets = assetsQuery.data?.data || [];
  const sentiment = sentimentQuery.data?.data;
  const signals =
    signalsQuery.data?.data ||
    ({ entry: [], exit: [], all: [] } as {
      all?: SignalItem[];
      entry?: SignalItem[];
      exit?: SignalItem[];
    });

  const toArray = (v: unknown): SignalItem[] => (Array.isArray(v) ? (v as SignalItem[]) : []);
  const signalRows: SignalItem[] = [
    ...toArray(signals.all),
    ...toArray(signals.entry),
    ...toArray(signals.exit),
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Sentiment & Signals</h2>
        <p className="text-muted-foreground">Live sentiment insights and entry/exit signals for a selected asset.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Symbol</label>
              {assets.length > 0 ? (
                <Select value={symbol} onValueChange={setSymbol}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select symbol" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.slice(0, 200).map((s: string) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={symbol}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSymbol(e.target.value.toUpperCase())
                  }
                  className="mt-1"
                />
              )}
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Timeframe</label>
              <Select value={timeframe} onValueChange={(v: string) => setTimeframe(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {['5m', '15m', '30m', '1h', '4h', '1d'].map((tf: string) => (
                    <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => { sentimentQuery.refetch(); signalsQuery.refetch(); }} className="w-full">Refresh</Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sentiment for {symbol}</CardTitle>
                {sentimentQuery.isFetching && <Activity className="h-5 w-5 animate-spin text-primary" />}
              </div>
            </CardHeader>
            <CardContent>
              {!sentiment ? (
                <p className="text-muted-foreground">No sentiment data yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Overall</p>
                    <p className="text-2xl font-mono font-bold">{sentiment.overall || '—'}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className="text-2xl font-mono font-bold">{sentiment.confidence_pct ?? '—'}%</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">News Score</p>
                    <p className="text-2xl font-mono font-bold">{sentiment.news_score ?? '—'}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Social Score</p>
                    <p className="text-2xl font-mono font-bold">{sentiment.social_score ?? '—'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Signals ({timeframe})</CardTitle>
                {signalsQuery.isFetching && <Activity className="h-5 w-5 animate-spin text-primary" />}
              </div>
            </CardHeader>
            <CardContent>
              {signalRows.length === 0 ? (
                <p className="text-muted-foreground">No signals available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-2">Time</th>
                        <th className="text-left px-4 py-2">Type</th>
                        <th className="text-left px-4 py-2">Signal</th>
                        <th className="text-right px-4 py-2">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {signalRows.map((sig: SignalItem, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 font-mono">{sig.timestamp ? new Date(sig.timestamp).toLocaleString() : '—'}</td>
                          <td className="px-4 py-2">
                            <Badge className={sig.type?.toLowerCase().includes('exit') ? 'badge-warning' : 'badge-success'}>
                              {sig.type || '—'}
                            </Badge>
                          </td>
                          <td className="px-4 py-2">{sig.name || sig.signal || '—'}</td>
                          <td className="px-4 py-2 text-right font-mono">{sig.confidence ?? '—'}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
