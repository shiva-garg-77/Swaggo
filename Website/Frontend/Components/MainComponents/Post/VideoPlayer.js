"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../Helper/ThemeProvider';
import { safeVideoPlay, safeVideoPause, toggleVideoPlayPause } from '../../../lib/videoUtils';

export default function VideoPlayer({ 
  src, 
  poster = null,
  autoPlay = true, 
  loop = true, 
  muted = true,
  controls = false,
  className = "",
  onPlay = null,
  onPause = null,
  onError = null,
  onLoadStart = null,
  onClick = null,
  preload = "metadata",
  playsInline = true,
  style = {},
  isModal = false,
  showPlayButton = true
}) {
  const { theme } = useTheme();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showControls, setShowControls] = useState(controls);

  // Intersection Observer for lazy loading and autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlay) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
        
        if (entry.isIntersecting) {
          // Auto play when video comes into view
          safeVideoPlay(
            video,
            () => {
              setIsPlaying(true);
              onPlay?.();
            },
            (error) => {
              console.log('Autoplay prevented:', error.message);
              setIsPlaying(false);
            }
          );
        } else if (!isModal) {
          // Pause when video goes out of view (except in modal)
          safeVideoPause(video, () => {
            setIsPlaying(false);
            onPause?.();
          });
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [autoPlay, isModal]); // Removed onPlay, onPause to prevent loops

  // Handle video events
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setIsLoading(false);
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPause?.();
  }, [onPause]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
    const video = videoRef.current;
    if (video && autoPlay && isVisible) {
      setTimeout(() => {
        safeVideoPlay(video, null, () => {
          setIsPlaying(false);
        });
      }, 100); // Small delay to ensure proper loading
    }
  }, [autoPlay, isVisible]);

  const handleError = useCallback((e) => {
    console.error('Video error for:', src, e);
    
    // Try alternative URLs for localhost videos
    if (src && src.includes('localhost')) {
      const alternatives = [
        src.replace('localhost:45799', 'localhost:3001'),
        src.replace('localhost:3001', 'localhost:45799'),
        src.replace(':45799', ':3001'),
        src.replace(':3001', ':45799')
      ];
      
      const currentSrc = e.target.src;
      const nextUrl = alternatives.find(url => url !== currentSrc && url !== src);
      
      if (nextUrl && !e.target.dataset.retried) {
        console.log('Trying alternative video URL:', nextUrl);
        e.target.dataset.retried = 'true';
        e.target.src = nextUrl;
        return;
      }
    }
    
    setHasError(true);
    setIsLoading(false);
    onError?.(e);
  }, [src, onError]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    toggleVideoPlayPause(
      video,
      isPlaying,
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    );
  }, [isPlaying]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const newMutedState = !isMuted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
  }, [isMuted]);

  // Handle click - either custom handler or play/pause
  const handleClick = useCallback((e) => {
    if (onClick) {
      onClick(e);
    } else if (!controls) {
      e.preventDefault();
      e.stopPropagation();
      togglePlayPause();
    }
  }, [onClick, controls, togglePlayPause]);

  if (hasError) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 ${className}`}
        style={style}
      >
        <div className="text-center p-6">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
          </svg>
          <p className="text-lg font-medium mb-1">Video Unavailable</p>
          <p className="text-sm opacity-70">Unable to load video content</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative group ${className}`} 
      style={style}
      onClick={handleClick}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={false} // Controlled by intersection observer
        loop={loop}
        muted={isMuted}
        playsInline={playsInline}
        preload={preload}
        controls={showControls}
        className="w-full h-full object-cover"
        onPlay={handlePlay}
        onPause={handlePause}
        onLoadStart={handleLoadStart}
        onLoadedData={handleLoadedData}
        onError={handleError}
        onCanPlay={() => setIsLoading(false)}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Play button overlay */}
      {!isPlaying && !isLoading && showPlayButton && !controls && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button 
            className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-4 transition-all duration-200 hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
          >
            <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Control overlays for modal view */}
      {isModal && (
        <>
          {/* Mute/Unmute button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className={`absolute bottom-4 right-4 p-2 rounded-full transition-all duration-200 ${ 
              theme === 'dark' 
                ? 'bg-gray-900 bg-opacity-80 text-white hover:bg-opacity-90' 
                : 'bg-white bg-opacity-80 text-gray-900 hover:bg-opacity-90'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>

          {/* Video indicator */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-60 backdrop-blur-sm rounded-full p-2">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
