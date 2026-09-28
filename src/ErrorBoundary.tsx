import * as React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      let errorMessage = 'Ocorreu um erro inesperado.';
      try {
        const parsed = JSON.parse(error?.message || '');
        if (parsed.error && parsed.operationType) {
          errorMessage = `Erro no Firestore (${parsed.operationType}): ${parsed.error}`;
        }
      } catch {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="bg-red-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-brand-grafite mb-4">Ops! Algo deu errado.</h2>
            <p className="text-brand-grafite mb-8">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-brand-blue text-white py-3 rounded-xl font-bold hover:bg-[#0099d9] transition-all"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
