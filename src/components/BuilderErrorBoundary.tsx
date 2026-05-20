"use client";

import React, { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class BuilderErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Builder render error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '2rem',
            textAlign: 'center',
            gap: '1rem',
          }}
        >
          <AlertCircle size={48} color="var(--primary)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Something went wrong in the builder
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: 0, lineHeight: 1.5 }}>
            A template or preview component crashed. Your data is still saved — try reloading the preview.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={this.handleReset}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
          >
            <RefreshCw size={16} />
            Reload preview
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
