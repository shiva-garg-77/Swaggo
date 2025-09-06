"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../Helper/ThemeProvider';

export default function Login() {
  const { theme } = useTheme();
  const router = useRouter();
  const [AccessToken, setAccessToken] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

     const { username, password } = formData;
        let info;
        if (username.includes('@')) {
            info = { email: username, password }
        } else {
            info = { username, password }
        }

        const result = await fetch(`http://localhost:${process.env.NEXT_PUBLIC_PORT}/api/login`, {
            method: "POST",
            body: JSON.stringify(info),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            },

        })

        const callresult = await result.json()
        if (callresult.success) {
            document.cookie = `username=${username}; path=/; Secure`;
            formData.email = ''
            formData.password = ''
            setAccessToken(callresult.token)
            router.push(`/home`);
        }
        else {
            setError("Error", { message: callresult.msg })
        }
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

          <button
            type="submit"
            className=" bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-9 rounded-3xl hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-300 mb-5"
          >
            Login
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