import axios from 'axios';
import * as cheerio from 'cheerio';

// Enhanced media type detection
const MEDIA_TYPES = {
  YOUTUBE: 'youtube',
  VIMEO: 'vimeo',
  TWITTER: 'twitter',
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  SOUNDCLOUD: 'soundcloud',
  SPOTIFY: 'spotify',
  VIDEO: 'video',
  AUDIO: 'audio',
  IMAGE: 'image',
  DOCUMENT: 'document',
  ARCHIVE: 'archive',
  CODE: 'code',
  GENERIC: 'generic'
};

class LinkPreviewService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 1000 * 60 * 60; // 1 hour
  }

  /**
   * Extract metadata from a URL for link preview
   * @param {string} url - The URL to extract metadata from
   * @returns {Promise<Object>} Preview data object
   */
  async extractLinkPreview(url) {
    // Check cache first
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // Determine media type for special handling
      const mediaType = this.detectMediaType(url);
      
      // Special handling for known media types
      if (mediaType !== MEDIA_TYPES.GENERIC) {
        const specialPreview = await this.extractSpecialMediaPreview(url, mediaType);
        if (specialPreview) {
          // Cache the result
          this.cache.set(url, {
            data: specialPreview,
            timestamp: Date.now()
          });
          return specialPreview;
        }
      }

      // Fetch the HTML content for generic URLs
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract metadata
      const previewData = {
        url: url,
        title: this.extractTitle($),
        description: this.extractDescription($),
        image: this.extractImage($, url),
        siteName: this.extractSiteName($),
        mediaType: mediaType,
        favicon: this.extractFavicon($, url),
        author: this.extractAuthor($),
        publishedTime: this.extractPublishedTime($),
        keywords: this.extractKeywords($)
      };

      // Cache the result
      this.cache.set(url, {
        data: previewData,
        timestamp: Date.now()
      });

      return previewData;
    } catch (error) {
      console.error('Error extracting link preview:', error.message);
      // Return fallback data
      return {
        url: url,
        title: url,
        description: 'No preview available',
        image: null,
        siteName: new URL(url).hostname,
        mediaType: MEDIA_TYPES.GENERIC
      };
    }
  }

  /**
   * Detect media type from URL
   * @param {string} url - The URL to analyze
   * @returns {string} Media type
   */
  detectMediaType(url) {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;

    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return MEDIA_TYPES.YOUTUBE;
    }

    // Vimeo
    if (hostname.includes('vimeo.com')) {
      return MEDIA_TYPES.VIMEO;
    }

    // Twitter
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return MEDIA_TYPES.TWITTER;
    }

    // Instagram
    if (hostname.includes('instagram.com')) {
      return MEDIA_TYPES.INSTAGRAM;
    }

    // Facebook
    if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
      return MEDIA_TYPES.FACEBOOK;
    }

    // SoundCloud
    if (hostname.includes('soundcloud.com')) {
      return MEDIA_TYPES.SOUNDCLOUD;
    }

    // Spotify
    if (hostname.includes('spotify.com')) {
      return MEDIA_TYPES.SPOTIFY;
    }

    // Check file extensions
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv'];
    const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const documentExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
    const archiveExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz'];
    const codeExtensions = ['.js', '.ts', '.html', '.css', '.py', '.java', '.cpp', '.c'];

    for (const ext of videoExtensions) {
      if (pathname.toLowerCase().endsWith(ext)) return MEDIA_TYPES.VIDEO;
    }
    for (const ext of audioExtensions) {
      if (pathname.toLowerCase().endsWith(ext)) return MEDIA_TYPES.AUDIO;
    }
    for (const ext of imageExtensions) {
      if (pathname.toLowerCase().endsWith(ext)) return MEDIA_TYPES.IMAGE;
    }
    for (const ext of documentExtensions) {
      if (pathname.toLowerCase().endsWith(ext)) return MEDIA_TYPES.DOCUMENT;
    }
    for (const ext of archiveExtensions) {
      if (pathname.toLowerCase().endsWith(ext)) return MEDIA_TYPES.ARCHIVE;
    }
    for (const ext of codeExtensions) {
      if (pathname.toLowerCase().endsWith(ext)) return MEDIA_TYPES.CODE;
    }

    return MEDIA_TYPES.GENERIC;
  }

  /**
   * Extract special media preview for known platforms
   * @param {string} url - The URL to extract from
   * @param {string} mediaType - The detected media type
   * @returns {Promise<Object|null>} Preview data or null
   */
  async extractSpecialMediaPreview(url, mediaType) {
    try {
      switch (mediaType) {
        case MEDIA_TYPES.YOUTUBE:
          return this.extractYouTubePreview(url);
        case MEDIA_TYPES.VIMEO:
          return this.extractVimeoPreview(url);
        case MEDIA_TYPES.TWITTER:
          return this.extractTwitterPreview(url);
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error extracting ${mediaType} preview:`, error.message);
      return null;
    }
  }

  /**
   * Extract YouTube preview
   * @param {string} url - YouTube URL
   * @returns {Object} Preview data
   */
  extractYouTubePreview(url) {
    const urlObj = new URL(url);
    let videoId = '';
    
    if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.substring(1);
    } else {
      videoId = urlObj.searchParams.get('v') || '';
    }
    
    if (!videoId) return null;
    
    return {
      url: url,
      title: 'YouTube Video',
      description: 'Watch on YouTube',
      image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      siteName: 'YouTube',
      mediaType: MEDIA_TYPES.YOUTUBE,
      videoId: videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`
    };
  }

  /**
   * Extract Vimeo preview
   * @param {string} url - Vimeo URL
   * @returns {Object} Preview data
   */
  async extractVimeoPreview(url) {
    // For Vimeo, we would typically use their API, but for simplicity we'll return basic data
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (!match) return null;
    
    const videoId = match[1];
    
    return {
      url: url,
      title: 'Vimeo Video',
      description: 'Watch on Vimeo',
      image: `https://vumbnail.com/${videoId}.jpg`,
      siteName: 'Vimeo',
      mediaType: MEDIA_TYPES.VIMEO,
      videoId: videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}`
    };
  }

  /**
   * Extract title from HTML
   * @param {Object} $ - Cheerio instance
   * @returns {string} Title
   */
  extractTitle($) {
    return $('meta[property="og:title"]').attr('content') ||
           $('meta[name="twitter:title"]').attr('content') ||
           $('title').text() ||
           '';
  }

  /**
   * Extract description from HTML
   * @param {Object} $ - Cheerio instance
   * @returns {string} Description
   */
  extractDescription($) {
    return $('meta[property="og:description"]').attr('content') ||
           $('meta[name="twitter:description"]').attr('content') ||
           $('meta[name="description"]').attr('content') ||
           '';
  }

  /**
   * Extract image from HTML
   * @param {Object} $ - Cheerio instance
   * @param {string} baseUrl - Base URL for resolving relative URLs
   * @returns {string} Image URL
   */
  extractImage($, baseUrl) {
    const imageUrl = $('meta[property="og:image"]').attr('content') ||
                     $('meta[name="twitter:image"]').attr('content') ||
                     $('link[rel="image_src"]').attr('href') ||
                     '';

    if (imageUrl) {
      try {
        // Resolve relative URLs
        return new URL(imageUrl, baseUrl).href;
      } catch (error) {
        return imageUrl;
      }
    }

    return '';
  }

  /**
   * Extract favicon from HTML
   * @param {Object} $ - Cheerio instance
   * @param {string} baseUrl - Base URL for resolving relative URLs
   * @returns {string} Favicon URL
   */
  extractFavicon($, baseUrl) {
    const faviconUrl = $('link[rel="icon"]').attr('href') ||
                      $('link[rel="shortcut icon"]').attr('href') ||
                      '/favicon.ico';

    try {
      return new URL(faviconUrl, baseUrl).href;
    } catch (error) {
      return faviconUrl;
    }
  }

  /**
   * Extract site name from HTML
   * @param {Object} $ - Cheerio instance
   * @returns {string} Site name
   */
  extractSiteName($) {
    return $('meta[property="og:site_name"]').attr('content') ||
           $('meta[name="application-name"]').attr('content') ||
           $('meta[name="author"]').attr('content') ||
           '';
  }

  /**
   * Extract author from HTML
   * @param {Object} $ - Cheerio instance
   * @returns {string} Author
   */
  extractAuthor($) {
    return $('meta[property="article:author"]').attr('content') ||
           $('meta[name="author"]').attr('content') ||
           '';
  }

  /**
   * Extract published time from HTML
   * @param {Object} $ - Cheerio instance
   * @returns {string} Published time
   */
  extractPublishedTime($) {
    return $('meta[property="article:published_time"]').attr('content') ||
           $('meta[name="date"]').attr('content') ||
           '';
  }

  /**
   * Extract keywords from HTML
   * @param {Object} $ - Cheerio instance
   * @returns {Array} Keywords
   */
  extractKeywords($) {
    const keywords = $('meta[name="keywords"]').attr('content');
    return keywords ? keywords.split(',').map(k => k.trim()) : [];
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   * @returns {number} Cache size
   */
  getCacheSize() {
    return this.cache.size;
  }
}

export default new LinkPreviewService();
export { MEDIA_TYPES };