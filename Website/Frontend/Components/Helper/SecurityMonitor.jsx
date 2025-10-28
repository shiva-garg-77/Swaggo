'use client';

import { useState, useEffect } from 'react';
import { isProduction } from '../../config/environment';

/**
 * Security monitoring component
 * Tracks security events and suspicious activity
 */
export default function SecurityMonitor({ children }) {
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
        
        // Log security events only in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('🚨 Security Event:', event);
        }
      },
      getEvents: () => securityEvents
    };
    
    let devToolsInterval = null;
    
    // Monitor for suspicious activity
    const monitorDevTools = () => {
      const threshold = 160;
      devToolsInterval = setInterval(() => {
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
      if (isProduction) {
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
        
        if (isPressed && isProduction) {
          window.__SECURITY_MONITOR__?.reportEvent({
            type: 'suspicious_key_combination',
            severity: 'low',
            details: { combination: name, location: window.location.pathname }
          });
        }
      });
    };
    
    // Only enable monitoring in production
    if (isProduction) {
      monitorDevTools();
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        if (devToolsInterval) clearInterval(devToolsInterval);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
        delete window.__SECURITY_MONITOR__;
      };
    }
    
    return () => {
      delete window.__SECURITY_MONITOR__;
    };
  }, [securityEvents]);
  
  return children;
}
