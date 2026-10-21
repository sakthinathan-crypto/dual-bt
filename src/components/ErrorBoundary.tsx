/**
 * Error Boundary Component for DualSync BT.
 * Prevents blank screen crashes by catching rendering errors and displaying actionable recovery options.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Trash2, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      copied: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('DualSync BT uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleResetStorage = (): void => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  private handleCopyDiagnostic = (): void => {
    const diagnosticText = `DualSync BT Error Report:\nError: ${this.state.error?.message || 'Unknown'}\nStack: ${this.state.error?.stack || 'N/A'}\nComponent Stack: ${this.state.errorInfo?.componentStack || 'N/A'}\nUser Agent: ${navigator.userAgent}`;
    navigator.clipboard.writeText(diagnosticText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B1020] text-slate-100 flex items-center justify-center p-4">
          <div className="bg-[#141B2D] border border-red-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Application Encountered an Issue</h1>
                <p className="text-xs text-slate-400">
                  DualSync BT caught a rendering error and prevented a blank screen.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#080D1B] rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <span className="font-semibold text-red-400 block">Error Details:</span>
              <p className="font-mono text-[11px] text-slate-300 break-words leading-relaxed">
                {this.state.error?.message || 'Unknown runtime error occurred.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-[#6C63FF] hover:bg-[#5b52e0] text-white text-xs font-semibold rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#6C63FF]/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>

              <button
                onClick={this.handleResetStorage}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                title="Clears corrupted localStorage cache"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset Cache</span>
              </button>

              <button
                onClick={this.handleCopyDiagnostic}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors inline-flex items-center justify-center cursor-pointer"
                title="Copy error details to clipboard"
              >
                {this.state.copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
