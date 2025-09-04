"use client";
import { useState, useEffect } from 'react';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  let theme;
  useEffect(() => {
    theme = document.documentElement.getAttribute('data-theme') || 'dark';
  }
    , []);
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');

//   useEffect(() => {
//     // Apply theme to document
//     if (isDarkMode) {
//       document.documentElement.classList.add('dark');
//     } else {
//       document.documentElement.classList.remove('dark');
//     }
//   }, [isDarkMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
 
  console.log("hii")
  const handleSubmit = (e) => {
    e.preventDefault();
    // UI only - no backend logic
    console.log('Login form submitted (UI only):', formData);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-5 gap-10 flex-wrap transition-all duration-300">
      
      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        className="fixed top-8 right-8 w-12 h-12 bg-white/10 dark:bg-white/10 backdrop-blur-md rounded-full border border-white/20 dark:border-white/20 flex items-center justify-center text-gray-800 dark:text-white hover:scale-110 transition-all duration-300 z-50 shadow-lg hover:shadow-xl"
        aria-label="Toggle theme"
      >
        {isDarkMode ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5" strokeWidth="2"/>
            <line x1="12" y1="1" x2="12" y2="3" strokeWidth="2"/>
            <line x1="12" y1="21" x2="12" y2="23" strokeWidth="2"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeWidth="2"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeWidth="2"/>
            <line x1="1" y1="12" x2="3" y2="12" strokeWidth="2"/>
            <line x1="21" y1="12" x2="23" y2="12" strokeWidth="2"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeWidth="2"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeWidth="2"/>
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeWidth="2"/>
          </svg>
        )}
      </button>

      {/* Login Card */}
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-10 w-full max-w-md text-center shadow-2xl border border-white/20 dark:border-white/10 hover:transform hover:-translate-y-2 transition-all duration-300 animate-[slideUp_0.6s_ease-out]">
        
        {/* Logo Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-red-500 tracking-wider mb-2 drop-shadow-lg">
            SWAGGO
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest font-medium">
            Fashion Forward
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-5 text-left">
            <label htmlFor="email" className="block text-gray-700 dark:text-gray-200 font-medium mb-2 text-sm transition-colors duration-300">
              Username or Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white dark:bg-white/10 border-2 border-gray-200 dark:border-white/20 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:border-red-500 focus:ring-0 focus:outline-none focus:bg-white dark:focus:bg-white/15 transition-all duration-300"
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
              className="w-full px-4 py-3 bg-white dark:bg-white/10 border-2 border-gray-200 dark:border-white/20 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:border-red-500 focus:ring-0 focus:outline-none focus:bg-white dark:focus:bg-white/15 transition-all duration-300"
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-4 rounded-xl hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-300 mb-5"
          >
            Login
          </button>

          <button 
            type="button" 
            className="text-red-500 hover:text-red-600 text-sm font-medium hover:underline hover:scale-105 transition-all duration-300 mb-5"
          >
            Forgot Password?
          </button>
        </form>

        {/* Sign Up Section */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
          <span className="text-gray-600 dark:text-gray-300 text-sm">
            Don't have an account? 
          </span>
          <button className="text-blue-500 hover:text-blue-600 text-sm font-medium ml-1 hover:underline hover:scale-105 transition-all duration-300">
            Sign up
          </button>
        </div>
      </div>

   
    </div>
  );
}