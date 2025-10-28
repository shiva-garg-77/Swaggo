"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../Helper/ThemeProvider';
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';
import OptimizedLink from '../Helper/OptimizedLink';

export default function Signup() {
  const { theme } = useTheme();
  const { signup, isAuthenticated, isLoading, error, clearError } = useFixedSecureAuth();
  // Map SecureAuth properties to legacy interface
  const ErrorMsg = error;
  const accessToken = isAuthenticated; // Use authentication state instead of token
  const successMsg = null; // Not available in SecureAuth context

  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    dateOfBirth: '',
    acceptTerms: false,
    gdprConsent: false
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false); // Track if we're on the client
  
  // Add a ref to track if we've hydrated on the client
  const hydratedRef = useRef(false);
  
  // Set isClient to true after mounting
  useEffect(() => {
    setIsClient(true);
    hydratedRef.current = true;
  }, []);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (accessToken) {
      router.push('/home');
    }
  }, [accessToken, router]);

  // Clear error on component unmount
  useEffect(() => {
    return () => {
      if (error) {
        clearError();
      }
    };
  }, [error, clearError]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
    setIsSubmitting(true);

    // Clear previous field errors
    setFieldErrors({});
    
    // Basic validation
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, lowercase letter, number, and special character';
    }

    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13) {
        errors.dateOfBirth = 'You must be at least 13 years old to create an account';
      }
    }
    
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions';
    }
    
    if (!formData.gdprConsent) {
      errors.gdprConsent = 'You must consent to data processing';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare data for submission - convert boolean values to strings as expected by backend
      const submissionData = {
        ...formData,
        acceptTerms: formData.acceptTerms ? 'true' : 'false',
        gdprConsent: formData.gdprConsent ? 'true' : 'false'
      };
      
      // Use the secure signup method
      const result = await signup(submissionData);

      if (result.success) {
        // Reset form
        setFormData({
          email: '',
          username: '',
          password: '',
          dateOfBirth: '',
          acceptTerms: false,
          gdprConsent: false
        });
        
        // Redirect to home page
        router.push('/home');
      }
    } catch (err) {
      console.error('Signup failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only render form elements after hydration to prevent attribute mismatches
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-5 gap-5 flex-wrap transition-all duration-300">
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-2xl px-10 w-full max-w-md text-center shadow-2xl border border-white/20 dark:border-white/10 animate-pulse">
          <div className="py-8">
            <div className="w-32 h-16 mx-auto mb-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="space-y-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
              <div className="h-12 bg-red-200 dark:bg-red-900 rounded-3xl mt-4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-5 gap-5 flex-wrap transition-all duration-300">

      {/* Signup Card */}
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-2xl px-10 w-full max-w-md text-center shadow-2xl border border-white/20 dark:border-white/10 hover:transform hover:-translate-y-2 transition-all duration-300 animate-[slideUp_0.6s_ease-out]">

        {/* Logo Section */}
        <div className=" py-1">
          {/* Fixed consistent dimensions for both light and dark logos */}
          <div className="w-32 h-16 mx-auto mb-4 flex items-center justify-center">
            {/* Only render logo on client to prevent hydration mismatch */}
            {isClient && (
              <img
                src={theme === 'light' ? '/logo_light.png' : '/Logo_dark1.png'}
                alt="Swaggo Logo"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </div>


        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="w-full">


          <div className="mb-3 text-left">
            <label htmlFor="email" className="block text-gray-700 dark:text-gray-200 font-medium mb-2 text-sm transition-colors duration-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-[#F7F4F4] dark:bg-white/10 border-[1px] border-black dark:border-white/20 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:border-red-500 focus:ring-0 focus:outline-none focus:bg-white dark:focus:bg-white/15 transition-all duration-300"
              placeholder="Enter your email"
              required
              // Prevent browser extensions from adding attributes that cause hydration errors
              data-1p-ignore
              data-lpignore
              data-form-type="other"
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div className="mb-3 text-left">
            <label htmlFor="Username" className="block text-gray-700 dark:text-gray-200 font-medium mb-2 text-sm transition-colors duration-300">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-[#F7F4F4] dark:bg-white/10 border-[1px] border-black dark:border-white/20 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:border-red-500 focus:ring-0 focus:outline-none focus:bg-white dark:focus:bg-white/15 transition-all duration-300"
              placeholder="Enter your Username"
              required
              // Prevent browser extensions from adding attributes that cause hydration errors
              data-1p-ignore
              data-lpignore
              data-form-type="other"
            />
            {fieldErrors.username && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>
            )}
          </div>

          <div className="mb-3 text-left">
            <label htmlFor="Password" className="block text-gray-700 dark:text-gray-200 font-medium mb-2 text-sm transition-colors duration-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full py-2 px-4  bg-[#F7F4F4] dark:bg-white/10 border-[1px] border-black dark:border-white/20 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:border-red-500 focus:ring-0 focus:outline-none focus:bg-white dark:focus:bg-white/15 transition-all duration-300"
              placeholder="Enter your password"
              required
              // Prevent browser extensions from adding attributes that cause hydration errors
              data-1p-ignore
              data-lpignore
              data-form-type="other"
            />
            {fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
            )}
          </div>


          <div className="mb-3 text-left">
            <label htmlFor="dateOfBirth" className="block text-gray-700 dark:text-gray-200 font-medium mb-2 text-sm transition-colors duration-300">
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-[#F7F4F4] dark:bg-white/10 border-[1px] border-black dark:border-white/20 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:border-red-500 focus:ring-0 focus:outline-none focus:bg-white dark:focus:bg-white/15 transition-all duration-300"
              required
              // Prevent browser extensions from adding attributes that cause hydration errors
              data-1p-ignore
              data-lpignore
              data-form-type="other"
            />
            {fieldErrors.dateOfBirth && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.dateOfBirth}</p>
            )}
          </div>

          {/* Terms and Conditions Checkbox */}
          <div className="mb-3 text-left">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
                className="mt-1 mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                // Prevent browser extensions from adding attributes that cause hydration errors
                data-1p-ignore
                data-lpignore
                data-form-type="other"
              />
              <span className="text-gray-700 dark:text-gray-200 text-sm">
                I accept the <a href="/terms" target="_blank" className="text-red-500 hover:underline">Terms and Conditions</a>
              </span>
            </label>
            {fieldErrors.acceptTerms && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.acceptTerms}</p>
            )}
          </div>

          {/* GDPR Consent Checkbox */}
          <div className="mb-3 text-left">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                name="gdprConsent"
                checked={formData.gdprConsent}
                onChange={handleInputChange}
                className="mt-1 mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                // Prevent browser extensions from adding attributes that cause hydration errors
                data-1p-ignore
                data-lpignore
                data-form-type="other"
              />
              <span className="text-gray-700 dark:text-gray-200 text-sm">
                I consent to the processing of my personal data in accordance with the <a href="/privacy" target="_blank" className="text-red-500 hover:underline">Privacy Policy</a>
              </span>
            </label>
            {fieldErrors.gdprConsent && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.gdprConsent}</p>
            )}
          </div>

          {ErrorMsg && <p className="text-red-500 text-sm mb-3 text-center">{ErrorMsg}</p>}
          {successMsg && <p className="text-green-500 text-sm mb-3 text-center">{successMsg}</p>}

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className={`bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-9 rounded-3xl transition-all duration-300 mb-5 ${
              isSubmitting || isLoading
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/30'
            }`}
          >
            {isSubmitting || isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Login Link Section */}
      </div>
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-2xl w-full max-w-md text-center shadow-2xl border border-white/20 dark:border-white/10 hover:transform hover:-translate-y-2 transition-all duration-300 animate-[slideUp_0.6s_ease-out] p-6 border-t">
        <span className="text-gray-600 dark:text-gray-300 text-sm">
          Already have an account?
        </span>
        <OptimizedLink href={"/"} className="text-blue-500 hover:text-blue-600 text-sm font-medium ml-1 hover:underline hover:scale-105 transition-all duration-300" prefetch={true}>
          Login
        </OptimizedLink>
      </div>

    </div>
  );
}