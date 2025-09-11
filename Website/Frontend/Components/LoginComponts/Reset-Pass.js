"use client";
import React from 'react'
import { useState, useContext, useEffect } from 'react';
import { useTheme } from '../Helper/ThemeProvider';
import { AuthContext } from '../Helper/AuthProvider';
import { useRouter } from 'next/navigation';

const Resetpass = ({ token }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const { resetPassword, ErrorMsg, successMsg, clearMessages, clearError, accessToken } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});

  // Redirect to home if already authenticated
  useEffect(() => {
    if (accessToken) {
      router.push('/home');
    }
  }, [accessToken, router]);

  // Clear messages on component unmount only
  useEffect(() => {
    return () => {
      clearMessages();
    };
  }, []);

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
    if (ErrorMsg) {
      clearError();
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous field errors
    setFieldErrors({});
    
    // Basic validation
    const errors = {};
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const result = await resetPassword(formData, token);
    
    if (result.success) {
      // Reset form
      setFormData({
        password: '',
        confirmPassword: ''
      });
      // Redirect to home after successful reset
      setTimeout(() => {
        router.push('/home');
      }, 500);
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
        <form onSubmit={handleSubmit} className="w-full">

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
              placeholder="Enter your new password"
              required
            />
            {fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
            )}
          </div>
          <div className="mb-5 text-left">
            <label htmlFor="confirmPassword" className="block text-gray-700 dark:text-gray-200 font-medium mb-2 text-sm transition-colors duration-300">
              confirm Password
            </label>
            <input
              type="Password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-[#F7F4F4] dark:bg-white/10 border-[1px] border-black dark:border-white/20 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:border-red-500 focus:ring-0 focus:outline-none focus:bg-white dark:focus:bg-white/15 transition-all duration-300"
              placeholder="Re-enter Password"
              required
            />
            {fieldErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>
          
        {/* Error/Success Messages */}
        {ErrorMsg && <p className="text-red-500 text-sm mb-3 text-center">{ErrorMsg}</p>}
        {successMsg && <p className="text-green-500 text-sm mb-3 text-center">{successMsg}</p>}
        {fieldErrors.general && <p className="text-red-500 text-sm mb-3 text-center">{fieldErrors.general}</p>}

          <button
            type="submit"
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-9 rounded-3xl transition-all duration-300 mb-5 cursor-pointer hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/30"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  )
}

export default Resetpass