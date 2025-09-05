"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../Helper/ThemeProvider';

export default function ForgetPass() {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    email: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // UI only - no backend logic
    console.log('Login form submitted (UI only):', formData);
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
          </div>

          <button
            type="submit"
            className=" bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-9 rounded-3xl hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-300 mb-5"
          >
            Send Mail
          </button>
        </form>

        <div className='h-[0.5px] w-full bg-cyan-900'></div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 mt-6 transition-colors duration-300">
          Remember your password?{' '}
          <Link href="/" className="text-blue-500 hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}