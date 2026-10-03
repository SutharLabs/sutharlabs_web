import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/workspace/stock-tracker';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-[#0c0c0e]/80 backdrop-blur-md rounded-2xl border border-red-500/20 text-[#e5e1e4]">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            
            <h2 className="text-xl font-bold text-white tracking-tight">
              {this.props.fallbackTitle || 'Workspace Error Caught'}
            </h2>
            
            <p className="text-xs text-[#849495] font-mono leading-relaxed bg-[#131315] p-3 rounded-lg border border-[#3a494b]/20 break-words text-left">
              {this.state.error?.message || 'An unexpected rendering error occurred in this workspace module.'}
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#00dbe7] text-[#002022] hover:bg-[#74f5ff] text-xs font-mono font-bold uppercase rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Reload Platform
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-4 py-2 bg-[#201f21] border border-[#3a494b]/40 text-[#e5e1e4] hover:bg-[#2e2d30] text-xs font-mono font-medium rounded-lg transition-all cursor-pointer"
              >
                Go to Stock Tracker
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
