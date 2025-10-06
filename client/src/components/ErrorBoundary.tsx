import React from 'react';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    // You can wire this to Sentry/Logtail later
    console.error('App crashed', error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleCopy = async () => {
    try {
      const text = JSON.stringify({
        message: this.state.error?.message,
        stack: this.state.error?.stack,
        componentStack: this.state.errorInfo?.componentStack,
      }, null, 2);
      await navigator.clipboard.writeText(text);
    } catch (e) {
      // ignore
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-xl rounded-lg border border-border bg-card p-6 shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            The app encountered an unexpected error. You can try reloading the page. If the problem persists,
            share the error details with the developer.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={this.handleReload} className="inline-flex items-center justify-center rounded-md border border-border bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90">
              <RefreshCw className="h-4 w-4 mr-2" /> Reload
            </button>
            <button onClick={this.handleCopy} className="inline-flex items-center justify-center rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium hover:bg-muted/80">
              <Copy className="h-4 w-4 mr-2" /> Copy Error
            </button>
          </div>

          <pre className="max-h-64 overflow-auto text-xs bg-muted p-3 rounded border border-border whitespace-pre-wrap">
            {this.state.error?.message}\n\n{this.state.error?.stack}
          </pre>
        </div>
      </div>
    );
  }
}
