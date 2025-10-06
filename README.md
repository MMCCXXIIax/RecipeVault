# TX Predictive Intelligence (Frontend)

Production-ready React + Vite + Tailwind UI that integrates with a Flask backend providing real-time market data, scanning, pattern detection, alerts, paper trading, backtesting, sentiment, and risk/recommendation APIs.

## Tech Stack
- React 18, Vite 5, TypeScript
- Tailwind CSS 3 (dark minimalist theme)
- TanStack Query for data fetching/caching
- Axios API client (`client/src/lib/apiClient.ts`)
- Socket.IO client (`client/src/lib/socket.ts`)
- Chart.js + react-chartjs-2
- Wouter for routing

## Project Structure
- `client/` – Vite React app
  - `index.html`, `src/main.tsx`, `src/App.tsx`
  - `src/pages/` – Dashboard, Charts, PaperTrade, Scanner, Backtest, SentimentSignals, RiskRecommend
  - `src/components/` – Layout, Navigation, UI components
  - `src/lib/` – `apiClient.ts`, `socket.ts`, `queryClient.ts`, `utils.ts`
- `vite.config.ts` – Vite config with path aliases (`@` -> `client/src`)
- `tailwind.config.ts` – Tailwind setup

## Environment
Copy and edit the example env file:

```bash
cp client/.env.example client/.env
```

Set these variables:
- `VITE_API_BASE` – Flask base URL (default `http://localhost:5000`)
- `VITE_SOCKET_BASE` – Socket.IO URL (default `http://localhost:5000`)

## Running Locally

```bash
# install deps at repo root
npm install

# start frontend dev server (Vite)
npm run dev

# Backend must be running separately (Flask) on VITE_API_BASE
```

Vite serves the frontend from `client/` (see `vite.config.ts`).

## Key Integrations
- API success format `{"success": true, data}` is normalized by `apiClient` and returned directly to pages/hooks.
- Socket events used: `connection_status`, `subscription_status`, `scan_update`, `pattern_alert`. Client emits `subscribe_alerts`, `subscribe_scan_results`.

## Pages Overview
- `Dashboard` – top movers, live alerts, scan coverage and controls.
- `Charts` – OHLCV candles, detect patterns, list detected patterns.
- `PaperTrade` – portfolio, buy/sell, history.
- `Scanner` – start/stop scan, live status.
- `Backtest` – run backtests, equity curve, trade list.
- `SentimentSignals` – per-symbol sentiment and entry/exit signals.
- `RiskRecommend` – pre-trade risk check + recommendation view.

## Production Notes
- Use environment variables for API/Socket endpoints.
- Ensure CORS is enabled on Flask for the frontend origin.
- Configure rate limits per API docs; UI polls at modest intervals with TanStack Query refetch options.
- Socket reconnection/backoff is implemented in `socket.ts`.

## Deploy
- Frontend is a static build: `vite build` outputs to `dist/public` (per config). Host on Vercel/Netlify.
- Make sure to set `VITE_API_BASE` and `VITE_SOCKET_BASE` in the hosting provider environment settings.
