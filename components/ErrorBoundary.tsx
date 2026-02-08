import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        
        // Store error info for display
        this.setState({ errorInfo });
        
        // Log to an error reporting service if available
        // Example: Sentry.captureException(error, { extra: errorInfo });
    }

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    public render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-deep-950 p-4">
                    <div className="bg-white dark:bg-deep-900 p-8 rounded-lg shadow-xl max-w-2xl w-full">
                        <div className="flex items-start mb-4">
                            <div className="flex-shrink-0">
                                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Something went wrong</h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-2">
                                    The application encountered an error. This is usually temporary and can be fixed by refreshing the page.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-100 dark:bg-deep-800 p-4 rounded overflow-auto max-h-48 mb-4">
                            <p className="text-sm font-mono text-red-600 dark:text-red-400 mb-2">
                                {this.state.error?.toString()}
                            </p>
                            {this.state.errorInfo && (
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                        Show component stack
                                    </summary>
                                    <pre className="mt-2 text-xs text-gray-700 dark:text-gray-300 overflow-auto">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={this.handleReset}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                            >
                                Reload Page
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    window.location.reload();
                                }}
                                className="w-full bg-gray-200 dark:bg-deep-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded hover:bg-gray-300 dark:hover:bg-deep-600 transition-colors"
                            >
                                Clear Cache & Reload
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                className="w-full bg-gray-100 dark:bg-deep-800 text-gray-700 dark:text-gray-300 py-2 px-4 rounded hover:bg-gray-200 dark:hover:bg-deep-700 transition-colors"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
