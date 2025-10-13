'use client';

import React, { useState, useEffect, useCallback } from 'react';
import cdnService from '../../services/CDNService';

export default function Lightbox({ media, onClose, onNavigate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        navigatePrevious();
      } else if (e.key === 'ArrowRight') {
        navigateNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const navigatePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const navigateNext = () => {
    if (currentIndex < media.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentMedia = media[currentIndex];

  const getFileTypeIcon = (filename) => {
    if (filename?.endsWith('.pdf')) {
      return (
        <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (filename?.match(/\.(doc|docx)$/i)) {
      return (
        <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      );
    }
  };

  const renderMedia = () => {
    if (!currentMedia) return null;

    if (currentMedia.type === 'image') {
      // Optimize image URL through CDN
      const optimizedUrl = cdnService.optimizeImage(currentMedia.url, {
        width: 1920, // Max width for lightbox
        quality: 'HIGH',
        format: 'AUTO'
      });
      
      return (
        <img
          src={optimizedUrl}
          alt={currentMedia.filename || 'Image'}
          className="max-h-[80vh] max-w-full object-contain"
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      );
    } else if (currentMedia.type === 'video') {
      // Optimize video URL through CDN
      const optimizedUrl = cdnService.optimizeVideo(currentMedia.url);
      
      return (
        <video
          src={optimizedUrl}
          controls
          className="max-h-[80vh] max-w-full"
          onLoadStart={() => setIsLoading(true)}
          onLoadedData={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      );
    } else {
      // For other media types, return icon representation
      return (
        <div className="flex flex-col items-center justify-center h-64">
          {getFileTypeIcon(currentMedia.filename)}
          <p className="mt-4 text-white text-lg">{currentMedia.filename}</p>
          <a 
            href={currentMedia.url} 
            download 
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Download File
          </a>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        aria-label="Close lightbox"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation arrows */}
      {media.length > 1 && (
        <>
          <button
            onClick={navigatePrevious}
            disabled={currentIndex === 0}
            className={`absolute left-4 text-white p-2 rounded-full ${
              currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'
            }`}
            aria-label="Previous media"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={navigateNext}
            disabled={currentIndex === media.length - 1}
            className={`absolute right-4 text-white p-2 rounded-full ${
              currentIndex === media.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'
            }`}
            aria-label="Next media"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Media counter */}
      {media.length > 1 && (
        <div className="absolute top-4 left-4 text-white text-sm">
          {currentIndex + 1} of {media.length}
        </div>
      )}

      {/* Media content */}
      <div className="relative max-w-6xl max-h-[90vh] flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        {renderMedia()}
      </div>
    </div>
  );
}