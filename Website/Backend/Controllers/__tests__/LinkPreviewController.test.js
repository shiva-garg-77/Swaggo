/**
 * @fileoverview Automated tests for LinkPreviewController
 * @version 1.0.0
 */

import LinkPreviewController from '../LinkPreviewController.js';
import axios from 'axios';
import cheerio from 'cheerio';

// Mock dependencies
jest.mock('axios');
jest.mock('cheerio');

describe('LinkPreviewController', () => {
  let linkPreviewController;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new instance of the controller
    linkPreviewController = new LinkPreviewController();
  });

  describe('URL Validation', () => {
    test('should validate valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com',
        'https://example.com/path',
        'https://example.com/path?query=1',
        'https://subdomain.example.com'
      ];
      
      validUrls.forEach(url => {
        expect(linkPreviewController.isValidUrl(url)).toBe(true);
      });
    });

    test('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        '',
        null,
        undefined
      ];
      
      invalidUrls.forEach(url => {
        expect(linkPreviewController.isValidUrl(url)).toBe(false);
      });
    });
  });

  describe('Link Preview Generation', () => {
    test('should generate preview for valid URL', async () => {
      const url = 'https://example.com';
      const mockHtml = `
        <html>
          <head>
            <title>Example Title</title>
            <meta name="description" content="Example description">
            <meta property="og:image" content="https://example.com/image.jpg">
          </head>
          <body>
            <h1>Example Heading</h1>
          </body>
        </html>
      `;
      
      const mock$ = jest.fn(() => ({
        'meta[property="og:title"]': { attr: jest.fn().mockReturnValue(null) },
        'meta[name="title"]': { attr: jest.fn().mockReturnValue(null) },
        title: jest.fn().mockReturnValue('Example Title'),
        'meta[property="og:description"]': { attr: jest.fn().mockReturnValue(null) },
        'meta[name="description"]': { attr: jest.fn().mockReturnValue('Example description') },
        'meta[property="og:image"]': { attr: jest.fn().mockReturnValue('https://example.com/image.jpg') },
        'meta[property="og:url"]': { attr: jest.fn().mockReturnValue(null) }
      }));
      
      cheerio.load = jest.fn().mockReturnValue(mock$);
      axios.get = jest.fn().mockResolvedValue({ data: mockHtml });
      
      const preview = await linkPreviewController.generateLinkPreview(url);
      
      expect(axios.get).toHaveBeenCalledWith(url, { timeout: 5000 });
      expect(cheerio.load).toHaveBeenCalledWith(mockHtml);
      expect(preview).toEqual({
        url: 'https://example.com',
        title: 'Example Title',
        description: 'Example description',
        image: 'https://example.com/image.jpg',
        siteName: 'example.com'
      });
    });

    test('should handle HTTP errors gracefully', async () => {
      const url = 'https://example.com';
      
      axios.get = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const preview = await linkPreviewController.generateLinkPreview(url);
      
      expect(preview).toEqual({
        url: 'https://example.com',
        title: 'https://example.com',
        description: 'Link preview could not be generated',
        image: null,
        siteName: 'example.com'
      });
    });

    test('should handle timeout errors', async () => {
      const url = 'https://slow-example.com';
      
      axios.get = jest.fn().mockRejectedValue(new Error('timeout of 5000ms exceeded'));
      
      const preview = await linkPreviewController.generateLinkPreview(url);
      
      expect(preview.title).toBe('https://slow-example.com');
      expect(preview.description).toBe('Link preview could not be generated');
    });
  });

  describe('Metadata Extraction', () => {
    test('should extract OpenGraph metadata', () => {
      const mock$ = jest.fn(() => ({
        'meta[property="og:title"]': { attr: jest.fn().mockReturnValue('OG Title') },
        'meta[property="og:description"]': { attr: jest.fn().mockReturnValue('OG Description') },
        'meta[property="og:image"]': { attr: jest.fn().mockReturnValue('https://example.com/og-image.jpg') },
        'meta[property="og:url"]': { attr: jest.fn().mockReturnValue('https://example.com/og-url') }
      }));
      
      const metadata = linkPreviewController.extractOpenGraphMetadata(mock$, 'https://example.com');
      
      expect(metadata).toEqual({
        title: 'OG Title',
        description: 'OG Description',
        image: 'https://example.com/og-image.jpg',
        url: 'https://example.com/og-url'
      });
    });

    test('should extract Twitter Card metadata', () => {
      const mock$ = jest.fn(() => ({
        'meta[name="twitter:title"]': { attr: jest.fn().mockReturnValue('Twitter Title') },
        'meta[name="twitter:description"]': { attr: jest.fn().mockReturnValue('Twitter Description') },
        'meta[name="twitter:image"]': { attr: jest.fn().mockReturnValue('https://example.com/twitter-image.jpg') }
      }));
      
      const metadata = linkPreviewController.extractTwitterCardMetadata(mock$);
      
      expect(metadata).toEqual({
        title: 'Twitter Title',
        description: 'Twitter Description',
        image: 'https://example.com/twitter-image.jpg'
      });
    });

    test('should extract standard metadata when OpenGraph is not available', () => {
      const mock$ = jest.fn(() => ({
        'meta[property="og:title"]': { attr: jest.fn().mockReturnValue(null) },
        'meta[name="title"]': { attr: jest.fn().mockReturnValue('Standard Title') },
        'meta[property="og:description"]': { attr: jest.fn().mockReturnValue(null) },
        'meta[name="description"]': { attr: jest.fn().mockReturnValue('Standard Description') },
        title: jest.fn().mockReturnValue('HTML Title')
      }));
      
      const metadata = linkPreviewController.extractStandardMetadata(mock$, 'https://example.com');
      
      expect(metadata).toEqual({
        title: 'Standard Title',
        description: 'Standard Description'
      });
    });
  });

  describe('Image Handling', () => {
    test('should validate image URLs', () => {
      const validImages = [
        'https://example.com/image.jpg',
        'https://example.com/image.png',
        'https://example.com/image.gif',
        'https://example.com/image.webp'
      ];
      
      const invalidImages = [
        'https://example.com/document.pdf',
        'https://example.com/script.js',
        'data:image/jpeg;base64,...',
        'javascript:alert(1)',
        ''
      ];
      
      validImages.forEach(url => {
        expect(linkPreviewController.isValidImageUrl(url)).toBe(true);
      });
      
      invalidImages.forEach(url => {
        expect(linkPreviewController.isValidImageUrl(url)).toBe(false);
      });
    });

    test('should normalize image URLs', () => {
      const testCases = [
        {
          input: '/image.jpg',
          baseUrl: 'https://example.com',
          expected: 'https://example.com/image.jpg'
        },
        {
          input: 'image.jpg',
          baseUrl: 'https://example.com/path/',
          expected: 'https://example.com/path/image.jpg'
        },
        {
          input: 'https://cdn.example.com/image.jpg',
          baseUrl: 'https://example.com',
          expected: 'https://cdn.example.com/image.jpg'
        }
      ];
      
      testCases.forEach(({ input, baseUrl, expected }) => {
        expect(linkPreviewController.normalizeImageUrl(input, baseUrl)).toBe(expected);
      });
    });
  });

  describe('Content Sanitization', () => {
    test('should sanitize extracted metadata', () => {
      const dirtyMetadata = {
        title: '<script>alert("xss")</script>Safe Title',
        description: 'Safe description<script>malicious code</script>',
        image: 'https://example.com/image.jpg'
      };
      
      const cleanMetadata = linkPreviewController.sanitizeMetadata(dirtyMetadata);
      
      expect(cleanMetadata.title).toBe('Safe Title');
      expect(cleanMetadata.description).toBe('Safe description');
      expect(cleanMetadata.image).toBe('https://example.com/image.jpg');
    });

    test('should truncate long metadata', () => {
      const longMetadata = {
        title: 'A'.repeat(300),
        description: 'B'.repeat(1000)
      };
      
      const truncatedMetadata = linkPreviewController.truncateMetadata(longMetadata);
      
      expect(truncatedMetadata.title.length).toBeLessThanOrEqual(200);
      expect(truncatedMetadata.description.length).toBeLessThanOrEqual(500);
    });
  });

  describe('Caching', () => {
    test('should cache preview results', async () => {
      const url = 'https://example.com';
      const mockPreview = {
        url: 'https://example.com',
        title: 'Example',
        description: 'Description',
        image: 'https://example.com/image.jpg'
      };
      
      // First call should generate preview
      axios.get = jest.fn().mockResolvedValue({ data: '<html></html>' });
      cheerio.load = jest.fn().mockReturnValue(jest.fn());
      
      const firstPreview = await linkPreviewController.generateLinkPreview(url);
      
      // Second call should use cache
      const secondPreview = await linkPreviewController.generateLinkPreview(url);
      
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(firstPreview).toEqual(secondPreview);
    });

    test('should respect cache expiration', async () => {
      const url = 'https://example.com';
      
      // Mock Date to control cache expiration
      const now = Date.now();
      jest.spyOn(global.Date, 'now').mockImplementation(() => now);
      
      // Generate first preview
      axios.get = jest.fn().mockResolvedValue({ data: '<html></html>' });
      cheerio.load = jest.fn().mockReturnValue(jest.fn());
      
      await linkPreviewController.generateLinkPreview(url);
      
      // Advance time beyond cache expiration (5 minutes)
      jest.spyOn(global.Date, 'now').mockImplementation(() => now + 6 * 60 * 1000);
      
      // Should generate new preview
      await linkPreviewController.generateLinkPreview(url);
      
      expect(axios.get).toHaveBeenCalledTimes(2);
      
      // Restore Date
      global.Date.now.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed HTML', async () => {
      const url = 'https://example.com';
      const malformedHtml = '<html><head><title>Test</title></head><body>';
      
      axios.get = jest.fn().mockResolvedValue({ data: malformedHtml });
      cheerio.load = jest.fn().mockImplementation(() => {
        throw new Error('Malformed HTML');
      });
      
      const preview = await linkPreviewController.generateLinkPreview(url);
      
      expect(preview.title).toBe('https://example.com');
      expect(preview.description).toBe('Link preview could not be generated');
    });

    test('should handle empty responses', async () => {
      const url = 'https://example.com';
      
      axios.get = jest.fn().mockResolvedValue({ data: '' });
      
      const preview = await linkPreviewController.generateLinkPreview(url);
      
      expect(preview.title).toBe('https://example.com');
      expect(preview.description).toBe('Link preview could not be generated');
    });
  });

  describe('Performance Optimization', () => {
    test('should limit concurrent requests', async () => {
      const urls = Array(20).fill().map((_, i) => `https://example${i}.com`);
      
      // Mock slow responses
      axios.get = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ data: '<html></html>' });
          }, 100);
        });
      });
      
      // Track concurrent requests
      let maxConcurrent = 0;
      let currentConcurrent = 0;
      
      const originalGet = axios.get;
      axios.get = jest.fn().mockImplementation(async (url) => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        
        const result = await originalGet(url);
        
        currentConcurrent--;
        return result;
      });
      
      // Generate previews concurrently
      const promises = urls.map(url => linkPreviewController.generateLinkPreview(url));
      await Promise.all(promises);
      
      // Should not exceed concurrency limit (5 by default)
      expect(maxConcurrent).toBeLessThanOrEqual(5);
    });

    test('should timeout long requests', async () => {
      const url = 'https://slow-example.com';
      
      // Mock a very slow response
      axios.get = jest.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Timeout'));
          }, 10000);
        });
      });
      
      const start = Date.now();
      const preview = await linkPreviewController.generateLinkPreview(url);
      const duration = Date.now() - start;
      
      // Should timeout within reasonable time (5 seconds + some buffer)
      expect(duration).toBeLessThan(7000);
      expect(preview.title).toBe(url);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete preview generation flow', async () => {
      const url = 'https://example.com/article';
      const mockHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Article Title</title>
          <meta name="description" content="Article description">
          <meta property="og:image" content="https://example.com/article-image.jpg">
          <meta property="og:site_name" content="Example Site">
        </head>
        <body>
          <article>
            <h1>Article Title</h1>
            <p>Article content...</p>
          </article>
        </body>
        </html>
      `;
      
      axios.get = jest.fn().mockResolvedValue({ data: mockHtml });
      
      const mock$ = jest.fn(() => ({
        'meta[property="og:title"]': { attr: jest.fn().mockReturnValue('Article Title') },
        'meta[name="description"]': { attr: jest.fn().mockReturnValue('Article description') },
        'meta[property="og:image"]': { attr: jest.fn().mockReturnValue('https://example.com/article-image.jpg') },
        'meta[property="og:site_name"]': { attr: jest.fn().mockReturnValue('Example Site') },
        'meta[property="og:url"]': { attr: jest.fn().mockReturnValue('https://example.com/article') }
      }));
      
      cheerio.load = jest.fn().mockReturnValue(mock$);
      
      const preview = await linkPreviewController.generateLinkPreview(url);
      
      expect(preview).toEqual({
        url: 'https://example.com/article',
        title: 'Article Title',
        description: 'Article description',
        image: 'https://example.com/article-image.jpg',
        siteName: 'Example Site'
      });
      
      // Verify caching works
      const cachedPreview = await linkPreviewController.generateLinkPreview(url);
      expect(cachedPreview).toEqual(preview);
    });
  });
});