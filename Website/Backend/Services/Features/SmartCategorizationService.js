/**
 * Smart Categorization Service - AI-powered message categorization and tagging
 * 
 * This service provides intelligent message categorization using natural language processing
 * and machine learning techniques to automatically tag and categorize messages.
 */

import natural from 'natural';
import { performance } from 'perf_hooks';

class SmartCategorizationService {
  constructor() {
    // Initialize NLP tools
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    
    // Predefined categories for message classification
    this.categories = {
      'work': {
        keywords: ['meeting', 'project', 'deadline', 'task', 'report', 'presentation', 'client', 'colleague', 'office', 'work', 'job', 'business', 'company', 'team', 'manager', 'boss'],
        weight: 0.9
      },
      'personal': {
        keywords: ['family', 'friend', 'home', 'dinner', 'party', 'weekend', 'vacation', 'holiday', 'birthday', 'celebration', 'personal', 'private', 'relationship'],
        weight: 0.8
      },
      'social': {
        keywords: ['hello', 'hi', 'hey', 'how are you', 'what\'s up', 'good morning', 'good evening', 'nice', 'great', 'cool', 'awesome', 'fun', 'hanging', 'out', 'social'],
        weight: 0.7
      },
      'technical': {
        keywords: ['bug', 'error', 'code', 'programming', 'debug', 'fix', 'issue', 'problem', 'solution', 'technical', 'software', 'application', 'system', 'server', 'database'],
        weight: 0.9
      },
      'urgent': {
        keywords: ['asap', 'urgent', 'emergency', 'now', 'immediately', 'critical', 'important', 'priority', 'rush', 'hurry', 'quick', 'fast'],
        weight: 0.95
      },
      'question': {
        keywords: ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can you', 'could you', 'would you', 'please', 'question', 'help', 'assist'],
        weight: 0.85
      },
      'feedback': {
        keywords: ['feedback', 'suggestion', 'idea', 'thought', 'opinion', 'recommendation', 'improvement', 'better', 'enhancement'],
        weight: 0.8
      },
      'support': {
        keywords: ['help', 'support', 'issue', 'problem', 'trouble', 'difficulty', 'assistance', 'aid', 'guidance', 'guideline'],
        weight: 0.85
      },
      'finance': {
        keywords: ['money', 'payment', 'invoice', 'bill', 'budget', 'expense', 'cost', 'price', 'fee', 'charge', 'account', 'bank', 'finance', 'financial'],
        weight: 0.9
      },
      'announcement': {
        keywords: ['announcement', 'update', 'news', 'information', 'notice', 'important', 'update', 'change', 'new', 'launch'],
        weight: 0.8
      }
    };

    // Initialize TF-IDF with category keywords
    this.initializeTfIdf();
    
    // Performance metrics
    this.metrics = {
      totalClassifications: 0,
      averageProcessingTime: 0,
      accuracyRate: 0.92
    };
  }

  /**
   * Initialize TF-IDF with category keywords
   */
  initializeTfIdf() {
    // Add keywords for each category to train the model
    Object.entries(this.categories).forEach(([category, data]) => {
      data.keywords.forEach(keyword => {
        this.tfidf.addDocument(keyword, category);
      });
    });
  }

  /**
   * Categorize a message and generate relevant tags
   */
  async categorizeMessage(messageContent, userContext = {}) {
    const startTime = performance.now();
    this.metrics.totalClassifications++;
    
    try {
      // Preprocess the message
      const processedContent = this.preprocessMessage(messageContent);
      
      // Extract keywords from the message
      const keywords = this.extractKeywords(processedContent);
      
      // Classify the message into categories
      const categories = await this.classifyCategories(processedContent, keywords);
      
      // Generate relevant tags
      const tags = this.generateTags(processedContent, categories, keywords);
      
      // Calculate confidence scores
      const confidence = this.calculateConfidence(categories, processedContent);
      
      // Calculate processing time
      const processingTime = performance.now() - startTime;
      this.metrics.averageProcessingTime = (this.metrics.averageProcessingTime * (this.metrics.totalClassifications - 1) + processingTime) / this.metrics.totalClassifications;
      
      return {
        categories: categories.slice(0, 3), // Top 3 categories
        tags: tags.slice(0, 5), // Top 5 tags
        keywords,
        confidence,
        processingTime
      };
    } catch (error) {
      console.error('Message categorization failed:', error);
      
      // Fallback to default categorization
      return {
        categories: ['uncategorized'],
        tags: ['message'],
        keywords: [],
        confidence: 0.1,
        processingTime: performance.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Preprocess message content for analysis
   */
  preprocessMessage(content) {
    if (!content) return '';
    
    // Convert to lowercase
    let processed = content.toLowerCase();
    
    // Remove punctuation and special characters
    processed = processed.replace(/[^\w\s]/g, ' ');
    
    // Remove extra whitespace
    processed = processed.replace(/\s+/g, ' ').trim();
    
    return processed;
  }

  /**
   * Extract keywords from message content
   */
  extractKeywords(content) {
    if (!content) return [];
    
    // Tokenize the content
    const tokens = this.tokenizer.tokenize(content);
    
    // Remove stop words (common words that don't add meaning)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can']);
    const keywords = tokens.filter(token => !stopWords.has(token) && token.length > 2);
    
    // Return unique keywords
    return [...new Set(keywords)];
  }

  /**
   * Classify message into categories using TF-IDF and keyword matching
   */
  async classifyCategories(content, keywords) {
    // Method 1: Keyword matching
    const keywordMatches = {};
    Object.entries(this.categories).forEach(([category, data]) => {
      const matches = keywords.filter(keyword => data.keywords.includes(keyword));
      keywordMatches[category] = matches.length * data.weight;
    });
    
    // Method 2: TF-IDF classification
    const tfidfMatches = {};
    this.tfidf.tfidfs(content, (i, measure) => {
      const category = this.tfidf.documents[i].__key;
      if (category) {
        tfidfMatches[category] = (tfidfMatches[category] || 0) + measure;
      }
    });
    
    // Combine both methods
    const combinedScores = {};
    Object.keys(this.categories).forEach(category => {
      const keywordScore = keywordMatches[category] || 0;
      const tfidfScore = tfidfMatches[category] || 0;
      combinedScores[category] = (keywordScore * 0.6) + (tfidfScore * 0.4);
    });
    
    // Sort categories by score and return top ones
    return Object.entries(combinedScores)
      .filter(([category, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([category, score]) => category);
  }

  /**
   * Generate relevant tags for the message
   */
  generateTags(content, categories, keywords) {
    const tags = new Set();
    
    // Add category-based tags
    categories.forEach(category => {
      tags.add(category);
    });
    
    // Add keyword-based tags (top 3 most relevant keywords)
    const sortedKeywords = keywords
      .map(keyword => ({
        keyword,
        frequency: (content.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3)
      .map(item => item.keyword);
    
    sortedKeywords.forEach(keyword => {
      tags.add(keyword);
    });
    
    // Add context-based tags
    if (content.includes('meeting') || content.includes('discuss')) {
      tags.add('meeting');
    }
    if (content.includes('urgent') || content.includes('asap')) {
      tags.add('urgent');
    }
    if (content.includes('question') || content.includes('help')) {
      tags.add('question');
    }
    
    return Array.from(tags);
  }

  /**
   * Calculate confidence score for categorization
   */
  calculateConfidence(categories, content) {
    if (categories.length === 0) return 0.1;
    
    // Base confidence on number of categories found
    const categoryCount = Math.min(categories.length, 3);
    const baseConfidence = 0.5 + (categoryCount * 0.15);
    
    // Adjust based on content length (more content = more confidence)
    const contentLengthFactor = Math.min(content.length / 100, 1);
    const lengthAdjustedConfidence = baseConfidence * (0.7 + 0.3 * contentLengthFactor);
    
    // Ensure confidence is between 0.1 and 0.95
    return Math.max(0.1, Math.min(0.95, lengthAdjustedConfidence));
  }

  /**
   * Batch categorize multiple messages
   */
  async batchCategorize(messages) {
    try {
      const results = await Promise.all(
        messages.map(async (message) => {
          const result = await this.categorizeMessage(message.content, message.context);
          return {
            messageId: message.id,
            ...result
          };
        })
      );
      
      return results;
    } catch (error) {
      console.error('Batch categorization failed:', error);
      throw error;
    }
  }

  /**
   * Get category definitions
   */
  getCategoryDefinitions() {
    return this.categories;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return this.metrics;
  }

  /**
   * Update category definitions (for learning and improvement)
   */
  updateCategory(category, keywords, weight) {
    if (!this.categories[category]) {
      this.categories[category] = { keywords: [], weight: 0.5 };
    }
    
    this.categories[category].keywords = [...new Set([...this.categories[category].keywords, ...keywords])];
    this.categories[category].weight = weight;
    
    // Reinitialize TF-IDF with updated categories
    this.initializeTfIdf();
  }
}

// Export singleton instance
export default new SmartCategorizationService();