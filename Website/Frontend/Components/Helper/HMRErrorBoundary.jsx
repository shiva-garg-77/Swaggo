'use client'

import React from 'react'

class HMRErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error but don't break the app during HMR
    if (process.env.NODE_ENV === 'development') {
      console.warn('HMR Error caught:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      // In development, show a friendly error message
      if (process.env.NODE_ENV === 'development') {
        return (
          <div style={{ padding: '20px', backgroundColor: '#fee', border: '1px solid #fcc' }}>
            <h2>⚠️ Component Error (HMR)</h2>
            <p>A component failed to load. This often happens during hot reload.</p>
            <button 
              onClick={() => window.location.reload()} 
              style={{ padding: '10px 20px', cursor: 'pointer' }}
            >
              Reload Page
            </button>
            <details style={{ marginTop: '10px' }}>
              <summary>Error Details</summary>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {this.state.error?.toString()}
              </pre>
            </details>
          </div>
        )
      }
      
      // In production, just reload
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
      return null
    }

    return this.props.children
  }
}

export default HMRErrorBoundary
