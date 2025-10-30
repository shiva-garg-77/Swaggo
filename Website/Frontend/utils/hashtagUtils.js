/**
 * Hashtag Utilities
 * Helper functions for making hashtags clickable throughout the app
 */

/**
 * Extract hashtags from text
 * @param {string} text - Text to extract hashtags from
 * @returns {Array<string>} Array of hashtags
 */
export function extractHashtags(text) {
  if (!text) return [];
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.slice(1)) : [];
}

/**
 * Make hashtags clickable in text
 * @param {string} text - Text containing hashtags
 * @param {Function} onHashtagClick - Callback when hashtag is clicked
 * @returns {React.ReactNode} Text with clickable hashtags
 */
export function renderTextWithHashtags(text, onHashtagClick) {
  if (!text) return null;

  const hashtagRegex = /(#[\w\u0590-\u05ff]+)/g;
  const parts = text.split(hashtagRegex);

  return parts.map((part, index) => {
    if (part.match(hashtagRegex)) {
      const hashtag = part.slice(1); // Remove #
      return (
        <span
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            onHashtagClick(hashtag);
          }}
          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/**
 * Convert text with hashtags to JSX
 * @param {string} text - Text containing hashtags
 * @param {string} baseUrl - Base URL for hashtag links (default: '/explore/hashtag/')
 * @returns {React.ReactNode} JSX with clickable hashtags
 */
export function hashtagsToLinks(text, baseUrl = '/explore/hashtag/') {
  if (!text) return null;

  const hashtagRegex = /(#[\w\u0590-\u05ff]+)/g;
  const parts = text.split(hashtagRegex);

  return parts.map((part, index) => {
    if (part.match(hashtagRegex)) {
      const hashtag = part.slice(1); // Remove #
      return (
        <a
          key={index}
          href={`${baseUrl}${hashtag}`}
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/**
 * Check if text contains hashtags
 * @param {string} text - Text to check
 * @returns {boolean} True if text contains hashtags
 */
export function hasHashtags(text) {
  if (!text) return false;
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  return hashtagRegex.test(text);
}

/**
 * Format hashtag for URL
 * @param {string} hashtag - Hashtag to format
 * @returns {string} Formatted hashtag
 */
export function formatHashtagForUrl(hashtag) {
  return hashtag.replace('#', '').toLowerCase();
}

/**
 * Get hashtag URL
 * @param {string} hashtag - Hashtag
 * @param {string} baseUrl - Base URL (default: '/explore/hashtag/')
 * @returns {string} Full hashtag URL
 */
export function getHashtagUrl(hashtag, baseUrl = '/explore/hashtag/') {
  return `${baseUrl}${formatHashtagForUrl(hashtag)}`;
}

export default {
  extractHashtags,
  renderTextWithHashtags,
  hashtagsToLinks,
  hasHashtags,
  formatHashtagForUrl,
  getHashtagUrl
};
