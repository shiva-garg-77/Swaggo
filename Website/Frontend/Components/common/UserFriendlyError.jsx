import React from 'react';
import PropTypes from 'prop-types';

/**
 * User-Friendly Error Component
 * Displays a friendly error message to users with options to retry or get help
 */
const UserFriendlyError = ({ 
  title = "Something went wrong", 
  message = "We're having trouble loading this content. Please try again.",
  onRetry,
  showRetry = true,
  showHelp = true,
  icon = "⚠️"
}) => {
  return (
    <div className="user-friendly-error">
      <div className="error-content">
        <div className="error-icon">{icon}</div>
        <h2 className="error-title">{title}</h2>
        <p className="error-message">{message}</p>
        <div className="error-actions">
          {showRetry && onRetry && (
            <button 
              className="retry-button"
              onClick={onRetry}
            >
              Try Again
            </button>
          )}
          {showHelp && (
            <button 
              className="help-button"
              onClick={() => {
                // In a real app, this would open a help dialog or contact support
                alert('For assistance, please contact support@swaggo.com or check our help center.');
              }}
            >
              Get Help
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

UserFriendlyError.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func,
  showRetry: PropTypes.bool,
  showHelp: PropTypes.bool,
  icon: PropTypes.string
};

export default UserFriendlyError;