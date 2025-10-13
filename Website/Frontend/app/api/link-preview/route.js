import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Enhanced Link Preview API Route
 * 
 * Fetches comprehensive metadata for URLs including:
 * - OpenGraph and Twitter Card data
 * - Media type detection (YouTube, Vimeo, etc.)
 * - Embed URLs for supported platforms
 * - Article metadata (author, publish date, etc.)
 * - Keywords extraction
 * 
 * GET /api/link-preview?url=https://example.com&detailed=true
 */

// Media type detection patterns
const MEDIA_PATTERNS = {
  youtube: /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i,
  vimeo: /(?:vimeo\.com\/)([0-9]+)/i,
  twitter: /(?:twitter\.com|x\.com)\/\w+\/status\/([0-9]+)/i,
  instagram: /(?:instagram\.com\/p\/)([a-zA-Z0-9_-]+)/i,
  tiktok: /(?:tiktok\.com\/@[^/]+\/video\/)([0-9]+)/i,
  spotify: /(?:open\.spotify\.com\/)(?:track|album|playlist|artist)\/([a-zA-Z0-9]+)/i,
  soundcloud: /(?:soundcloud\.com\/)([^\s]+)/i,
  github: /(?:github\.com\/)([^\s\/]+\/[^\s\/]+)/i,
  image: /\.(jpg|jpeg|png|gif|webp|svg)(?:\?|$)/i,
  video: /\.(mp4|webm|ogg|mov|avi|mkv)(?:\?|$)/i,
  audio: /\.(mp3|wav|ogg|aac|flac)(?:\?|$)/i,
  pdf: /\.pdf(?:\?|$)/i
};

// Simple in-memory cache
let previewCache = new Map();
const CACHE_TTL = 3600000; // 1 hour
function detectMediaType(url) {
  for (const [type, pattern] of Object.entries(MEDIA_PATTERNS)) {
    const match = url.match(pattern);
    if (match) {
      return { type, match };
    }
  }
  return { type: 'generic', match: null };
}

function generateEmbedUrl(mediaType, match, url) {
  switch (mediaType) {
    case 'youtube':
      return `https://www.youtube.com/embed/${match[1]}?rel=0`;
    case 'vimeo':
      return `https://player.vimeo.com/video/${match[1]}`;
    case 'spotify':
      const spotifyPath = url.split('/').slice(-2).join('/');
      return `https://open.spotify.com/embed/${spotifyPath}`;
    default:
      return null;
  }
}

function extractKeywords(text, $) {
  const keywords = [];
  
  // Meta keywords
  const metaKeywords = $('meta[name="keywords"]').attr('content');
  if (metaKeywords) {
    keywords.push(...metaKeywords.split(',').map(k => k.trim()));
  }
  
  // Extract from text content
  if (text) {
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordFreq = {};
    words.forEach(word => {
      if (word.length > 3 && !['this', 'that', 'with', 'from', 'they', 'been', 'have', 'will', 'your', 'what', 'when', 'where'].includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    const sortedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);
    keywords.push(...sortedWords);
  }
  
  return [...new Set(keywords)].slice(0, 10);
}

function getArticleMetadata($) {
  return {
    author: $('meta[name="author"]').attr('content') ||
            $('meta[property="og:author"]').attr('content') ||
            $('.author').text().trim() || null,
    publishedTime: $('meta[property="og:published_time"]').attr('content') ||
                   $('meta[name="date"]').attr('content') ||
                   $('time[datetime]').attr('datetime') || null,
    modifiedTime: $('meta[property="og:modified_time"]').attr('content') ||
                  $('meta[name="last-modified"]').attr('content') || null,
    section: $('meta[property="og:section"]').attr('content') ||
             $('meta[name="section"]').attr('content') || null
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const detailed = searchParams.get('detailed') === 'true';

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `${url}_${detailed}`;
    if (previewCache.has(cacheKey)) {
      const cached = previewCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data);
      }
      previewCache.delete(cacheKey);
    }

    // Detect media type
    const { type: mediaType, match } = detectMediaType(url);

    // For direct media files, return minimal preview
    if (['image', 'video', 'audio', 'pdf'].includes(mediaType)) {
      const preview = {
        url,
        title: url.split('/').pop().split('.')[0],
        description: `${mediaType.toUpperCase()} file`,
        image: mediaType === 'image' ? url : null,
        siteName: extractDomain(url),
        mediaType,
        type: mediaType
      };
      previewCache.set(cacheKey, { data: preview, timestamp: Date.now() });
      return NextResponse.json(preview);
    }

    // Fetch the webpage
    const response = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
      maxContentLength: 5 * 1024 * 1024, // 5MB limit
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SwaggoBot/1.0; +https://swaggo.app/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract comprehensive metadata
    const title = extractMetadata($, [
      'og:title',
      'twitter:title',
      'title'
    ]) || $('h1').first().text().trim() || extractDomain(url);

    const description = extractMetadata($, [
      'og:description',
      'twitter:description',
      'description'
    ]) || $('p').first().text().trim().substring(0, 200);

    const image = extractMetadata($, [
      'og:image',
      'og:image:url',
      'twitter:image',
      'twitter:image:src',
      'twitter:image'
    ]);

    const siteName = extractMetadata($, [
      'og:site_name',
      'application-name'
    ]) || extractDomain(url);

    let preview = {
      url,
      title: title.substring(0, 100), // Limit length
      description: description.substring(0, 300), // Limit length
      image: makeAbsoluteUrl(image, url),
      siteName,
      type: extractMetadata($, ['og:type']) || 'website',
      mediaType,
      favicon: extractFavicon($, url)
    };

    // Add enhanced data for detailed requests
    if (detailed) {
      const embedUrl = generateEmbedUrl(mediaType, match, url);
      const keywords = extractKeywords(description + ' ' + title, $);
      const articleData = getArticleMetadata($);
      
      preview = {
        ...preview,
        embedUrl,
        keywords,
        ...articleData,
        locale: $('html').attr('lang') || 'en',
        canonicalUrl: $('link[rel="canonical"]').attr('href') || url,
        wordCount: $('article').length ? $('article').text().split(/\s+/).length : null
      };
    }

    // Cache the result
    previewCache.set(cacheKey, { data: preview, timestamp: Date.now() });

    return NextResponse.json(preview, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
      }
    });

  } catch (error) {
    console.error('Error fetching link preview:', error.message);

    // Return fallback preview instead of error
    const fallbackPreview = {
      url,
      title: extractDomain(url),
      description: url,
      image: null,
      siteName: extractDomain(url),
      type: 'website',
      mediaType: detectMediaType(url).type,
      error: error.message
    };
    
    return NextResponse.json(fallbackPreview, { status: 200 });
  }
}

/**
 * Make relative URLs absolute
 */
function makeAbsoluteUrl(relativeUrl, baseUrl) {
  if (!relativeUrl) return null;
  
  try {
    if (relativeUrl.startsWith('http')) {
      return relativeUrl;
    }
    const urlObj = new URL(baseUrl);
    return new URL(relativeUrl, urlObj.origin).href;
  } catch {
    return null;
  }
}

/**
 * Helper function to extract metadata from various meta tags
 */
function extractMetadata($, selectors) {
  for (const selector of selectors) {
    // Try OpenGraph/Twitter meta tags
    let content = $(`meta[property="${selector}"]`).attr('content');
    if (content) return content;

    content = $(`meta[name="${selector}"]`).attr('content');
    if (content) return content;
  }
  return null;
}

/**
 * Extract favicon URL
 */
function extractFavicon($, baseUrl) {
  const favicon = $('link[rel="icon"]').attr('href') || 
                  $('link[rel="shortcut icon"]').attr('href') ||
                  '/favicon.ico';

  if (favicon.startsWith('http')) {
    return favicon;
  }

  const urlObj = new URL(baseUrl);
  return new URL(favicon, urlObj.origin).href;
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}
