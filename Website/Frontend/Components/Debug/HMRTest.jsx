'use client';

import { useState, useEffect } from 'react';

/**
 * 🔥 HMR Test Component
 * 
 * This component helps verify that Hot Module Replacement is working properly.
 * 
 * To test HMR:
 * 1. Save this file with changes
 * 2. The page should update instantly WITHOUT a full reload
 * 3. State should be preserved during updates
 * 
 * If you see a full page reload, HMR is not working properly.
 * 
 * HYDRATION FIX: Uses client-only time rendering to prevent server/client mismatch
 */
export default function HMRTest() {
  const [count, setCount] = useState(0);
  const [hmrTime, setHmrTime] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Ensure hydration safety by only showing time after client mount
  useEffect(() => {
    setIsClient(true);
    setHmrTime(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    // Only update time on the client to prevent hydration mismatches
    if (isClient) {
      setHmrTime(new Date().toLocaleTimeString());
    }
  });

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#000',
      color: '#0f0',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      border: '1px solid #0f0'
    }}>
      <div>🔥 HMR Status</div>
      <div>Count: {count}</div>
      <div>Updated: {isClient ? hmrTime : 'Loading...'}</div>
      <button 
        onClick={() => setCount(c => c + 1)}
        style={{
          background: '#0f0',
          color: '#000',
          border: 'none',
          padding: '2px 8px',
          marginTop: '5px',
          cursor: 'pointer'
        }}
      >
        Test State Persistence
      </button>
      <div style={{ marginTop: '5px', fontSize: '10px' }}>
        {/* Change this text to test HMR */}
        ✅ HMR Working! v1.1
      </div>
      <div style={{ marginTop: '3px', fontSize: '9px', opacity: 0.8 }}>
        🔄 Unified Refresh: {typeof window !== 'undefined' && window.__unifiedRefresh ? 'Active' : 'Loading...'}
      </div>
      <button
        onClick={() => {
          if (typeof window !== 'undefined' && window.__unifiedRefresh) {
            window.__unifiedRefresh();
          }
        }}
        style={{
          background: '#ff0',
          color: '#000',
          border: 'none',
          padding: '1px 4px',
          marginTop: '3px',
          cursor: 'pointer',
          fontSize: '9px'
        }}
        title="Unified refresh trigger (for testing)"
      >
        Unified Refresh
      </button>
    </div>
  );
}