/**
 * @fileoverview GraphQL Error Boundary Component
 * @description Catches and handles GraphQL errors gracefully to prevent app crashes
 */

import React from 'react';
import { ApolloError } from '@apollo/client';

class GraphQLErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      graphqlErrors: [],
      networkError: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('GraphQL Error Boundary caught an error:', error, errorInfo);

    // Parse GraphQL-specific errors
    if (error instanceof ApolloError) {
      this.setState({
        graphqlErrors: error.graphQLErrors || [],
        networkError: error.networkError || null,
        errorInfo,
      });
    } else {
      this.setState({ errorInfo });
    }

    // Optional: Send to error reporting service
    if (typeof window !== 'undefined' && window.reportError) {
      window.reportError(error);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      graphqlErrors: [],
      networkError: null,
    });
    
    // Optional: Reload page or navigate to safe route
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          graphqlErrors: this.state.graphqlErrors,
          networkError: this.state.networkError,
          reset: this.handleReset,
        });
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                Something went wrong
              </h2>
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {this.state.graphqlErrors.length > 0
                        ? 'GraphQL Error'
                        : this.state.networkError
                        ? 'Network Error'
                        : 'Application Error'}
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {this.state.graphqlErrors.length > 0 && (
                        <ul className="list-disc space-y-1 pl-5">
                          {this.state.graphqlErrors.map((err, idx) => (
                            <li key={idx}>{err.message}</li>
                          ))}
                        </ul>
                      )}
                      {this.state.networkError && (
                        <p>Network error: {this.state.networkError.message}</p>
                      )}
                      {!this.state.graphqlErrors.length && !this.state.networkError && (
                        <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center gap-x-6">
                <button
                  onClick={this.handleReset}
                  className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Try again
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="text-sm font-semibold text-gray-900"
                >
                  Go home <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 rounded-md bg-gray-100 p-4 text-xs text-gray-600">
                <summary className="cursor-pointer font-semibold">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(
                    {
                      error: this.state.error?.toString(),
                      stack: this.state.error?.stack,
                      graphqlErrors: this.state.graphqlErrors,
                      networkError: this.state.networkError?.toString(),
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GraphQLErrorBoundary;
