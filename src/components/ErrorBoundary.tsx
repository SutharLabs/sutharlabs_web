import React, { Component, ErrorInfo, ReactNode } from 'react';
import { telemetryLogger } from '../services/telemetryLogger';
import BugReportModal from './BugReportModal';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isReportModalOpen: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isReportModalOpen: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isReportModalOpen: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    telemetryLogger.scope('main:error-boundary').error(
      'React ErrorBoundary captured an unhandled view exception',
      { componentStack: errorInfo.componentStack },
      error
    );
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, isReportModalOpen: false });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, isReportModalOpen: false });
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

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => this.setState({ isReportModalOpen: true })}
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs font-mono font-bold rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">bug_report</span>
                Report Crash with Logs
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-3.5 py-2 bg-[#201f21] border border-[#3a494b]/40 text-[#00dbe7] hover:border-[#00dbe7]/50 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Reload
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-3.5 py-2 bg-[#201f21] border border-[#3a494b]/40 text-[#e5e1e4] hover:bg-[#2e2d30] text-xs font-mono font-medium rounded-lg transition-all cursor-pointer"
              >
                Stock Tracker
              </button>
            </div>
          </div>

          <BugReportModal
            isOpen={this.state.isReportModalOpen}
            onClose={() => this.setState({ isReportModalOpen: false })}
            initialError={this.state.error || undefined}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
