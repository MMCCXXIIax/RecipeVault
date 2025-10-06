import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { riskAPI, recommendationAPI, dataAPI, type ApiResponse } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity } from 'lucide-react';

type RiskCheckResponse = {
  risk_score?: number;
  max_position_size?: number;
  suggested_stop?: number;
  suggested_take_profit?: number;
  risk_confirmation_token?: string;
};

type Recommendation = {
  action?: string;
  reason?: string;
  confidence_pct?: number;
  risk_level?: string;
  notes?: string[];
};

export default function RiskRecommend() {
  const [symbol, setSymbol] = useState<string>('AAPL');
  const [positionSize, setPositionSize] = useState<number>(100);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number | undefined>();
  const [takeProfit, setTakeProfit] = useState<number | undefined>();

  const assetsQuery = useQuery<ApiResponse<string[]>>({
    queryKey: ['assets_list'],
    queryFn: () => dataAPI.getAssetsList(),
  });

  const preTradeCheck = useMutation<ApiResponse<RiskCheckResponse>>({
    mutationFn: () => riskAPI.preTradeCheck({
      symbol,
      position_size: positionSize,
      entry_price: entryPrice,
      stop_loss: stopLoss,
      take_profit: takeProfit,
    }),
  });

  const recommendQuery = useQuery<ApiResponse<Recommendation>>({
    queryKey: ['recommend_complete', symbol],
    queryFn: () => recommendationAPI.getCompleteRecommendation(symbol),
    enabled: !!symbol,
  });

  const assets = assetsQuery.data?.data || [];
  const riskResult: RiskCheckResponse | undefined = preTradeCheck.data?.data;
  const recommendation: Recommendation | undefined = recommendQuery.data?.data;

  return (
    <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Risk & Recommendation</h2>
        <p className="text-muted-foreground">Run a pre-trade risk check and view actionable recommendations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pre-Trade Risk Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Symbol</Label>
              {assets.length > 0 ? (
                <Select value={symbol} onValueChange={(v: string) => setSymbol(v)}>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Position Size</Label>
                <Input
                  type="number"
                  value={positionSize}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPositionSize(Number(e.target.value))
                  }
                />
              </div>
              <div>
                <Label>Entry Price</Label>
                <Input
                  type="number"
                  value={entryPrice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEntryPrice(Number(e.target.value))
                  }
                />
              </div>
              <div>
                <Label>Stop Loss (optional)</Label>
                <Input
                  type="number"
                  value={stopLoss ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setStopLoss(e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </div>
              <div>
                <Label>Take Profit (optional)</Label>
                <Input
                  type="number"
                  value={takeProfit ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTakeProfit(e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </div>
            </div>
            <Button onClick={() => preTradeCheck.mutate()} disabled={preTradeCheck.isPending}>
              {preTradeCheck.isPending ? 'Checking…' : 'Run Check'}
            </Button>

            {preTradeCheck.isPending && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4 animate-spin" />
                <span>Evaluating risk…</span>
              </div>
            )}

            {riskResult && (
              <div className="mt-4 p-4 rounded-lg bg-muted">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Risk Score</p>
                    <p className="font-mono font-semibold text-foreground">{riskResult.risk_score ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Position</p>
                    <p className="font-mono font-semibold text-foreground">{riskResult.max_position_size ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stop Suggestion</p>
                    <p className="font-mono font-semibold text-foreground">{riskResult.suggested_stop ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">TP Suggestion</p>
                    <p className="font-mono font-semibold text-foreground">{riskResult.suggested_take_profit ?? '—'}</p>
                  </div>
                </div>
                {riskResult.risk_confirmation_token && (
                  <p className="mt-3 text-xs text-muted-foreground">Token: {riskResult.risk_confirmation_token}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recommendation</CardTitle>
              {recommendQuery.isFetching && <Activity className="h-5 w-5 animate-spin text-primary" />}
            </div>
          </CardHeader>
          <CardContent>
            {!recommendation ? (
              <p className="text-muted-foreground">No recommendation yet. Select a symbol to fetch.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-muted-foreground">Action</p>
                  <p className="font-semibold text-foreground">{recommendation.action ?? '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-muted-foreground">Rationale</p>
                  <p className="text-foreground">{recommendation.reason ?? '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-muted-foreground">Confidence</p>
                    <p className="font-mono font-semibold">{recommendation.confidence_pct ?? '—'}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-muted-foreground">Risk Level</p>
                    <p className="font-mono font-semibold">{recommendation.risk_level ?? '—'}</p>
                  </div>
                </div>
                {Array.isArray(recommendation.notes) && recommendation.notes.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-muted-foreground">Notes</p>
                    <ul className="list-disc pl-6">
                      {recommendation.notes.map((n: string, i: number) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
