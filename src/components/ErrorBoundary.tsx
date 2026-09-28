import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Store:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white border border-zinc-200 p-8 rounded-3xl space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center font-black text-xl">
              !
            </div>
            <h1 className="text-xl font-black text-zinc-900">Unable to load page</h1>
            <p className="text-xs text-zinc-500">
              {this.state.error?.message || 'An unexpected rendering error occurred. Please refresh or reset.'}
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all cursor-pointer shadow-sm"
              >
                Try Again (পুনরায় চেষ্টা করুন)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.history.pushState({}, '', '/');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                  this.setState({ hasError: false, error: null });
                }}
                className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
