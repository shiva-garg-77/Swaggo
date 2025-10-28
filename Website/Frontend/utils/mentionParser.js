/**
 * Mention Parser Utility
 * Detects and extracts @mentions from text and creates mention records
 */

/**
 * Parse text and extract all mentions
 * @param {string} text - The text to parse
 * @returns {Array} - Array of mentioned usernames (without @)
 */
export function extractMentions(text) {
  if (!text || typeof text !== 'string') return [];
  
  // Match @username pattern (alphanumeric and underscore, 3-30 chars)
  const mentionPattern = /@([a-zA-Z0-9_]{3,30})/g;
  const mentions = [];
  let match;
  
  while ((match = mentionPattern.exec(text)) !== null) {
    const username = match[1];
    // Avoid duplicates
    if (!mentions.includes(username)) {
      mentions.push(username);
    }
  }
  
  return mentions;
}

/**
 * Convert plain text to HTML with clickable mentions
 * @param {string} text - The text to convert
 * @param {Function} onMentionClick - Callback when mention is clicked
 * @returns {string} - HTML string with mentions as links
 */
export function renderMentionsAsHTML(text, onMentionClick = null) {
  if (!text || typeof text !== 'string') return '';
  
  // Replace @mentions with clickable links
  return text.replace(/@([a-zA-Z0-9_]{3,30})/g, (match, username) => {
    const clickHandler = onMentionClick ? ` onclick="handleMentionClick('${username}')"` : '';
    return `<span class="mention text-blue-500 hover:text-blue-600 cursor-pointer font-medium"${clickHandler}>@${username}</span>`;
  });
}

/**
 * Convert plain text to React elements with clickable mentions
 * @param {string} text - The text to convert
 * @param {Function} onMentionClick - Callback when mention is clicked (receives username)
 * @returns {Array} - Array of React elements
 */
export function renderMentionsAsReact(text, onMentionClick = null) {
  if (!text || typeof text !== 'string') return [text];
  
  const parts = [];
  let lastIndex = 0;
  const mentionPattern = /@([a-zA-Z0-9_]{3,30})/g;
  let match;
  
  while ((match = mentionPattern.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add mention as clickable element
    const username = match[1];
    parts.push({
      type: 'mention',
      username: username,
      display: `@${username}`,
      onClick: onMentionClick
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts;
}

/**
 * Validate if a mention is valid
 * @param {string} username - The username to validate
 * @returns {boolean} - True if valid mention
 */
export function isValidMention(username) {
  if (!username || typeof username !== 'string') return false;
  
  // Username should be 3-30 characters, alphanumeric and underscore
  const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;
  return usernamePattern.test(username);
}

/**
 * Get mention suggestions as user types
 * @param {string} text - The current text
 * @param {number} cursorPosition - Current cursor position
 * @returns {Object} - { isActive: boolean, query: string, startPos: number }
 */
export function getMentionSuggestionState(text, cursorPosition) {
  if (!text || cursorPosition < 1) {
    return { isActive: false, query: '', startPos: -1 };
  }
  
  // Find the @ symbol before cursor
  const textBeforeCursor = text.substring(0, cursorPosition);
  const lastAtIndex = textBeforeCursor.lastIndexOf('@');
  
  if (lastAtIndex === -1) {
    return { isActive: false, query: '', startPos: -1 };
  }
  
  // Check if there's a space after the @
  const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
  if (textAfterAt.includes(' ')) {
    return { isActive: false, query: '', startPos: -1 };
  }
  
  // Check if @ is at start or preceded by space
  if (lastAtIndex === 0 || textBeforeCursor[lastAtIndex - 1] === ' ') {
    return {
      isActive: true,
      query: textAfterAt,
      startPos: lastAtIndex
    };
  }
  
  return { isActive: false, query: '', startPos: -1 };
}

/**
 * Create mention records via GraphQL
 * @param {Object} params - Parameters for creating mentions
 * @param {Array} params.mentions - Array of usernames to mention
 * @param {string} params.mentionerProfileId - Profile ID of the person mentioning
 * @param {string} params.contextType - Type of context ('post', 'comment', 'story')
 * @param {string} params.contextId - ID of the post/comment/story
 * @param {Function} params.createMentionMutation - GraphQL mutation function
 * @param {Function} params.getUserByUsername - Function to get user profile by username
 * @returns {Promise<Array>} - Array of created mention records
 */
export async function createMentions({
  mentions,
  mentionerProfileId,
  contextType,
  contextId,
  createMentionMutation,
  getUserByUsername
}) {
  if (!mentions || mentions.length === 0) return [];
  if (!mentionerProfileId || !contextType || !contextId) {
    console.error('Missing required parameters for creating mentions');
    return [];
  }
  
  const createdMentions = [];
  
  for (const username of mentions) {
    try {
      // First, verify the user exists and get their profile ID
      const userProfile = await getUserByUsername(username);
      
      if (!userProfile || !userProfile.profileid) {
        console.warn(`User @${username} not found, skipping mention`);
        continue;
      }
      
      // Create the mention record
      const result = await createMentionMutation({
        variables: {
          mentionedprofileid: userProfile.profileid,
          mentionerprofileid: mentionerProfileId,
          contexttype: contextType,
          contextid: contextId
        }
      });
      
      if (result.data?.CreateMention) {
        createdMentions.push(result.data.CreateMention);
        console.log(`✅ Created mention for @${username}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create mention for @${username}:`, error);
      // Continue with other mentions even if one fails
    }
  }
  
  return createdMentions;
}

/**
 * Highlight mentions in text for display
 * @param {string} text - The text to process
 * @param {string} className - CSS class for mentions (default: 'text-blue-500 font-medium')
 * @returns {string} - Text with mention spans
 */
export function highlightMentions(text, className = 'text-blue-500 font-medium cursor-pointer hover:underline') {
  if (!text || typeof text !== 'string') return text;
  
  return text.replace(
    /@([a-zA-Z0-9_]{3,30})/g,
    `<span class="${className}">@$1</span>`
  );
}

export default {
  extractMentions,
  renderMentionsAsHTML,
  renderMentionsAsReact,
  isValidMention,
  getMentionSuggestionState,
  createMentions,
  highlightMentions
};
