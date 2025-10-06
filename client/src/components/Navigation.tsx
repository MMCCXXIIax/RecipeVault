import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  ChartLine, 
  Home, 
  CandlestickChart, 
  Wallet, 
  Radar, 
  History, 
  Bell, 
  Menu, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/hooks/useSocket';
import { useActiveAlerts } from '@/hooks/useMarketData';

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/charts', icon: CandlestickChart, label: 'Charts' },
  { path: '/paper-trade', icon: Wallet, label: 'Paper Trade' },
  { path: '/scanner', icon: Radar, label: 'Scanner' },
  { path: '/backtest', icon: History, label: 'Backtest' },
  { path: '/sentiment-signals', icon: CandlestickChart, label: 'Sentiment & Signals' },
  { path: '/risk', icon: Radar, label: 'Risk & Rec' },
];

export function Navigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isConnected } = useSocket();
  const { data: alertsData } = useActiveAlerts();

  const activeAlerts = alertsData?.data?.length || 0;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-card border-b border-border z-40">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <ChartLine className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">TX Predictive</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Intelligence Platform
                </p>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-1">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link 
                  key={path} 
                  href={path}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-2 ${
                    location === path 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-muted rounded-md">
              <div className={`status-dot ${isConnected ? 'active' : 'inactive'}`}></div>
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
              {activeAlerts > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                >
                  {activeAlerts}
                </Badge>
              )}
            </Button>

            {/* User Profile */}
            <Button variant="ghost" size="sm" className="flex items-center space-x-2" data-testid="button-profile">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold">
                TX
              </div>
            </Button>

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link 
                  key={path}
                  href={path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    location === path 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
