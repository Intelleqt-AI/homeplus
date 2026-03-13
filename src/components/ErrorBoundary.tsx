import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-[#F5F5F0]">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-semibold mb-2 text-[#1A1A1A]">Something went wrong</h1>
            <p className="text-[#6B6B6B] mb-4">Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-[#1A1A1A] text-white rounded-full hover:bg-[#333] transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
