import { useState, useEffect, useCallback } from 'react';
import cdnService from '../services/CDNService';

/**
 * React hook for CDN functionality
 * Provides optimized media URLs and CDN statistics
 */
export const useCDN = () => {
  const [stats, setStats] = useState(cdnService.getStats());
  const [isEnabled, setIsEnabled] = useState(cdnService.enabled);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cdnService.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Optimize image URL
   */
  const optimizeImage = useCallback((imageUrl, options = {}) => {
    return cdnService.optimizeImage(imageUrl, options);
  }, []);

  /**
   * Optimize video URL
   */
  const optimizeVideo = useCallback((videoUrl, options = {}) => {
    return cdnService.optimizeVideo(videoUrl, options);
  }, []);

  /**
   * Preload media assets
   */
  const preloadMedia = useCallback(async (mediaUrls) => {
    return await cdnService.preloadMedia(mediaUrls);
  }, []);

  /**
   * Get avatar URL
   */
  const getAvatarUrl = useCallback((avatarUrl, size = 'MEDIUM') => {
    return cdnService.getAvatarUrl(avatarUrl, size);
  }, []);

  /**
   * Get chat media URL
   */
  const getChatMediaUrl = useCallback((mediaUrl, options = {}) => {
    return cdnService.getChatMediaUrl(mediaUrl, options);
  }, []);

  /**
   * Warm up CDN cache
   */
  const warmUpCache = useCallback(async (assetUrls) => {
    return await cdnService.warmUpCache(assetUrls);
  }, []);

  /**
   * Clear CDN cache
   */
  const clearCache = useCallback(() => {
    cdnService.clearCache();
    setStats(cdnService.getStats());
  }, []);

  return {
    // State
    stats,
    isEnabled,
    
    // Methods
    optimizeImage,
    optimizeVideo,
    preloadMedia,
    getAvatarUrl,
    getChatMediaUrl,
    warmUpCache,
    clearCache
  };
};

export default useCDN;