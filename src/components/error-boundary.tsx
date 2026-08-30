// ABOUTME: React Error Boundary component that integrates with Sentry for error reporting
// ABOUTME: Catches and reports React rendering errors to provide better user experience

'use client';

import React, { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  eventId?: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture the error with Sentry and get the event ID
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      extra: {
        ...errorInfo,
      },
    });

    this.setState({ eventId });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        this.props.fallback || (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <h2 className="text-foreground text-xl font-semibold">
                This page stopped rendering
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                This one was logged to Sentry. Reloading usually clears it — if
                it comes back, the ID below says exactly what broke.
              </p>
              {this.state.eventId && (
                <p className="text-muted-foreground mt-2 font-mono text-xs">
                  Error ID: {this.state.eventId}
                </p>
              )}
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Reload page
              </Button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
