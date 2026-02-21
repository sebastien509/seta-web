import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-6">
            <div className="text-xl font-bold text-slate-900">Something broke</div>
            <div className="mt-2 text-slate-600">
              Please refresh the page. If it keeps happening, check the console error.
            </div>
            <pre className="mt-4 text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto">
              {String(this.state.error?.message || this.state.error || "Unknown error")}
            </pre>
            <button
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg"
              onClick={() => window.location.reload()}
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
