'use client';

import React, { useState, useEffect } from 'react';
import cdnService from '../../services/CDNService';

const CDNConfiguration = () => {
  const [config, setConfig] = useState({
    enabled: cdnService.enabled,
    provider: process.env.NEXT_PUBLIC_CDN_PROVIDER || 'CUSTOM',
    customUrl: process.env.NEXT_PUBLIC_CUSTOM_CDN_URL || '',
    defaultQuality: 'MEDIUM',
    preloadEnabled: true
  });
  const [stats, setStats] = useState(cdnService.getStats());
  const [isSaving, setIsSaving] = useState(false);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cdnService.getStats());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // In a real implementation, this would save to backend or localStorage
      localStorage.setItem('cdn_config', JSON.stringify(config));
      
      // Show success message
      setTimeout(() => {
        setIsSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to save CDN configuration:', error);
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      // Simple test by optimizing a sample image
      const testUrl = 'https://example.com/test-image.jpg';
      const optimizedUrl = cdnService.optimizeImage(testUrl);
      
      // Try to fetch the optimized URL
      const response = await fetch(optimizedUrl, { method: 'HEAD' });
      
      if (response.ok) {
        alert('CDN connection successful!');
      } else {
        alert('CDN connection failed. Please check your configuration.');
      }
    } catch (error) {
      alert('CDN connection test failed: ' + error.message);
    }
  };

  const handleClearCache = () => {
    cdnService.clearCache();
    setStats(cdnService.getStats());
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">CDN Configuration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Enable CDN</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({...config, enabled: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CDN Provider
              </label>
              <select
                value={config.provider}
                onChange={(e) => setConfig({...config, provider: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="CUSTOM">Custom CDN</option>
                <option value="CLOUDFLARE">Cloudflare</option>
                <option value="AWS_CLOUDFRONT">AWS CloudFront</option>
                <option value="GOOGLE_CLOUD_CDN">Google Cloud CDN</option>
              </select>
            </div>
            
            {config.provider === 'CUSTOM' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Custom CDN URL
                </label>
                <input
                  type="text"
                  value={config.customUrl}
                  onChange={(e) => setConfig({...config, customUrl: e.target.value})}
                  placeholder="https://cdn.yourdomain.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Image Quality
              </label>
              <select
                value={config.defaultQuality}
                onChange={(e) => setConfig({...config, defaultQuality: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="LOW">Low (50%)</option>
                <option value="MEDIUM">Medium (75%)</option>
                <option value="HIGH">High (90%)</option>
                <option value="LOSSLESS">Lossless (100%)</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Preload Media</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.preloadEnabled}
                  onChange={(e) => setConfig({...config, preloadEnabled: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
            
            <button
              onClick={handleTestConnection}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition duration-200"
            >
              Test Connection
            </button>
          </div>
        </div>
        
        {/* Statistics Panel */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Statistics</h3>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Provider:</span>
              <span className="font-medium">{stats.provider}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`font-medium ${stats.enabled ? 'text-green-500' : 'text-red-500'}`}>
                {stats.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Requests:</span>
              <span className="font-medium">{stats.requests}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cache Hits:</span>
              <span className="font-medium">{stats.cacheHits}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cache Hit Rate:</span>
              <span className="font-medium">{stats.cacheHitRate}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Optimized Images:</span>
              <span className="font-medium">{stats.optimizedImages}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Bandwidth Saved:</span>
              <span className="font-medium">{stats.bandwidthSaved} KB</span>
            </div>
          </div>
          
          <button
            onClick={handleClearCache}
            className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition duration-200"
          >
            Clear Cache
          </button>
        </div>
      </div>
      
      {/* Information Panel */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">CDN Benefits</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
          <li>Faster media loading through global edge servers</li>
          <li>Automatic image optimization and compression</li>
          <li>Reduced bandwidth usage and costs</li>
          <li>Improved user experience with faster page loads</li>
          <li>Better SEO rankings due to improved performance</li>
        </ul>
      </div>
    </div>
  );
};

export default CDNConfiguration;