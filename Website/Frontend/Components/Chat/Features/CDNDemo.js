'use client';

import React, { useState, useEffect } from 'react';
import useCDN from '../../hooks/useCDN';
import CDNConfiguration from './CDNConfiguration';

const CDNDemo = () => {
  const {
    stats,
    isEnabled,
    optimizeImage,
    optimizeVideo,
    getAvatarUrl,
    getChatMediaUrl,
    warmUpCache,
    clearCache
  } = useCDN();

  const [demoImages, setDemoImages] = useState([
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1494790108755-2616b612b742?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80'
  ]);

  const [optimizedImages, setOptimizedImages] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [chatMediaUrl, setChatMediaUrl] = useState('');

  // Optimize images on component mount
  useEffect(() => {
    const optimized = demoImages.map(url => optimizeImage(url, { width: 300, quality: 'HIGH' }));
    setOptimizedImages(optimized);
  }, [demoImages, optimizeImage]);

  const handleOptimizeCustomImage = () => {
    const customUrl = prompt('Enter image URL to optimize:');
    if (customUrl) {
      const optimized = optimizeImage(customUrl, { width: 400, quality: 'MEDIUM' });
      setOptimizedImages(prev => [...prev, optimized]);
    }
  };

  const handleWarmUpCache = async () => {
    await warmUpCache(demoImages);
    alert('CDN cache warmed up successfully!');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">CDN Integration Demo</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Demonstration of CDN-powered media optimization and delivery
        </p>

        {/* CDN Configuration */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Configuration</h2>
          <CDNConfiguration />
        </div>

        {/* Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Real-time Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{stats.requests}</div>
              <div className="text-sm text-blue-800 dark:text-blue-200">Requests</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-300">{stats.cacheHitRate}</div>
              <div className="text-sm text-green-800 dark:text-green-200">Cache Hit Rate</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">{stats.optimizedImages}</div>
              <div className="text-sm text-purple-800 dark:text-purple-200">Optimized Images</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">{stats.bandwidthSaved}KB</div>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">Bandwidth Saved</div>
            </div>
          </div>
        </div>

        {/* Image Optimization Demo */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Image Optimization</h2>
            <button
              onClick={handleOptimizeCustomImage}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200"
            >
              Optimize Custom Image
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {demoImages.map((originalUrl, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Original</h3>
                <img 
                  src={originalUrl} 
                  alt="Original" 
                  className="w-full h-48 object-cover rounded-md mb-2"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{originalUrl}</p>
              </div>
            ))}
            
            {optimizedImages.map((optimizedUrl, index) => (
              <div key={`optimized-${index}`} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Optimized</h3>
                <img 
                  src={optimizedUrl} 
                  alt="Optimized" 
                  className="w-full h-48 object-cover rounded-md mb-2"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{optimizedUrl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Avatar Optimization Demo */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Avatar Optimization</h2>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Small (40x40)</h3>
              <img 
                src={getAvatarUrl(demoImages[0], 'SMALL')} 
                alt="Small Avatar" 
                className="w-10 h-10 rounded-full mx-auto"
              />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Medium (80x80)</h3>
              <img 
                src={getAvatarUrl(demoImages[0], 'MEDIUM')} 
                alt="Medium Avatar" 
                className="w-20 h-20 rounded-full mx-auto"
              />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Large (120x120)</h3>
              <img 
                src={getAvatarUrl(demoImages[0], 'LARGE')} 
                alt="Large Avatar" 
                className="w-30 h-30 rounded-full mx-auto"
              />
            </div>
          </div>
        </div>

        {/* Chat Media Demo */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Chat Media Optimization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Image Media</h3>
              <img 
                src={getChatMediaUrl(demoImages[1], { type: 'image', maxWidth: 400 })} 
                alt="Chat Media" 
                className="w-full h-64 object-cover rounded-md"
              />
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Video Media</h3>
              <div className="w-full h-64 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-gray-300 dark:bg-gray-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-8 h-8 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">Video optimized for streaming</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleWarmUpCache}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition duration-200"
          >
            Warm Up Cache
          </button>
          <button
            onClick={clearCache}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition duration-200"
          >
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  );
};

export default CDNDemo;