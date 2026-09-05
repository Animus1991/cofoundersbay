'use client';

import { Component, ReactNode, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, MessageCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';

// Error reporting service integration point
async function reportError(error: Error, errorInfo: React.ErrorInfo | null, context?: Record<string, unknown>) {
  // In production, this would send to Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'production') {
    try {
      // Example: await fetch('/api/errors', { method: 'POST', body: JSON.stringify({ error: error.message, stack: error.stack, componentStack: errorInfo?.componentStack, context }) });
      console.error('[Error Report]', { error: error.message, context });
    } catch {
      // Silently fail error reporting
    }
  }
}

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Optional context for error reporting */
  context?: Record<string, unknown>;
  /** Show compact version */
  compact?: boolean;
  /** Custom retry function */
  onRetry?: () => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate a unique error ID for support reference
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Report error
    reportError(error, errorInfo, this.props.context);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = (): void => {
    if (this.props.onRetry) {
      this.props.onRetry();
    }
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Compact version for inline errors
      if (this.props.compact) {
        return (
          <div className="flex items-center justify-center p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive-accessible shrink-0" />
              <p className="text-sm text-muted-foreground">Failed to load content</p>
              <Button onClick={this.handleRetry} size="sm" variant="ghost" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              {/* Error illustration */}
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive-accessible" />
              </div>
              
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                Something went wrong
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                We encountered an unexpected error. Please try again or contact support if the problem persists.
              </p>

              {/* Error ID for support */}
              {this.state.errorId && (
                <p className="mb-6 text-xs text-muted-foreground/60">
                  Error ID: <code className="bg-secondary/40 px-1.5 py-0.5 rounded">{this.state.errorId}</code>
                </p>
              )}

              {/* Error details (development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Error details
                  </summary>
                  <pre className="mt-2 overflow-auto rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground max-h-48">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              {/* Actions */}
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => (window.location.href = '/')}
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
                <Button onClick={this.handleRetry} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional error fallback component
export function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex min-h-[300px] items-center justify-center p-6">
      <div className="text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive-accessible mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error loading content</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <Button onClick={resetErrorBoundary} size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}

// Wrapper for page-level error boundaries
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary context={{ level: 'page' }}>
      {children}
    </ErrorBoundary>
  );
}

// Wrapper for component-level error boundaries (compact)
export function ComponentErrorBoundary({ 
  children, 
  onRetry 
}: { 
  children: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <ErrorBoundary compact onRetry={onRetry} context={{ level: 'component' }}>
      {children}
    </ErrorBoundary>
  );
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: { compact?: boolean; context?: Record<string, unknown> }
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const WithErrorBoundary = (props: P) => (
    <ErrorBoundary 
      compact={options?.compact} 
      context={{ ...options?.context, component: displayName }}
    >
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
  
  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  return WithErrorBoundary;
}
