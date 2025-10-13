import React from 'react';
import PropTypes from 'prop-types';
import UserFriendlyError from './UserFriendlyError';
import './ErrorBoundary.css';
import errorMonitoringService from '../../monitoring/ErrorMonitoringService';

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays a fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      eventId: null
    };
  }

  /**
   * Static method to handle errors
   */
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  /**
   * componentDidCatch lifecycle method
   * Logs the error to console and sends to monitoring service
   */
  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Report error to monitoring service
    errorMonitoringService.reportError(error, {
      componentStack: errorInfo.componentStack,
      boundary: 'ErrorBoundary',
      ...this.props.errorContext
    });
    
    // Log error to monitoring service if available
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Render method
   */
  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="error-boundary">
          <UserFriendlyError
            title="Something went wrong"
            message="We're having trouble loading this content. Please try again."
            onRetry={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              if (typeof this.props.onRetry === 'function') {
                this.props.onRetry();
              }
            }}
            showRetry={true}
            showHelp={true}
          />
          {this.props.showDetails && this.state.errorInfo && (
            <details className="error-stack">
              <summary>Error Details</summary>
              <pre>{this.state.errorInfo.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    // Render children normally
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onError: PropTypes.func,
  onRetry: PropTypes.func,
  showDetails: PropTypes.bool,
  errorContext: PropTypes.object
};

ErrorBoundary.defaultProps = {
  showDetails: false,
  errorContext: {}
};

export default ErrorBoundary;