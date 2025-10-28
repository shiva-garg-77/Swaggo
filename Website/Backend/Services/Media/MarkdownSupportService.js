import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Markdown Support Service
 * Provides markdown parsing and sanitization for chat messages
 */

class MarkdownSupportService {
  constructor() {
    // Configure marked options for security and consistency
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert \n to <br>
      smartLists: true,
      smartypants: true,
      xhtml: true,
      // Security: Disable potentially dangerous features
      mangle: false, // Don't mangle emails
      headerIds: false // Don't add IDs to headers
    });
    
    // Custom renderer for additional security and styling
    this.renderer = new marked.Renderer();
    
    // Override link rendering to add security attributes
    this.renderer.link = (href, title, text) => {
      // Validate and sanitize URL
      const safeHref = this.sanitizeUrl(href);
      const safeTitle = title ? DOMPurify.sanitize(title) : '';
      const safeText = DOMPurify.sanitize(text);
      
      return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" title="${safeTitle}" class="text-blue-500 hover:text-blue-700 underline">${safeText}</a>`;
    };
    
    // Override image rendering for security and responsiveness
    this.renderer.image = (href, title, text) => {
      // Validate and sanitize URL
      const safeHref = this.sanitizeUrl(href);
      const safeTitle = title ? DOMPurify.sanitize(title) : '';
      const safeText = DOMPurify.sanitize(text);
      
      return `<img src="${safeHref}" alt="${safeText}" title="${safeTitle}" class="max-w-full h-auto rounded-lg shadow-sm" loading="lazy">`;
    };
    
    // Override code block rendering for syntax highlighting
    this.renderer.code = (code, infostring, escaped) => {
      const lang = (infostring || '').match(/\S*/)[0];
      
      if (this.options.highlight) {
        const out = this.options.highlight(code, lang);
        if (out != null && out !== code) {
          escaped = true;
          code = out;
        }
      }
      
      if (!lang) {
        return `<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto"><code class="text-sm">${escaped ? code : DOMPurify.sanitize(code, { ALLOWED_TAGS: [] })}</code></pre>`;
      }
      
      return `<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto"><code class="language-${DOMPurify.sanitize(lang, { ALLOWED_TAGS: [] })} text-sm">${escaped ? code : DOMPurify.sanitize(code, { ALLOWED_TAGS: [] })}</code></pre>`;
    };
    
    // Override blockquote rendering
    this.renderer.blockquote = (quote) => {
      return `<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400">${quote}</blockquote>`;
    };
    
    // Override heading rendering
    this.renderer.heading = (text, level) => {
      const safeText = DOMPurify.sanitize(text);
      return `<h${level} class="text-${6-level}xl font-bold mt-4 mb-2 text-gray-900 dark:text-white">${safeText}</h${level}>`;
    };
    
    // Override paragraph rendering
    this.renderer.paragraph = (text) => {
      const safeText = DOMPurify.sanitize(text);
      return `<p class="mb-3 text-gray-800 dark:text-gray-200">${safeText}</p>`;
    };
    
    // Override list rendering
    this.renderer.list = (body, ordered, start) => {
      const type = ordered ? 'ol' : 'ul';
      const className = ordered 
        ? 'list-decimal list-inside space-y-1' 
        : 'list-disc list-inside space-y-1';
      const startAttr = (ordered && start) ? ` start="${start}"` : '';
      return `<${type} class="${className}"${startAttr}>${body}</${type}>`;
    };
    
    // Override list item rendering
    this.renderer.listitem = (text) => {
      const safeText = DOMPurify.sanitize(text);
      return `<li class="text-gray-800 dark:text-gray-200">${safeText}</li>`;
    };
  }

  /**
   * Parse markdown content to HTML
   */
  parseMarkdown(markdownContent) {
    try {
      // Sanitize input first
      const sanitizedContent = DOMPurify.sanitize(markdownContent, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'div', 'span', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img'],
        ALLOWED_ATTR: ['href', 'title', 'alt', 'class', 'target', 'rel', 'loading']
      });
      
      // Parse with marked and custom renderer
      const html = marked(sanitizedContent, { renderer: this.renderer });
      
      // Final sanitization to ensure safety
      const safeHtml = DOMPurify.sanitize(html, {
        ADD_ATTR: ['target', 'rel', 'loading'],
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout']
      });
      
      return safeHtml;
    } catch (error) {
      console.error('Markdown parsing failed:', error);
      // Return sanitized plain text as fallback
      return DOMPurify.sanitize(markdownContent);
    }
  }

  /**
   * Sanitize URL for security
   */
  sanitizeUrl(url) {
    try {
      // Allow relative URLs and common protocols
      const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
      const parsedUrl = new URL(url, 'http://localhost'); // Use localhost as base for relative URLs
      
      if (allowedProtocols.includes(parsedUrl.protocol)) {
        return DOMPurify.sanitize(url);
      }
      
      // For other protocols, return a safe fallback
      return 'javascript:void(0)';
    } catch (error) {
      // If URL parsing fails, return safe fallback
      return 'javascript:void(0)';
    }
  }

  /**
   * Check if content contains markdown syntax
   */
  containsMarkdown(content) {
    if (!content || typeof content !== 'string') return false;
    
    // Common markdown patterns
    const markdownPatterns = [
      /\*\*.*?\*\*/,      // Bold: **text**
      /\*.*?\*/,          // Italic: *text*
      /\[.*?\]\(.*?\)/,   // Links: [text](url)
      /^#{1,6}\s/,        // Headers: # Header
      /^>\s/,             // Blockquotes: > quote
      /`{3}[\s\S]*?`{3}/, // Code blocks: ```code```
      /`[^`]+`/,          // Inline code: `code`
      /^[\*\-]\s/,        // Unordered lists: * item or - item
      /^\d+\.\s/          // Ordered lists: 1. item
    ];
    
    return markdownPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Convert plain text to basic markdown
   */
  textToMarkdown(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>')             // Italic
      .replace(/~~(.*?)~~/g, '<del>$1</del>')           // Strikethrough
      .replace(/`(.*?)`/g, '<code>$1</code>')           // Inline code
      .replace(/\n/g, '<br>');                          // Line breaks
  }

  /**
   * Strip markdown formatting and return plain text
   */
  stripMarkdown(markdown) {
    if (!markdown || typeof markdown !== 'string') return '';
    
    return markdown
      .replace(/(\*\*|__)(.*?)\1/g, '$2')        // Bold
      .replace(/(\*|_)(.*?)\1/g, '$2')           // Italic
      .replace(/~~(.*?)~~/g, '$1')               // Strikethrough
      .replace(/`{3}[\s\S]*?`{3}/g, '')          // Code blocks
      .replace(/`(.*?)`/g, '$1')                 // Inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // Links
      .replace(/^#{1,6}\s*(.*?)\s*#*$/gm, '$1')  // Headers
      .replace(/^>\s*(.*?)$/gm, '$1')            // Blockquotes
      .replace(/^\s*[\*\-]\s*(.*?)$/gm, '$1')    // Unordered lists
      .replace(/^\s*\d+\.\s*(.*?)$/gm, '$1');    // Ordered lists
  }

  /**
   * Get supported markdown features
   */
  getSupportedFeatures() {
    return {
      bold: '**text** or __text__',
      italic: '*text* or _text_',
      strikethrough: '~~text~~',
      links: '[text](url)',
      images: '![alt](url)',
      headers: '# Header, ## Header, etc.',
      blockquotes: '> quote',
      code: '`code` or ```code```',
      lists: '* item or 1. item',
      lineBreaks: 'Double space at end of line'
    };
  }
}

// Export singleton instance
export default new MarkdownSupportService();