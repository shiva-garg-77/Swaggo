'use client';

import React, { useEffect, useState } from 'react';
import { FixedSecureAuthProvider as AuthProvider } from '../context/FixedSecureAuthContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '../Components/ErrorBoundary';
import { isProduction, isDevelopment } from '../config/environment';

/**
 * 🔒 SECURE ROOT PROVIDERS COMPONENT
 * 
 * This component wraps the entire app with comprehensive security providers:
 * - Error boundaries with security-aware reporting
 * - Authentication context with advanced security
 * - Toast notifications with XSS protection
 * - Performance monitoring
 * - Security monitoring integration
 */

// Security-aware toast configuration
const getToastConfig = () => ({
  position: "top-right",
  reverseOrder: false,
  gutter: 8,
  containerClassName: "",
  containerStyle: {},
  toastOptions: {
    // Define default options with security considerations
    className: '',
    duration: 4000,
    style: {
      background: '#363636',
      color: '#fff',
      borderRadius: '8px',
      fontSize: '14px',
      maxWidth: '500px',
      wordBreak: 'break-word', // Prevent long strings from breaking layout
      overflow: 'hidden'
    },
    
    // Sanitize HTML content to prevent XSS
    render: (message) => {
      // Escape HTML entities in toast messages
      const sanitizedMessage = typeof message === 'string' 
        ? message.replace(/[<>&"']/g, (char) => {
            const entities = {
              '<': '&lt;',
              '>': '&gt;',
              '&': '&amp;',
              '"': '&quot;',
              "'": '&#x27;'
            };
            return entities[char] || char;
          })
        : message;
      
      return <span dangerouslySetInnerHTML={{ __html: sanitizedMessage }} />;
    },
    
    // Security-focused toast type configurations
    success: {
      duration: 3000,
      style: {
        background: '#10B981',
        border: '1px solid #059669'
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10B981',
      },
    },
    error: {
      duration: 8000, // Longer duration for security errors
      style: {
        background: '#EF4444',
        border: '1px solid #DC2626'
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#EF4444',
      },
    },
    loading: {
      duration: 30000, // 30 second timeout for loading states
      style: {
        background: '#3B82F6',
        border: '1px solid #2563EB'
      },
    },
    
    // Security warning toast configuration
    custom: {
      duration: 10000, // Longer duration for security warnings
      style: {
        background: '#F59E0B',
        color: '#000',
        border: '1px solid #D97706'
      }
    }
  }
});

// Security monitoring component
const SecurityMonitor = ({ children }) => {
  const [securityEvents, setSecurityEvents] = useState([]);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Initialize security monitoring
    window.__SECURITY_MONITOR__ = {
      reportEvent: (event) => {
        setSecurityEvents(prev => [...prev.slice(-49), { // Keep last 50 events
          ...event,
          timestamp: Date.now(),
          id: Math.random().toString(36).substring(2)
        }]);
        
        // Log security events in development
        if (isDevelopment()) {
          console.warn('🚨 Security Event:', event);
        }
      },
      getEvents: () => securityEvents
    };
    
    // Monitor for suspicious activity
    const monitorDevTools = () => {
      const threshold = 160;
      setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold) {
          window.__SECURITY_MONITOR__?.reportEvent({
            type: 'dev_tools_detected',
            severity: 'low',
            details: { 
              outerDimensions: { width: window.outerWidth, height: window.outerHeight },
              innerDimensions: { width: window.innerWidth, height: window.innerHeight }
            }
          });
        }
      }, 5000);
    };
    
    // Monitor for right-click context menu (mild security indicator)
    const handleContextMenu = (e) => {
      if (isProduction()) {
        window.__SECURITY_MONITOR__?.reportEvent({
          type: 'context_menu_accessed',
          severity: 'low',
          details: { target: e.target.tagName, location: window.location.pathname }
        });
      }
    };
    
    // Monitor for suspicious key combinations
    const handleKeyDown = (e) => {
      const suspiciousKeys = [
        { keys: ['F12'], name: 'F12_dev_tools' },
        { keys: ['Control', 'Shift', 'I'], name: 'ctrl_shift_i' },
        { keys: ['Control', 'Shift', 'J'], name: 'ctrl_shift_j' },
        { keys: ['Control', 'U'], name: 'view_source' }
      ];
      
      suspiciousKeys.forEach(({ keys, name }) => {
        const isPressed = keys.every(key => {
          if (key === 'Control') return e.ctrlKey;
          if (key === 'Shift') return e.shiftKey;
          if (key === 'Alt') return e.altKey;
          return e.key === key;
        });
        
        if (isPressed && isProduction()) {
          window.__SECURITY_MONITOR__?.reportEvent({
            type: 'suspicious_key_combination',
            severity: 'low',
            details: { combination: name, location: window.location.pathname }
          });
        }
      });
    };
    
    // Only enable monitoring in production
    if (isProduction()) {
      monitorDevTools();
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [securityEvents]);
  
  return children;
};

const Providers = ({ children }) => {
  return (
    <ErrorBoundary maxRetries={3}>
      <SecurityMonitor>
        {/* Global Authentication Provider */}
        <AuthProvider>
          {children}
          
          {/* Enhanced Toast Notifications with Security */}
          <Toaster {...getToastConfig()} />
        </AuthProvider>
      </SecurityMonitor>
    </ErrorBoundary>
  );
};

export default Providers;