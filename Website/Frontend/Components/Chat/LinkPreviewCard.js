'use client';

import React, { useState, useEffect } from 'react';
import { get as getPreview, prefetch as prefetchPreview } from '../../services/LinkPreviewCache';
import { getRenderer as getDomainRenderer } from '../../services/LinkPreviewRegistry';
import { LazyImage } from '../../utils/performanceOptimizations';

/**
 * Link Preview Card Component
 * 
 * Displays rich preview cards for URLs in messages
 * - Fetches OpenGraph metadata
 * - Shows title, description, image
 * - Handles loading and error states
 * - Clickable to open in new tab
 */
export default function LinkPreviewCard({ url, variant = 'expanded', imageProxy = null }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;

    fetchLinkPreview(url);
  }, [url]);

  const fetchLinkPreview = async (url) => {
    try {
      setLoading(true);
      setError(null);

      const cached = await getPreview(url);
      if (cached) {
        setPreview(cached);
        setLoading(false);
        return;
      }

      const data = await prefetchPreview(url);
      setPreview(data);
    } catch (err) {
      console.error('Error fetching link preview:', err);
      setError(err.message);
      const fallback = {
        url,
        title: extractDomain(url),
        description: url,
        image: null,
        siteName: extractDomain(url)
      };
      setPreview(fallback);
    } finally {
      setLoading(false);
    }
  };

  const extractDomain = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getDomain = () => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return extractDomain(url);
    }
  };

  const domain = getDomain();

  const maybeProxy = (img) => {
    if (!img) return null;
    if (!imageProxy) return img;
    return `${imageProxy}?url=${encodeURIComponent(img)}`;
  };

  const domainRenderer = getDomainRenderer(domain, url, preview);

  const renderMedia = () => {
    // YouTube special: show thumbnail if not provided
    const isYouTube = /(^|\.)youtube\.com$/i.test(domain) || /(^|\.)youtu\.be$/i.test(domain);
    if (isYouTube) {
      let videoId = null;
      try {
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) {
          videoId = u.pathname.split('/')[1];
        } else if (u.searchParams.get('v')) {
          videoId = u.searchParams.get('v');
        }
      } catch {}
      const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : preview?.image;
      if (thumb) {
        return (
          <div className="relative w-32 flex-shrink-0">
            <LazyImage src={maybeProxy(thumb)} alt={preview?.title || 'YouTube'} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        );
      }
    }
    // Default image
    if (preview?.image) {
      return (
        <div className="w-32 flex-shrink-0">
          <LazyImage src={maybeProxy(preview.image)} alt={preview.title || 'Link preview'} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mt-2 animate-pulse">
        <div className="flex space-x-3">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!preview) return null;

  const content = (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mt-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group ${variant === 'compact' ? 'p-2' : ''}`}
      onClick={handleClick}
    >
      <div className={`flex ${variant === 'compact' ? 'items-center' : ''}`}>
        {/* Image/Thumbnail or domain-specific media */}
        {renderMedia()}

        {/* Content */}
        <div className={`flex-1 ${variant === 'compact' ? 'p-2' : 'p-3'} min-w-0`}>
          {/* Site name / Domain */}
          <div className={`flex items-center space-x-1 ${variant === 'compact' ? '' : 'mb-1'}`}>
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {preview.siteName || extractDomain(url)}
            </span>
          </div>

          {/* Title */}
          {(domainRenderer?.title || preview.title) && (
            <h4 className={`font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${variant === 'compact' ? '' : 'mb-1'}`}>
              {domainRenderer?.title || preview.title}
            </h4>
          )}

          {/* Description */}
          {variant !== 'compact' && preview.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {preview.description}
            </p>
          )}

          {/* URL */}
          <div className={`flex items-center space-x-1 ${variant === 'compact' ? '' : 'mt-1'}`}>
            <span className="text-xs text-blue-500 dark:text-blue-400 truncate">
              {url}
            </span>
            <svg className="w-3 h-3 text-blue-500 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );

  return content;
}

/**
 * Utility function to extract URLs from message content
 */
export function extractUrls(text) {
  if (!text) return [];
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Component to automatically detect and show link previews
 */
export function MessageWithLinkPreviews({ content, children }) {
  const urls = extractUrls(content);
  
  return (
    <>
      {children}
      {urls.length > 0 && (
        <div className="space-y-2">
          {urls.map((url, index) => (
            <LinkPreviewCard key={index} url={url} />
          ))}
        </div>
      )}
    </>
  );
}