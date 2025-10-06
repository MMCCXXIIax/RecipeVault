import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Charts from "@/pages/Charts";
import PaperTrade from "@/pages/PaperTrade";
import Scanner from "@/pages/Scanner";
import Backtest from "@/pages/Backtest";
import SentimentSignals from "@/pages/SentimentSignals";
import RiskRecommend from "@/pages/RiskRecommend";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/charts" component={Charts} />
        <Route path="/paper-trade" component={PaperTrade} />
        <Route path="/scanner" component={Scanner} />
        <Route path="/backtest" component={Backtest} />
        <Route path="/sentiment-signals" component={SentimentSignals} />
        <Route path="/risk" component={RiskRecommend} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
