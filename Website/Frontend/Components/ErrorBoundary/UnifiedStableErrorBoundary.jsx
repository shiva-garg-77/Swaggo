/**
 * @fileoverview Unified Stable Error Boundary Component
 * @module Components/ErrorBoundary/UnifiedStableErrorBoundary
 */

'use client';

import React from 'react';

class UnifiedStableErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('UnifiedStableErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    const maxRetries = this.props.maxRetries || Infinity;
    const newRetryCount = this.state.retryCount + 1;
    
    // Check if we've exceeded max retries
    if (newRetryCount > maxRetries) {
      console.error(`Max retries (${maxRetries}) exceeded. Not retrying.`);
      return;
    }
    
    // Reset error state to retry rendering
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: newRetryCount
    });
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2>Something went wrong.</h2>
          {this.props.showErrorDetails && (
            <details style={{ 
              whiteSpace: 'pre-wrap',
              textAlign: 'left',
              backgroundColor: '#fef2f2',
              padding: '10px',
              borderRadius: '4px',
              marginTop: '10px'
            }}>
              <summary>Error Details</summary>
              <p><strong>Error:</strong> {this.state.error?.message}</p>
              <pre>{this.state.error?.stack}</pre>
              {this.state.errorInfo?.componentStack && (
                <>
                  <p><strong>Component Stack:</strong></p>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </>
              )}
            </details>
          )}
          {(() => {
            const maxRetries = this.props.maxRetries || Infinity;
            const canRetry = this.state.retryCount < maxRetries;
            return canRetry ? (
              <button 
                onClick={this.handleRetry}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Retry {this.state.retryCount > 0 && `(${this.state.retryCount}/${maxRetries})`}
              </button>
            ) : (
              <p style={{ marginTop: '10px', color: '#991b1b', fontWeight: 'bold' }}>
                Maximum retry attempts reached. Please refresh the page.
              </p>
            );
          })()}
        </div>
      );
    }

    return this.props.children;
  }
}

// Export both named and default for maximum compatibility
export { UnifiedStableErrorBoundary };
export default UnifiedStableErrorBoundary;
