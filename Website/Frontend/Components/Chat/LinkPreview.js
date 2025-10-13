'use client';

import React, { useState, useEffect } from 'react';

const LinkPreview = ({ url, className = '' }) => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;

    const fetchLinkPreview = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would call your backend API
        // For now, we'll simulate the data
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch link preview');
        }
        const data = await response.json();
        setPreviewData(data);
      } catch (err) {
        setError(err.message);
        // Fallback to basic URL data
        setPreviewData({
          title: url,
          url: url,
          description: 'No preview available',
          image: null,
          siteName: new URL(url).hostname
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLinkPreview();
  }, [url]);

  if (loading) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 animate-pulse ${className}`}>
        <div className="flex space-x-3">
          <div className="bg-gray-200 dark:bg-gray-700 rounded w-16 h-16 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !previewData) {
    return null;
  }

  return (
    <a 
      href={previewData.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow ${className}`}
    >
      {previewData.image && (
        <div className="relative h-40">
          <img 
            src={previewData.image} 
            alt={previewData.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-3">
        {previewData.siteName && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">
            {previewData.siteName}
          </p>
        )}
        <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
          {previewData.title}
        </h4>
        {previewData.description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
            {previewData.description}
          </p>
        )}
        <p className="text-xs text-blue-600 dark:text-blue-400 truncate mt-2">
          {previewData.url}
        </p>
      </div>
    </a>
  );
};

export default LinkPreview;