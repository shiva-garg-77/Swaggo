import MarkdownSupportService from '../../Services/MarkdownSupportService.js';

describe('Markdown Support Service', () => {
  describe('Basic Markdown Parsing', () => {
    test('should parse bold text', () => {
      const markdown = '**bold text**';
      const html = MarkdownSupportService.parseMarkdown(markdown);
      expect(html).toContain('<strong>bold text</strong>');
    });

    test('should parse italic text', () => {
      const markdown = '*italic text*';
      const html = MarkdownSupportService.parseMarkdown(markdown);
      expect(html).toContain('<em>italic text</em>');
    });

    test('should parse headings', () => {
      const markdown = '# Heading 1\n## Heading 2';
      const html = MarkdownSupportService.parseMarkdown(markdown);
      expect(html).toContain('<h1');
      expect(html).toContain('<h2');
    });

    test('should parse links with security attributes', () => {
      const markdown = '[Link](https://example.com)';
      const html = MarkdownSupportService.parseMarkdown(markdown);
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
    });

    test('should parse code blocks', () => {
      const markdown = '```javascript\nconsole.log("hello");\n```';
      const html = MarkdownSupportService.parseMarkdown(markdown);
      expect(html).toContain('<pre');
      expect(html).toContain('<code');
    });
  });

  describe('Security Features', () => {
    test('should sanitize dangerous HTML', () => {
      const markdown = '<script>alert("xss")</script> **safe text**';
      const html = MarkdownSupportService.parseMarkdown(markdown);
      expect(html).not.toContain('<script>');
      expect(html).toContain('<strong>safe text</strong>');
    });

    test('should sanitize dangerous URLs', () => {
      const markdown = '[Dangerous Link](javascript:alert("xss"))';
      const html = MarkdownSupportService.parseMarkdown(markdown);
      expect(html).toContain('href="javascript:void(0)"');
    });
  });

  describe('Utility Functions', () => {
    test('should detect markdown content', () => {
      const content = 'This has **bold** text';
      const hasMarkdown = MarkdownSupportService.containsMarkdown(content);
      expect(hasMarkdown).toBe(true);
    });

    test('should strip markdown formatting', () => {
      const markdown = '**bold** *italic* [link](url)';
      const plainText = MarkdownSupportService.stripMarkdown(markdown);
      expect(plainText).toBe('bold italic link');
    });

    test('should convert text to basic markdown', () => {
      const text = '**bold** *italic*';
      const html = MarkdownSupportService.textToMarkdown(text);
      expect(html).toContain('<strong>');
      expect(html).toContain('<em>');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty content', () => {
      const html = MarkdownSupportService.parseMarkdown('');
      expect(html).toBe('');
    });

    test('should handle null content', () => {
      const html = MarkdownSupportService.parseMarkdown(null);
      expect(html).toBe('');
    });

    test('should handle malformed markdown', () => {
      const markdown = '**unclosed bold';
      const html = MarkdownSupportService.parseMarkdown(markdown);
      // Should not crash and should return sanitized content
      expect(typeof html).toBe('string');
    });
  });
});