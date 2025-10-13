'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial check
    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleRetry = () => {
    // Try to reload the page
    window.location.reload();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <WifiOff className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          You're Offline
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          It seems you've lost your internet connection. Please check your network settings and try again.
        </p>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">What you can do:</h2>
          <ul className="text-left text-gray-600 dark:text-gray-400 space-y-2 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Check your Wi-Fi or mobile data connection</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Restart your router or modem</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Try switching between Wi-Fi and mobile data</span>
            </li>
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRetry}
            disabled={isOnline}
            className={`flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${
              isOnline
                ? 'bg-green-600 hover:bg-green-700 text-white cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${!isOnline ? 'animate-spin' : ''}`} />
            {isOnline ? 'Connected' : 'Retry Connection'}
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Home
          </button>
        </div>
        
        {isOnline && (
          <div className="mt-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
            <p className="text-green-800 dark:text-green-200 text-sm">
              <span className="font-medium">You're back online!</span> You can now continue using the app.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}