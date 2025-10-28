"use client";
import { useState, useEffect, useRef } from 'react';
import OptimizedLink from '../Helper/OptimizedLink';
import { useTheme } from '../Helper/ThemeProvider';
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';

export default function ForgetPass() {
  const { theme } = useTheme();
  const { error: authError, clearError } = useFixedSecureAuth();
  const [formData, setFormData] = useState({
    email: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Use ref to track if component is mounted
  const isMountedRef = useRef(false);

  // Clear messages on component mount and unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    // Clear any existing messages when component mounts
    setErrorMsg('');
    setSuccessMsg('');
    
    return () => {
      isMountedRef.current = false;
      // Only clear messages if component is still mounted
      if (isMountedRef.current) {
        setErrorMsg('');
        setSuccessMsg('');
        if (clearError) clearError();
      }
    };
  }, []); // ✅ FIX: Empty dependency array to run only on mount/unmount

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear global error message when user starts typing
    if (errorMsg) {
      setErrorMsg('');
    }
    if (authError && clearError) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous field errors
    setFieldErrors({});
    
    // Basic validation
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      // Make API call to reset password
      const response = await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: formData.email })
      });
      
      const result = await response.json();
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        if (result.success) {
          setSuccessMsg('Password reset link sent to your email!');
          setErrorMsg('');
          setFormData({ email: '' });
        } else {
          setErrorMsg(result.message || 'Failed to send reset link');
          setSuccessMsg('');
        }
      }
    } catch (error) {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setErrorMsg('Network error. Please try again.');
        setSuccessMsg('');
      }
    }
  };

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
        <form onSubmit={handleSubmit} className="w-full ">
          <div className="mb-10 text-left">
            <label htmlFor="email" className="block text-gray-700 dark:text-gray-200 font-medium mb-2 text-sm transition-colors duration-300">
              Username or Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-[#F7F4F4] dark:bg-white/10 border-[1px] border-black dark:border-white/20 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:border-red-500 focus:ring-0 focus:outline-none focus:bg-white dark:focus:bg-white/15 transition-all duration-300"
              placeholder="Enter your email"
              required
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
            )}
          </div>
          {/* Error/Success Messages */}
          {errorMsg && <p className="text-red-500 text-sm mb-3 text-center">{errorMsg}</p>}
          {successMsg && <p className="text-green-500 text-sm mb-3 text-center">{successMsg}</p>}

          <button
            type="submit"
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-9 rounded-3xl transition-all duration-300 mb-5 cursor-pointer hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/30"
          >
            Send Mail
          </button>
        </form>

        <div className='h-[0.5px] w-full bg-cyan-900'></div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 mt-6 transition-colors duration-300">
          Remember your password?{' '}
          <OptimizedLink href="/" className="text-blue-500 hover:underline" prefetch={true}>
            Back to Login
          </OptimizedLink>
        </p>
      </div>
    </div>
  );
}