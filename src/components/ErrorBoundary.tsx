import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('⚠️ [Aswaq Qalat Sukkar ErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public override render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 font-sans text-slate-800" dir="rtl">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <h2 className="text-lg font-black text-slate-900 mb-2">
              أسواق قلعة سكر
            </h2>
            
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              حدث تنبيه مؤقت أثناء معالجة البيانات، تم الحفاظ على استقرار التطبيق. يمكنك العودة للتصفح أو تحديث الصفحة مباشرة.
            </p>

            {this.state.error?.message && (
              <div className="mb-4 rounded-xl bg-slate-50 p-2.5 text-[11px] font-mono text-slate-500 border border-slate-200 text-left overflow-x-auto max-h-24 select-all" dir="ltr">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition"
              >
                <Home className="h-4 w-4" />
                <span>العودة للرئيسية</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 active:scale-95 transition border border-slate-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span>تحديث الصفحة</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
