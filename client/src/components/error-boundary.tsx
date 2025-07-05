import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Une erreur s'est produite
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Nous nous excusons pour cette erreur inattendue. Veuillez essayer de recharger la page ou contactez le support si le problème persiste.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-muted p-4 rounded-md">
                <p className="font-mono text-sm text-destructive">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-32">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={this.handleRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Recharger la page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    console.error('Error caught by error handler:', error, errorInfo);
    // You could send to error reporting service here
  };
}

// Higher-order component for wrapping specific components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}