/**
 * Enhanced Search Service
 * Provides advanced search capabilities with better performance and filtering
 */

/**
 * Search Operators
 */
const SEARCH_OPERATORS = {
  FROM: 'from',
  BEFORE: 'before',
  AFTER: 'after',
  IN: 'in',
  IS: 'is',
  HAS: 'has',
  SENTIMENT: 'sentiment',
  PRIORITY: 'priority'
};

/**
 * Search Filters
 */
const SEARCH_FILTERS = {
  MESSAGE_TYPES: ['text', 'image', 'video', 'voice', 'gif', 'file', 'link'],
  DATE_RANGES: ['all', 'today', 'week', 'month', 'year'],
  SENTIMENTS: ['all', 'positive', 'negative', 'neutral'],
  PRIORITIES: ['all', 'low', 'medium', 'high', 'critical'],
  IMPORTANCE: ['all', 'low', 'medium', 'high']
};

/**
 * Enhanced Search Service Class
 */
class EnhancedSearchService {
  constructor() {
    // Cache for search results
    this.searchCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Performance metrics
    this.metrics = {
      searchesPerformed: 0,
      averageSearchTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    // Search index for faster lookups
    this.searchIndex = new Map();
    
    console.log('🔍 EnhancedSearchService initialized');
  }

  /**
   * Parse search query with operators
   */
  parseQuery(query) {
    if (!query || typeof query !== 'string') {
      return { terms: '', operators: {} };
    }

    const tokens = query.trim().split(/\s+/);
    const operators = {};
    const terms = [];

    for (const token of tokens) {
      if (this.isOperator(token)) {
        const [operator, value] = token.split(':');
        const cleanOperator = operator.toLowerCase().replace(/^[-+]/, '');
        const cleanValue = value ? value.trim() : '';
        
        if (cleanValue) {
          operators[cleanOperator] = cleanValue;
        }
      } else {
        terms.push(token);
      }
    }

    return {
      terms: terms.join(' ').toLowerCase(),
      operators
    };
  }

  /**
   * Check if token is an operator
   */
  isOperator(token) {
    return /^[a-zA-Z]+:/.test(token);
  }

  /**
   * Create search index from messages
   */
  createIndex(messages) {
    console.time('.CreateIndex');
    
    this.searchIndex.clear();
    
    messages.forEach(message => {
      // Index by message ID
      this.searchIndex.set(message.messageid, message);
      
      // Index by content words
      if (message.content) {
        const words = message.content.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 2) { // Only index words longer than 2 characters
            if (!this.searchIndex.has(`word_${word}`)) {
              this.searchIndex.set(`word_${word}`, new Set());
            }
            this.searchIndex.get(`word_${word}`).add(message.messageid);
          }
        });
      }
      
      // Index by sender
      if (message.sender?.username) {
        const senderKey = `sender_${message.sender.username.toLowerCase()}`;
        if (!this.searchIndex.has(senderKey)) {
          this.searchIndex.set(senderKey, new Set());
        }
        this.searchIndex.get(senderKey).add(message.messageid);
      }
      
      // Index by message type
      const typeKey = `type_${message.messageType || 'text'}`;
      if (!this.searchIndex.has(typeKey)) {
        this.searchIndex.set(typeKey, new Set());
      }
      this.searchIndex.get(typeKey).add(message.messageid);
    });
    
    console.timeEnd('.CreateIndex');
    console.log(`📊 Search index created with ${this.searchIndex.size} entries`);
  }

  /**
   * Perform enhanced search with filters
   */
  search(messages, query, filters = {}) {
    const startTime = performance.now();
    this.metrics.searchesPerformed++;
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(query, filters);
    
    // Check cache first
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.metrics.cacheHits++;
        console.log('💾 Search cache hit');
        return cached.results;
      } else {
        // Remove expired cache entry
        this.searchCache.delete(cacheKey);
      }
    }
    
    this.metrics.cacheMisses++;
    
    try {
      // Parse query
      const parsedQuery = this.parseQuery(query);
      
      // Apply filters and search
      let results = this.applyFilters(messages, parsedQuery, filters);
      
      // Sort results by relevance and date
      results = this.sortResults(results, parsedQuery.terms);
      
      // Cache results
      this.searchCache.set(cacheKey, {
        results,
        timestamp: Date.now()
      });
      
      // Update performance metrics
      const searchTime = performance.now() - startTime;
      this.metrics.averageSearchTime = 
        (this.metrics.averageSearchTime * (this.metrics.searchesPerformed - 1) + searchTime) 
        / this.metrics.searchesPerformed;
      
      console.log(`🔍 Search completed in ${searchTime.toFixed(2)}ms`);
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Apply filters to messages
   */
  applyFilters(messages, parsedQuery, filters) {
    const { terms, operators } = parsedQuery;
    const {
      messageTypes = [],
      senders = [],
      dateRange = 'all',
      sentiment = 'all',
      importance = 'all',
      hasAttachments = false,
      hasReactions = false,
      isEdited = false,
      priority = 'all'
    } = filters;

    // Use search index for initial filtering when possible
    let filteredMessages = messages;
    
    if (terms) {
      // Use word index for faster text search
      const wordMatches = new Set();
      const words = terms.toLowerCase().split(/\s+/);
      
      words.forEach(word => {
        const wordKey = `word_${word}`;
        if (this.searchIndex.has(wordKey)) {
          const messageIds = this.searchIndex.get(wordKey);
          messageIds.forEach(id => wordMatches.add(id));
        }
      });
      
      // Filter messages that match any of the words
      if (wordMatches.size > 0) {
        filteredMessages = filteredMessages.filter(msg => wordMatches.has(msg.messageid));
      }
    }
    
    // Apply all filters
    return filteredMessages.filter(message => {
      // Text search
      const textMatch = !terms || this.matchesText(message, terms);
      
      // Operator filters
      const operatorMatch = this.matchesOperators(message, operators);
      
      // UI filters
      const typeMatch = messageTypes.length === 0 || messageTypes.includes(message.messageType || 'text');
      const senderMatch = senders.length === 0 || senders.includes(message.senderid);
      const dateMatch = this.matchesDateRange(message.createdAt, dateRange);
      const sentimentMatch = sentiment === 'all' || message.sentiment === sentiment;
      const importanceMatch = importance === 'all' || message.importance === importance;
      const attachmentMatch = !hasAttachments || (message.attachments && message.attachments.length > 0);
      const reactionMatch = !hasReactions || (message.reactions && message.reactions.length > 0);
      const editedMatch = !isEdited || message.isEdited;
      const priorityMatch = priority === 'all' || message.priority === priority;
      
      return textMatch && operatorMatch && typeMatch && senderMatch && dateMatch && 
             sentimentMatch && importanceMatch && attachmentMatch && reactionMatch && 
             editedMatch && priorityMatch;
    });
  }

  /**
   * Check if message matches text search
   */
  matchesText(message, terms) {
    if (!terms) return true;
    
    const lowerTerms = terms.toLowerCase();
    
    // Check content
    if (message.content && message.content.toLowerCase().includes(lowerTerms)) {
      return true;
    }
    
    // Check sender name/username
    if (message.sender) {
      if (message.sender.name && message.sender.name.toLowerCase().includes(lowerTerms)) {
        return true;
      }
      if (message.sender.username && message.sender.username.toLowerCase().includes(lowerTerms)) {
        return true;
      }
    }
    
    // Check attachments
    if (message.attachments && message.attachments.length > 0) {
      return message.attachments.some(att => 
        att.filename && att.filename.toLowerCase().includes(lowerTerms)
      );
    }
    
    return false;
  }

  /**
   * Check if message matches operators
   */
  matchesOperators(message, operators) {
    // from: operator
    if (operators.from) {
      const fromValue = operators.from.toLowerCase();
      const sender = message.sender;
      if (!sender || 
          (sender.username && !sender.username.toLowerCase().includes(fromValue)) &&
          (sender.name && !sender.name.toLowerCase().includes(fromValue))) {
        return false;
      }
    }
    
    // before: operator
    if (operators.before) {
      try {
        const beforeDate = new Date(operators.before);
        const messageDate = new Date(message.createdAt);
        if (messageDate > beforeDate) {
          return false;
        }
      } catch (e) {
        console.warn('Invalid date for before: operator', operators.before);
      }
    }
    
    // after: operator
    if (operators.after) {
      try {
        const afterDate = new Date(operators.after);
        const messageDate = new Date(message.createdAt);
        if (messageDate < afterDate) {
          return false;
        }
      } catch (e) {
        console.warn('Invalid date for after: operator', operators.after);
      }
    }
    
    // is: operator
    if (operators.is) {
      const isValue = operators.is.toLowerCase();
      switch (isValue) {
        case 'pinned':
          if (!message.isPinned) return false;
          break;
        case 'starred':
        case 'bookmarked':
          if (!message.isBookmarked) return false;
          break;
        case 'edited':
          if (!message.isEdited) return false;
          break;
        case 'thread':
          if (!message.threadId && (!message.threadReplies || message.threadReplies.length === 0)) {
            return false;
          }
          break;
      }
    }
    
    // has: operator
    if (operators.has) {
      const hasValues = operators.has.toLowerCase().split(',');
      for (const hasValue of hasValues) {
        switch (hasValue.trim()) {
          case 'attachment':
            if (!message.attachments || message.attachments.length === 0) return false;
            break;
          case 'image':
            if (!message.attachments || !message.attachments.some(a => a.type === 'image')) return false;
            break;
          case 'video':
            if (!message.attachments || !message.attachments.some(a => a.type === 'video')) return false;
            break;
          case 'link':
            if (!message.content || !/(https?:\/\/[^\s]+)/i.test(message.content)) return false;
            break;
          case 'reaction':
            if (!message.reactions || message.reactions.length === 0) return false;
            break;
        }
      }
    }
    
    // sentiment: operator
    if (operators.sentiment) {
      if (message.sentiment !== operators.sentiment.toLowerCase()) {
        return false;
      }
    }
    
    // priority: operator
    if (operators.priority) {
      if (message.priority !== operators.priority.toLowerCase()) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if message matches date range
   */
  matchesDateRange(dateString, range) {
    if (range === 'all') return true;
    
    try {
      const messageDate = new Date(dateString);
      const now = new Date();
      const diffInMs = now - messageDate;
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      switch (range) {
        case 'today':
          return diffInDays < 1;
        case 'week':
          return diffInDays < 7;
        case 'month':
          return diffInDays < 30;
        case 'year':
          return diffInDays < 365;
        default:
          return true;
      }
    } catch (e) {
      console.warn('Invalid date for filtering', dateString);
      return true;
    }
  }

  /**
   * Sort search results by relevance
   */
  sortResults(results, terms) {
    if (!terms) {
      // Sort by date if no search terms
      return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    // Sort by relevance score
    return results.sort((a, b) => {
      const scoreB = this.calculateRelevanceScore(b, terms);
      const scoreA = this.calculateRelevanceScore(a, terms);
      return scoreB - scoreA || new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  /**
   * Calculate relevance score for a message
   */
  calculateRelevanceScore(message, terms) {
    let score = 0;
    const lowerTerms = terms.toLowerCase();
    
    // Content match (highest weight)
    if (message.content) {
      const content = message.content.toLowerCase();
      if (content.includes(lowerTerms)) {
        score += 10;
        // Exact match gets higher score
        if (content === lowerTerms) {
          score += 20;
        }
      }
    }
    
    // Sender match (medium weight)
    if (message.sender) {
      if (message.sender.name && message.sender.name.toLowerCase().includes(lowerTerms)) {
        score += 5;
      }
      if (message.sender.username && message.sender.username.toLowerCase().includes(lowerTerms)) {
        score += 5;
      }
    }
    
    // Attachment match (low weight)
    if (message.attachments && message.attachments.length > 0) {
      const attachmentMatch = message.attachments.some(att => 
        att.filename && att.filename.toLowerCase().includes(lowerTerms)
      );
      if (attachmentMatch) {
        score += 2;
      }
    }
    
    // Recent messages get a boost
    const messageDate = new Date(message.createdAt);
    const hoursAgo = (Date.now() - messageDate) / (1000 * 60 * 60);
    if (hoursAgo < 24) {
      score += 1; // Small boost for recent messages
    }
    
    return score;
  }

  /**
   * Generate cache key for search results
   */
  generateCacheKey(query, filters) {
    return `${query}_${JSON.stringify(filters)}`;
  }

  /**
   * Clear search cache
   */
  clearCache() {
    this.searchCache.clear();
    console.log('🧹 Search cache cleared');
  }

  /**
   * Get search metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.searchCache.size,
      cacheHitRate: this.metrics.searchesPerformed > 0 
        ? (this.metrics.cacheHits / this.metrics.searchesPerformed * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Highlight search terms in text
   */
  highlightText(text, terms) {
    if (!text || !terms) return text;
    
    // Escape special regex characters
    const escapedTerms = terms.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerms})`, 'gi');
    
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600 rounded px-0.5">$1</mark>');
  }
}

// Create singleton instance
const enhancedSearchService = new EnhancedSearchService();

export default enhancedSearchService;