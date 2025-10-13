/**
 * CDN Service for Media Assets
 * Handles optimization, caching, and delivery of media assets through CDN
 */

import cacheService from './CacheService';
import authService from './AuthService';

/**
 * CDN Providers Configuration
 */
const CDN_PROVIDERS = {
  CLOUDFLARE: {
    name: 'Cloudflare',
    baseUrl: 'https://cdn.cloudflare.com',
    features: ['image_optimization', 'video_streaming', 'edge_caching']
  },
  AWS_CLOUDFRONT: {
    name: 'AWS CloudFront',
    baseUrl: 'https://cloudfront.net',
    features: ['image_optimization', 'video_streaming', 'edge_caching', 'detailed_analytics']
  },
  GOOGLE_CLOUD_CDN: {
    name: 'Google Cloud CDN',
    baseUrl: 'https://cdn.google.com',
    features: ['image_optimization', 'video_streaming', 'edge_caching']
  },
  CUSTOM: {
    name: 'Custom CDN',
    baseUrl: process.env.NEXT_PUBLIC_CUSTOM_CDN_URL || 'https://cdn.example.com',
    features: ['image_optimization', 'video_streaming', 'edge_caching']
  }
};

/**
 * Image Optimization Parameters
 */
const IMAGE_OPTIMIZATION_PARAMS = {
  QUALITY: {
    LOW: 'q=50',
    MEDIUM: 'q=75',
    HIGH: 'q=90',
    LOSSLESS: 'q=100'
  },
  FORMAT: {
    AUTO: 'f=auto',
    WEBP: 'f=webp',
    JPEG: 'f=jpg',
    PNG: 'f=png'
  },
  RESIZE: {
    SMALL: 'w=320',
    MEDIUM: 'w=640',
    LARGE: 'w=1024',
    XLARGE: 'w=1920'
  }
};

/**
 * CDN Service Class
 */
class CDNService {
  constructor() {
    // Configuration
    this.provider = this.getCDNProvider();
    this.enabled = this.isCDNEnabled();
    this.defaultQuality = 'MEDIUM';
    this.defaultFormat = 'AUTO';
    
    // Statistics
    this.stats = {
      requests: 0,
      cacheHits: 0,
      optimizedImages: 0,
      bandwidthSaved: 0
    };
    
    // Cache for optimized URLs
    this.urlCache = new Map();
    
    console.log(`🔄 CDN Service initialized with ${this.provider.name}`);
  }

  /**
   * Get configured CDN provider
   */
  getCDNProvider() {
    const providerName = process.env.NEXT_PUBLIC_CDN_PROVIDER || 'CUSTOM';
    return CDN_PROVIDERS[providerName] || CDN_PROVIDERS.CUSTOM;
  }

  /**
   * Check if CDN is enabled
   */
  isCDNEnabled() {
    return process.env.NEXT_PUBLIC_CDN_ENABLED === 'true' || false;
  }

  /**
   * Optimize image URL for CDN delivery
   */
  optimizeImage(imageUrl, options = {}) {
    // Return original URL if CDN is disabled
    if (!this.enabled || !imageUrl) {
      return imageUrl;
    }

    // Check cache first
    const cacheKey = `${imageUrl}-${JSON.stringify(options)}`;
    if (this.urlCache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.urlCache.get(cacheKey);
    }

    try {
      // Parse the original URL
      const url = new URL(imageUrl);
      
      // Skip optimization for data URLs
      if (url.protocol === 'data:') {
        return imageUrl;
      }
      
      // Generate optimized URL
      const optimizedUrl = this.generateOptimizedImageUrl(url, options);
      
      // Cache the result
      this.urlCache.set(cacheKey, optimizedUrl);
      this.stats.optimizedImages++;
      
      return optimizedUrl;
    } catch (error) {
      console.warn('Failed to optimize image URL:', error);
      return imageUrl;
    }
  }

  /**
   * Generate optimized image URL
   */
  generateOptimizedImageUrl(originalUrl, options = {}) {
    const {
      quality = this.defaultQuality,
      format = this.defaultFormat,
      width,
      height,
      resize = true
    } = options;

    // For Cloudflare-like CDNs that support URL-based parameters
    if (this.provider.name === 'Cloudflare' || this.provider.name === 'CUSTOM') {
      const params = new URLSearchParams();
      
      // Add format parameter
      if (format && format !== 'AUTO') {
        params.append('f', format.toLowerCase());
      } else if (format === 'AUTO') {
        params.append('f', 'auto');
      }
      
      // Add quality parameter
      if (quality && IMAGE_OPTIMIZATION_PARAMS.QUALITY[quality]) {
        params.append('q', quality === 'LOW' ? '50' : 
                     quality === 'MEDIUM' ? '75' : 
                     quality === 'HIGH' ? '90' : '100');
      }
      
      // Add resize parameters
      if (resize && width) {
        params.append('w', width);
      }
      
      if (resize && height) {
        params.append('h', height);
      }
      
      // Construct the optimized URL
      const baseUrl = `${this.provider.baseUrl}/cdn-cgi/image`;
      const optimizedUrl = new URL(baseUrl);
      
      // Add parameters
      for (const [key, value] of params) {
        optimizedUrl.searchParams.append(key, value);
      }
      
      // Add the original image URL as path
      optimizedUrl.pathname += `/${originalUrl.toString()}`;
      
      return optimizedUrl.toString();
    }
    
    // For other providers, return original URL
    return originalUrl.toString();
  }

  /**
   * Optimize video URL for streaming
   */
  optimizeVideo(videoUrl, options = {}) {
    // Return original URL if CDN is disabled
    if (!this.enabled || !videoUrl) {
      return videoUrl;
    }

    try {
      // Parse the original URL
      const url = new URL(videoUrl);
      
      // Skip optimization for data URLs
      if (url.protocol === 'data:') {
        return videoUrl;
      }
      
      // For video streaming, we might want to use adaptive bitrate streaming
      // This would typically be handled by the CDN provider's video service
      const optimizedUrl = this.generateOptimizedVideoUrl(url, options);
      
      return optimizedUrl;
    } catch (error) {
      console.warn('Failed to optimize video URL:', error);
      return videoUrl;
    }
  }

  /**
   * Generate optimized video URL
   */
  generateOptimizedVideoUrl(originalUrl, options = {}) {
    // For video, we might want to point to a streaming endpoint
    // This is a simplified implementation
    return originalUrl.toString();
  }

  /**
   * Preload media assets through CDN
   */
  async preloadMedia(mediaUrls) {
    if (!this.enabled || !Array.isArray(mediaUrls)) {
      return;
    }

    try {
      // Use link preload for images
      mediaUrls.forEach(url => {
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = this.optimizeImage(url);
          document.head.appendChild(link);
        }
      });
    } catch (error) {
      console.warn('Failed to preload media:', error);
    }
  }

  /**
   * Get CDN statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheHitRate: this.stats.requests > 0 ? 
        (this.stats.cacheHits / this.stats.requests * 100).toFixed(2) + '%' : '0%',
      provider: this.provider.name,
      enabled: this.enabled
    };
  }

  /**
   * Clear URL cache
   */
  clearCache() {
    this.urlCache.clear();
    console.log('🧹 CDN URL cache cleared');
  }

  /**
   * Warm up CDN cache with frequently accessed assets
   */
  async warmUpCache(assetUrls) {
    if (!this.enabled || !Array.isArray(assetUrls)) {
      return;
    }

    try {
      // Make HEAD requests to warm up cache
      const promises = assetUrls.map(url => 
        fetch(this.optimizeImage(url), { method: 'HEAD' })
      );
      
      await Promise.allSettled(promises);
      console.log(`🌡️ CDN cache warmed up with ${assetUrls.length} assets`);
    } catch (error) {
      console.warn('Failed to warm up CDN cache:', error);
    }
  }

  /**
   * Get optimized URL for user avatars
   */
  getAvatarUrl(avatarUrl, size = 'MEDIUM') {
    return this.optimizeImage(avatarUrl, {
      width: size === 'SMALL' ? 40 : size === 'MEDIUM' ? 80 : 120,
      height: size === 'SMALL' ? 40 : size === 'MEDIUM' ? 80 : 120,
      quality: 'HIGH',
      format: 'AUTO'
    });
  }

  /**
   * Get optimized URL for chat media
   */
  getChatMediaUrl(mediaUrl, options = {}) {
    const { type = 'image', quality = 'MEDIUM', maxWidth = 1024 } = options;
    
    if (type === 'image') {
      return this.optimizeImage(mediaUrl, {
        width: maxWidth,
        quality: quality,
        format: 'AUTO'
      });
    } else if (type === 'video') {
      return this.optimizeVideo(mediaUrl, {
        quality: quality
      });
    }
    
    return mediaUrl;
  }
}

// Create singleton instance
const cdnService = new CDNService();

export default cdnService;