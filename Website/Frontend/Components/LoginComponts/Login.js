"use client";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '../Helper/ThemeProvider';
import { useFixedSecureAuth as useSecureAuth } from '../../context/FixedSecureAuthContext';
import { toast } from 'react-hot-toast';

export default function Login() {
  const { theme } = useTheme();
  const { 
    login, 
    isAuthenticated,
    isLoading,
    error,
    clearError
  } = useSecureAuth();
  
  // Map SecureAuth properties to legacy interface
  const initialized = !isLoading;
  const ErrorMsg = error;
  const router = useRouter();
  const [formData, setFormData] = useState({
    emailorUsername: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // MFA state
  const [mfaState, setMfaState] = useState({
    required: false,
    token: null,
    code: '',
    useBackupCode: false,
    attemptsRemaining: 3,
    backupCodesAvailable: false
  });

  // Handle redirect on successful login (only after initialization)
  useEffect(() => {
    if (initialized && isAuthenticated) {
      router.push('/home');
    }
  }, [initialized, isAuthenticated, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error message when user starts typing
    if (ErrorMsg || error) {
      clearError();
    }
  };
  
  const handleMFACodeChange = (e) => {
    const { value } = e.target;
    
    // Only allow numbers for TOTP codes
    if (!mfaState.useBackupCode && !/^\d*$/.test(value)) {
      return;
    }
    
    setMfaState(prev => ({ ...prev, code: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { emailorUsername, password } = formData;
    let info;
    if (emailorUsername.includes('@')) {
      info = { email: emailorUsername, password }
    } else {
      info = { username: emailorUsername, password }
    }
    
    try {
      // Use main auth login (already has MFA support built-in)
      const result = await login({
        identifier: emailorUsername,
        password: password
      });
      
      if (result.success) {
        toast.success('Login successful!');
        router.push('/home');
      } else if (result.mfaRequired) {
        // MFA required
        setMfaState({
          required: true,
          token: result.mfaToken,
          code: '',
          useBackupCode: false,
          attemptsRemaining: 3,
          backupCodesAvailable: result.backupCodesAvailable
        });
        toast.info('Please enter your authentication code.');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (err) {
      console.error("Login failed:", err);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleMFASubmit = async (e) => {
    e.preventDefault();
    if (!mfaState.code.trim()) {
      toast.error('Please enter the authentication code');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the main login method with MFA code
      const result = await login({
        identifier: formData.emailorUsername,
        password: formData.password
      }, mfaState.code.trim());
      
      if (result && result.success) {
        toast.success('Authentication successful!');
        setMfaState(prev => ({ ...prev, required: false }));
        router.push('/home');
      } else {
        toast.error(result?.error || 'Authentication failed');
        setMfaState(prev => ({
          ...prev,
          code: '',
          attemptsRemaining: prev.attemptsRemaining - 1
        }));
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      toast.error('Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const toggleBackupCode = () => {
    setMfaState(prev => ({
      ...prev,
      useBackupCode: !prev.useBackupCode,
      code: ''
    }));
  };

  // Show nothing until initialized
  if (!initialized) {
    return null;
  }

  // Don't render login form if user is already authenticated
  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-5 gap-5 flex-wrap transition-all duration-300">

      {/* Login Card */}
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-2xl px-10 w-full max-w-md text-center shadow-2xl border border-white/20 dark:border-white/10 hover:transform hover:-translate-y-2 transition-all duration-300 animate-[slideUp_0.6s_ease-out]">

        {/* Logo Section */}
        <div className=" py-6">
          {/* Fixed consistent dimensions for both light and dark logos */}
          <div className="w-32 h-16 mx-auto flex items-center justify-center">
            <img
              src={theme === 'light' ? '/logo_light.png' : '/Logo_dark1.png'}
              alt="Swaggo Logo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>

        {/* Login Form */}
        {!mfaState.required ? (
          <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-5 text-left">
            <label htmlFor="emailorUsername" className="block text-gray-700 dark:text-gray-200 font-medium mb-2 text-sm transition-colors duration-300">
              Username or Email
            </label>
            <input
              type="text"
              id="emailorUsername"
              name="emailorUsername"
              value={formData.emailorUsername}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-[#F7F4F4] dark:bg-white/10 border-[1px] border-black dark:border-white/20 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:border-red-500 focus:ring-0 focus:outline-none focus:bg-white dark:focus:bg-white/15 transition-all duration-300"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="mb-5 text-left">
            <label htmlFor="password" className="block text-gray-700 dark:text-gray-200 font-medium mb-2 text-sm transition-colors duration-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-[#F7F4F4] dark:bg-white/10 border border-black dark:border-white/20 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:border-red-500 focus:ring-0 focus:outline-none focus:bg-white dark:focus:bg-white/15 transition-all duration-300"
              placeholder="Enter your password"
              required
            />
          </div>

          {ErrorMsg && (
            <p className="text-red-500 text-sm mb-3 text-center">
              {ErrorMsg}
            </p>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-9 rounded-3xl transition-all duration-300 mb-5 ${
              isSubmitting
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/30'
            }`}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
          <div className='h-[0.5px] w-full bg-cyan-900'></div>

          <Link href={"/forget-password"}>
            <button
              type="button"
              className="text-red-500 my-5 hover:text-red-600 text-sm font-medium hover:underline hover:scale-105 transition-all duration-300 mb-5"
            >
              Forgot Password?
            </button>
          </Link>
        </form>
        ) : (
          /* MFA Form */
          <form onSubmit={handleMFASubmit} className="w-full">
            <div className="mb-5 text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {mfaState.useBackupCode
                  ? 'Enter one of your backup codes'
                  : 'Enter the 6-digit code from your authenticator app'
                }
              </p>
            </div>
            
            <div className="mb-5 text-left">
              <label htmlFor="mfaCode" className="block text-gray-700 dark:text-gray-200 font-medium mb-2 text-sm transition-colors duration-300">
                {mfaState.useBackupCode ? 'Backup Code' : 'Authentication Code'}
              </label>
              <input
                type={mfaState.useBackupCode ? 'text' : 'tel'}
                id="mfaCode"
                name="mfaCode"
                value={mfaState.code}
                onChange={handleMFACodeChange}
                className="w-full px-4 py-3 bg-[#F7F4F4] dark:bg-white/10 border-[1px] border-black dark:border-white/20 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:border-red-500 focus:ring-0 focus:outline-none focus:bg-white dark:focus:bg-white/15 transition-all duration-300 text-center text-lg tracking-widest"
                placeholder={mfaState.useBackupCode ? 'Enter backup code' : '000000'}
                maxLength={mfaState.useBackupCode ? 16 : 6}
                autoComplete="one-time-code"
                required
                disabled={isSubmitting}
              />
            </div>
            
            {mfaState.attemptsRemaining < 3 && (
              <div className="mb-4 text-center">
                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                  {mfaState.attemptsRemaining} attempts remaining
                </p>
              </div>
            )}
            
            <div className="flex flex-col gap-3 mb-5">
              <button
                type="submit"
                disabled={isSubmitting || !mfaState.code.trim()}
                className={`bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-9 rounded-3xl transition-all duration-300 ${
                  isSubmitting || !mfaState.code.trim()
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/30'
                }`}
              >
                {isSubmitting ? 'Verifying...' : 'Verify'}
              </button>
              
              {mfaState.backupCodesAvailable && (
                <button
                  type="button"
                  onClick={toggleBackupCode}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium hover:underline transition-all duration-300"
                  disabled={isSubmitting}
                >
                  {mfaState.useBackupCode ? 'Use App Code Instead' : 'Use Backup Code'}
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setMfaState(prev => ({ ...prev, required: false }))}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-medium hover:underline transition-all duration-300"
                disabled={isSubmitting}
              >
                ← Back to login
              </button>
            </div>
          </form>
        )}
        {/* Sign Up Section */}
      </div>
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-2xl w-full max-w-md text-center shadow-2xl border border-white/20 dark:border-white/10 hover:transform hover:-translate-y-2 transition-all duration-300 animate-[slideUp_0.6s_ease-out] p-6  border-t ">
        <span className="text-gray-600 dark:text-gray-300 text-sm">
          Don't have an account?
        </span>
        <Link href={"/signup"} className="text-blue-500 hover:text-blue-600 text-sm font-medium ml-1 hover:underline hover:scale-105 transition-all duration-300">
          Sign up
        </Link>
      </div>


    </div>
  );
}