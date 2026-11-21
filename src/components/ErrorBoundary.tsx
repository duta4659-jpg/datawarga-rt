import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Terjadi kesalahan saat memuat aplikasi.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h1 className="text-xl font-bold text-slate-900">
              Aplikasi Mengalami Kendala
            </h1>
            <p className="text-base text-slate-600">
              Terjadi kesalahan tampilan saat membuka DataWarga RT. Data lokal Anda tetap aman di perangkat.
            </p>
            <p className="rounded-xl bg-slate-100 p-3 font-mono text-xs text-slate-700 break-words">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full min-h-[48px] rounded-xl bg-teal-700 px-5 py-2.5 text-base font-semibold text-white hover:bg-teal-800"
            >
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
