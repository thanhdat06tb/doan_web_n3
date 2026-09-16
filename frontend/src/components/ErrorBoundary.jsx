import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, pathname: window.location.pathname };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  static getDerivedStateFromProps(_props, state) {
    if (state.hasError && state.pathname !== window.location.pathname) {
      return { hasError: false, error: null, pathname: window.location.pathname };
    }
    return null;
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application render failed:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.history.pushState({}, '', '/');
    this.setState({ hasError: false, error: null, pathname: '/' });
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Trang dang gap loi hien thi</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Ung dung vua bi loi render tam thoi. Ban co the ve trang chu hoac tai lai trang.
          </p>
          {import.meta.env.DEV && this.state.error?.message && (
            <p className="mt-3 rounded bg-slate-100 px-3 py-2 text-xs text-slate-600">
              {this.state.error.message}
            </p>
          )}
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={this.handleHome}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              Ve trang chu
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              Tai lai
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
