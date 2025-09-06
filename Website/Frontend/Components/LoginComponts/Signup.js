"use client";
import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../Helper/ThemeProvider';
import { AuthContext } from '../Helper/AuthProvider';
import Link from 'next/link';

export default function Signup() {
  const { theme } = useTheme();
  const { signup, ErrorMsg, successMsg, authLoading, clearMessages, clearError, accessToken } = useContext(AuthContext);

  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    dateOfBirth: ''
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
    }
    
    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const result = await signup(formData);

    if (result.success) {
      // Reset form
      setFormData({
        email: '',
        username: '',
        password: '',
        dateOfBirth: ''
      });
      // Redirect will be handled by useEffect when accessToken is set
      setTimeout(() => {
        router.push('/home');
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-5 gap-5 flex-wrap transition-all duration-300">

      {/* Signup Card */}
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-2xl px-10 w-full max-w-md text-center shadow-2xl border border-white/20 dark:border-white/10 hover:transform hover:-translate-y-2 transition-all duration-300 animate-[slideUp_0.6s_ease-out]">

        {/* Logo Section */}
        <div className=" py-1">
          {/* Fixed consistent dimensions for both light and dark logos */}
          <div className="w-32 h-16 mx-auto mb-4 flex items-center justify-center">
            <img
              src={theme === 'light' ? '/logo_light.png' : '/Logo_dark1.png'}
              alt="Swaggo Logo"
              className="max-w-full max-h-full object-contain"
            />
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
            />
            {fieldErrors.dateOfBirth && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.dateOfBirth}</p>
            )}
          </div>

          {ErrorMsg && <p className="text-red-500 text-sm mb-3 text-center">{ErrorMsg}</p>}
          {successMsg && <p className="text-green-500 text-sm mb-3 text-center">{successMsg}</p>}

          <button
            type="submit"
            disabled={authLoading}
            className={`bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-9 rounded-3xl transition-all duration-300 mb-5 ${authLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/30'
              }`}
          >
            {authLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Login Link Section */}
      </div>
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-2xl w-full max-w-md text-center shadow-2xl border border-white/20 dark:border-white/10 hover:transform hover:-translate-y-2 transition-all duration-300 animate-[slideUp_0.6s_ease-out] p-6 border-t">
        <span className="text-gray-600 dark:text-gray-300 text-sm">
          Already have an account?
        </span>
        <Link href={"/"} className="text-blue-500 hover:text-blue-600 text-sm font-medium ml-1 hover:underline hover:scale-105 transition-all duration-300">
          Login
        </Link>
      </div>

    </div>
  );
}
