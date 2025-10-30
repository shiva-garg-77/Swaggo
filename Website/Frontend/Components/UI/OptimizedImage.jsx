/**
 * Optimized Image Component
 * Fixes ALL image/media issues (Category 19)
 * 
 * ✅ Issue 19.1: Lazy loading
 * ✅ Issue 19.2: Placeholders (blur)
 * ✅ Issue 19.3: Error handling
 * ✅ Issue 19.4: Optimization
 * ✅ Issue 19.5: WebP support
 * ✅ Issue 19.6: Responsive sizes
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { ImageOff } from 'lucide-react';

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  objectFit = 'cover',
  priority = false,
  onLoad,
  onError,
  fallbackSrc = '/placeholder-image.png',
  showLoader = true,
  theme = 'light'
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);
  const isDark = theme === 'dark';

  // Intersection Observer for lazy loading (Issue 19.1)
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px'
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // Generate WebP source if supported (Issue 19.5)
  const getWebPSource = (originalSrc) => {
    if (!originalSrc || originalSrc.endsWith('.svg')) return null;
    
    // Check if browser supports WebP
    const supportsWebP = document.createElement('canvas')
      .toDataURL('image/webp')
      .indexOf('data:image/webp') === 0;
    
    if (!supportsWebP) return null;
    
    // Convert to WebP URL (assuming server supports it)
    return originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  };

  // Generate responsive srcset (Issue 19.6)
  const generateSrcSet = (baseSrc) => {
    if (!baseSrc || baseSrc.startsWith('data:')) return '';
    
    const sizes = [320, 640, 768, 1024, 1280, 1536];
    return sizes
      .map(size => `${baseSrc}?w=${size} ${size}w`)
      .join(', ');
  };

  const handleLoad = (e) => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setIsLoading(false);
    setHasError(true);
    
    // Try fallback
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
    
    onError?.(e);
  };

  // Blur placeholder data URL (Issue 19.2)
  const blurDataURL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg==';

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Loading State (Issue 19.2) */}
      {isLoading && showLoader && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-gray-200'
          }`}
        >
          <div className="animate-pulse">
            <div className={`w-12 h-12 rounded-full ${
              isDark ? 'bg-gray-700' : 'bg-gray-300'
            }`} />
          </div>
        </div>
      )}

      {/* Error State (Issue 19.3) */}
      {hasError && currentSrc === fallbackSrc && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-gray-200'
          }`}
        >
          <ImageOff className={`w-12 h-12 mb-2 ${
            isDark ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <p className={`text-sm ${
            isDark ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Image unavailable
          </p>
        </div>
      )}

      {/* Actual Image */}
      {isInView && (
        <picture>
          {/* WebP source (Issue 19.5) */}
          {getWebPSource(currentSrc) && (
            <source
              type="image/webp"
              srcSet={generateSrcSet(getWebPSource(currentSrc))}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          )}
          
          {/* Original format */}
          <img
            src={currentSrc}
            alt={alt}
            srcSet={generateSrcSet(currentSrc)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={`w-full h-full transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            style={{
              objectFit,
              backgroundImage: `url(${blurDataURL})`,
              backgroundSize: 'cover'
            }}
          />
        </picture>
      )}
    </div>
  );
}

/**
 * Optimized Video Component
 * Fixes video issues (Issues 19.7-19.10)
 */
export function OptimizedVideo({
  src,
  poster,
  autoPlay = false,
  muted = true,
  loop = false,
  controls = true,
  className = '',
  onLoad,
  onError,
  theme = 'light'
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const videoRef = useRef(null);
  const isDark = theme === 'dark';

  // Lazy load video (Issue 19.7)
  useEffect(() => {
    if (!videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px'
      }
    );

    observer.observe(videoRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLoadedData = (e) => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(e);
  };

  return (
    <div ref={videoRef} className={`relative ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-gray-200'
          }`}
        >
          <div className="animate-pulse">
            <div className={`w-12 h-12 rounded-full ${
              isDark ? 'bg-gray-700' : 'bg-gray-300'
            }`} />
          </div>
        </div>
      )}

      {/* Error State (Issue 19.9) */}
      {hasError && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-gray-200'
          }`}
        >
          <ImageOff className={`w-12 h-12 mb-2 ${
            isDark ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <p className={`text-sm ${
            isDark ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Video unavailable
          </p>
        </div>
      )}

      {/* Video Element */}
      {isInView && (
        <video
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          controls={controls}
          playsInline
          preload="metadata"
          onLoadedData={handleLoadedData}
          onError={handleError}
          className="w-full h-full"
        />
      )}
    </div>
  );
}
