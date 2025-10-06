'use client';

import React from 'react';

/**
 * 🚨 TEMPORARY AUTH BYPASS - DEVELOPMENT ONLY
 * 
 * This component provides a quick bypass for authentication issues
 * that cause infinite loading states during development.
 * 
 * SECURITY NOTE: This is only for development debugging.
 * Remove before production deployment.
 */

const AuthBypassFixed = ({ onBypass }) => {
  const handleBypass = () => {
    console.log('🛠️ AUTH BYPASS: Simulating login success for development');
    
    // Simulate successful authentication state
    const mockUser = {
      id: 'dev-user-123',
      username: 'developer',
      email: 'dev@localhost',
      role: 'admin',
      verified: true
    };
    
    const mockPermissions = {
      role: 'admin',
      scopes: ['read', 'write', 'admin'],
      restrictions: []
    };
    
    const mockSession = {
      deviceFingerprint: 'dev-device',
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      location: 'localhost'
    };
    
    const mockSecurity = {
      deviceTrusted: true,
      biometricEnabled: false,
      mfaRequired: false,
      riskLevel: 0,
      threats: [],
      lastSecurityCheck: new Date().toISOString()
    };
    
    // Call the bypass callback with mock data
    if (onBypass) {
      onBypass({
        user: mockUser,
        permissions: mockPermissions,
        session: mockSession,
        security: mockSecurity
      });
    }
  };
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed top-4 right-4 z-[9999] bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4 shadow-lg">
      <div className="text-yellow-800">
        <h3 className="font-bold text-sm mb-2">⚠️ Development Mode</h3>
        <p className="text-xs mb-3">Auth system appears stuck. Bypass for development?</p>
        <button
          onClick={handleBypass}
          className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 transition-colors"
        >
          🛠️ Bypass Auth (Dev Only)
        </button>
      </div>
      <div className="text-xs text-yellow-600 mt-2">
        This will be removed in production
      </div>
    </div>
  );
};

export default AuthBypassFixed;