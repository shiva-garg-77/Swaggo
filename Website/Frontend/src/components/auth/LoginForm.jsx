import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useGuestOnly } from '../../contexts/AuthContext';
import { Lock, User, Shield, Eye, EyeOff, Smartphone } from 'lucide-react';
import Link from 'next/link';
// CRITICAL MEMORY LEAK FIXES
import { useEventManager, useTimerManager, useMemoryMonitoring } from '../../utils/memoryLeakFixes';

/**
 * 🛡️ SECURE LOGIN FORM COMPONENT
 * 
 * Features:
 * - Seamless auto-login with token refresh
 * - MFA/2FA support with TOTP
 * - Device trust management
 * - Real-time security feedback
 * - Comprehensive error handling
 */

export default function LoginForm() {
  const auth = useGuestOnly(); // Redirects if already authenticated
  
  // 🔧 CRITICAL: Initialize memory leak prevention systems
  const eventManager = useEventManager();
  const timerManager = useTimerManager();
  
  // 🔧 CRITICAL: Monitor memory usage
  useMemoryMonitoring({
    alertThreshold: 30 * 1024 * 1024, // 30MB threshold for forms
    checkInterval: 45000, // Check every 45 seconds
    onMemoryAlert: (memoryInfo) => {
      console.warn('🚨 MEMORY ALERT in LoginForm:', {
        used: `${(memoryInfo.used / 1024 / 1024).toFixed(2)}MB`,
        percentage: `${memoryInfo.percentage.toFixed(1)}%`
      });
    }
  });
  
  // Form state
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    totpCode: '',
    rememberMe: false,
    trustDevice: false
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showTotpInput, setShowTotpInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [securityInfo, setSecurityInfo] = useState(null);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear field-specific errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Form validation with memoization to prevent memory leaks
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email or username is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    if (showTotpInput && (!formData.totpCode || formData.totpCode.length !== 6)) {
      newErrors.totpCode = 'Please enter a valid 6-digit code';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.identifier, formData.password, formData.totpCode, showTotpInput]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await auth.login(formData);
      
      if (result.requiresMFA && !showTotpInput) {
        setShowTotpInput(true);
        setSecurityInfo({
          message: 'Two-factor authentication required',
          type: 'info'
        });
      }
      
    } catch (error) {
      setErrors({ submit: error.message });
      setSecurityInfo({
        message: error.message,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle MFA verification
  const handleMFASubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.totpCode || formData.totpCode.length !== 6) {
      setErrors({ totpCode: 'Please enter a valid 6-digit code' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await auth.verifyMFA(formData.totpCode);
    } catch (error) {
      setErrors({ totpCode: error.message });
      setSecurityInfo({
        message: error.message,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Security risk indicator component
  const SecurityIndicator = ({ riskScore = 0 }) => {
    const getRiskLevel = () => {
      if (riskScore < 20) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-50' };
      if (riskScore < 50) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
      return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-50' };
    };
    
    const risk = getRiskLevel();
    
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${risk.bgColor}`}>
        <Shield className={`w-4 h-4 ${risk.color}`} />
        <span className={`text-sm font-medium ${risk.color}`}>
          Security Risk: {risk.level}
        </span>
      </div>
    );
  };

  // Auto-focus TOTP input when shown with proper cleanup
  useEffect(() => {
    if (showTotpInput) {
      const focusTimeout = timerManager.setTimeout(() => {
        const totpInput = document.querySelector('input[name="totpCode"]');
        if (totpInput) {
          totpInput.focus();
        }
      }, 100); // Small delay to ensure DOM is ready
      
      // Cleanup handled automatically by timerManager
    }
  }, [showTotpInput, timerManager]);

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>

        {/* Security Info */}
        {securityInfo && (
          <div className={`p-4 rounded-md ${
            securityInfo.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
          }`}>
            <p className="text-sm">{securityInfo.message}</p>
          </div>
        )}

        {/* Security Risk Indicator */}
        {auth.security?.riskScore > 0 && (
          <SecurityIndicator riskScore={auth.security.riskScore} />
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={showTotpInput ? handleMFASubmit : handleSubmit}>
          <div className="space-y-4">
            {!showTotpInput ? (
              <>
                {/* Email/Username Field */}
                <div>
                  <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                    Email or Username
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      required
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.identifier ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email or username"
                      value={formData.identifier}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.identifier && (
                    <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Remember Me & Trust Device */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="rememberMe"
                      name="rememberMe"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                    <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                {/* Trust This Device */}
                <div className="flex items-center">
                  <input
                    id="trustDevice"
                    name="trustDevice"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.trustDevice}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="trustDevice" className="ml-2 block text-sm text-gray-900">
                    Trust this device (reduces future security checks)
                  </label>
                </div>
              </>
            ) : (
              <>
                {/* Two-Factor Authentication */}
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Smartphone className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-gray-600">
                    Please enter the 6-digit code from your authenticator app
                  </p>
                </div>

                <div>
                  <label htmlFor="totpCode" className="block text-sm font-medium text-gray-700">
                    Authentication Code
                  </label>
                  <div className="mt-1">
                    <input
                      id="totpCode"
                      name="totpCode"
                      type="text"
                      maxLength="6"
                      pattern="[0-9]{6}"
                      className={`block w-full text-center text-2xl tracking-widest py-3 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.totpCode ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="000000"
                      value={formData.totpCode}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      autoComplete="one-time-code"
                    />
                  </div>
                  {errors.totpCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.totpCode}</p>
                  )}
                </div>

                {/* Back to Password */}
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-500"
                    onClick={() => {
                      setShowTotpInput(false);
                      setFormData(prev => ({ ...prev, totpCode: '' }));
                      setErrors({});
                    }}
                  >
                    ← Back to password login
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  {showTotpInput ? 'Verifying...' : 'Signing in...'}
                </>
              ) : (
                <>
                  <Lock className="-ml-1 mr-2 h-5 w-5" />
                  {showTotpInput ? 'Verify Code' : 'Sign in'}
                </>
              )}
            </button>
          </div>

          {/* Form Errors */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
        </form>

        {/* Security Features Info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Security Features</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• End-to-end encryption with secure token rotation</li>
            <li>• Device fingerprinting and trust scoring</li>
            <li>• Automatic session management and timeout</li>
            <li>• Real-time threat detection and prevention</li>
            <li>• Two-factor authentication support</li>
          </ul>
        </div>

        {/* Device Information */}
        {auth.security?.deviceFingerprint && (
          <div className="text-center text-xs text-gray-500">
            Device ID: {auth.security.deviceFingerprint.substring(0, 8)}...
            {auth.security.deviceTrusted && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Trusted
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}