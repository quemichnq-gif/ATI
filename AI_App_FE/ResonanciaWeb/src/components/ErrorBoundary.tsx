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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('⚠️ [Resonancia ErrorBoundary] Caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/home';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 text-center">
          <div className="glass-card max-w-md w-full p-8 border border-purple-500/30 shadow-2xl space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(168,85,247,0.2))', border: '1px solid rgba(236,72,153,0.4)' }}>
              ✨
            </div>
            
            <h2 className="text-xl font-bold text-white font-display">
              {this.props.fallbackTitle || 'Tín Hiệu Vũ Trụ Bị Gián Đoạn'}
            </h2>
            
            <p className="text-purple-300 text-sm opacity-80 leading-relaxed">
              Trang vừa gặp sự cố hiển thị nhỏ trong quá trình chuyển mục. Bạn có thể bấm thử lại hoặc quay về Trang Chủ.
            </p>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/30 text-left text-xs text-purple-400 font-mono overflow-auto max-h-24">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="btn-cosmic flex-1 py-2.5 text-xs font-semibold"
              >
                ↻ Thử Lại
              </button>
              <button
                onClick={this.handleGoHome}
                className="glass flex-1 py-2.5 rounded-xl text-xs font-semibold text-purple-200 hover:text-white transition-all"
              >
                Về Trang Chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
