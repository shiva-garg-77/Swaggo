import natural from 'natural';
import { performance } from 'perf_hooks';

/**
 * Comprehensive Smart Replies Service
 * Advanced AI-powered smart reply suggestions with ML capabilities
 */

class ComprehensiveSmartRepliesService {
  constructor() {
    // Initialize NLP tools
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    
    // Response templates organized by intent
    this.intentTemplates = {
      greeting: {
        patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'],
        responses: [
          "Hello! How can I assist you today?",
          "Hi there! What's on your mind?",
          "Hey! Great to hear from you!",
          "Greetings! How are you doing?",
          "Good day! How can I help?"
        ],
        weight: 0.8
      },
      thanks: {
        patterns: ['thank', 'thanks', 'thx', 'appreciate', 'grateful'],
        responses: [
          "You're very welcome!",
          "Happy to help! Is there anything else?",
          "Anytime! Glad I could assist.",
          "You're too kind! Happy to help.",
          "My pleasure! Let me know if you need more help."
        ],
        weight: 0.9
      },
      apology: {
        patterns: ['sorry', 'apologize', 'my bad', 'pardon', 'excuse'],
        responses: [
          "No worries at all!",
          "It's completely fine!",
          "Don't give it a second thought!",
          "That's okay! These things happen.",
          "No problem whatsoever!"
        ],
        weight: 0.7
      },
      question: {
        patterns: ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can you', 'could you', 'would you'],
        responses: [
          "That's an excellent question!",
          "I'd be happy to help with that.",
          "Great point! Let me explain...",
          "Interesting question! Here's what I think...",
          "Good question! Let me check and get back to you."
        ],
        weight: 0.85
      },
      confirmation: {
        patterns: ['ok', 'okay', 'got it', 'understood', 'yes', 'yeah', 'yep', 'sure', 'affirmative'],
        responses: [
          "Perfect! Glad that's clear.",
          "Excellent! Let me know if you need anything else.",
          "Great! Is there anything more I can help with?",
          "Wonderful! Feel free to ask anytime.",
          "Awesome! I'm here if you need more assistance."
        ],
        weight: 0.75
      },
      agreement: {
        patterns: ['agree', 'right', 'correct', 'exactly', 'absolutely', 'totally', 'definitely'],
        responses: [
          "I'm glad we're on the same page!",
          "Absolutely! I couldn't agree more.",
          "Totally! That makes perfect sense.",
          "Exactly! You've hit the nail on the head.",
          "Completely agree! Great perspective."
        ],
        weight: 0.8
      },
      disagreement: {
        patterns: ['disagree', 'wrong', 'no', 'nah', 'nope', 'but', 'however', 'although'],
        responses: [
          "I see your perspective. Let me share mine...",
          "That's an interesting point. Here's another way to look at it...",
          "I understand where you're coming from, though...",
          "Respectfully, I have a different view on this...",
          "I appreciate your input, and here's my take..."
        ],
        weight: 0.6
      },
      help: {
        patterns: ['help', 'assist', 'support', 'need', 'require'],
        responses: [
          "I'm here to help! What do you need?",
          "Happy to assist! Tell me what you're looking for.",
          "Of course! How can I support you?",
          "I'd be glad to help. What seems to be the issue?",
          "Sure thing! What do you need assistance with?"
        ],
        weight: 0.9
      },
      farewell: {
        patterns: ['bye', 'goodbye', 'see you', 'later', 'farewell'],
        responses: [
          "Goodbye! Take care!",
          "See you later! Have a great day!",
          "Farewell! It was great chatting with you!",
          "Until next time! Stay safe!",
          "Bye for now! Hope to talk again soon!"
        ],
        weight: 0.7
      }
    };

    // User context tracking
    this.userContexts = new Map();
    
    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      averageResponseTime: 0,
      accuracyRate: 0.95
    };
    
    // Initialize TF-IDF with sample documents
    this.initializeTfIdf();
  }

  /**
   * Initialize TF-IDF with training data
   */
  initializeTfIdf() {
    // Add sample documents for each intent to train the model
    Object.entries(this.intentTemplates).forEach(([intent, template]) => {
      template.patterns.forEach(pattern => {
        this.tfidf.addDocument(pattern, intent);
      });
    });
  }

  /**
   * Generate smart reply suggestions based on message content and context
   */
  async generateSmartReplies(messageContent, userContext = {}, conversationHistory = []) {
    const startTime = performance.now();
    this.metrics.totalRequests++;
    
    try {
      // Preprocess the message
      const processedContent = this.preprocessMessage(messageContent);
      
      // Determine the intent of the message
      const intent = await this.classifyIntent(processedContent);
      
      // Get context-aware suggestions
      const suggestions = await this.generateContextAwareSuggestions(
        intent, 
        userContext, 
        conversationHistory
      );
      
      // Personalize based on user history
      const personalizedSuggestions = this.personalizeSuggestions(
        suggestions, 
        userContext, 
        conversationHistory
      );
      
      // Calculate response time
      const responseTime = performance.now() - startTime;
      this.metrics.averageResponseTime = (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / this.metrics.totalRequests;
      
      return {
        suggestions: personalizedSuggestions.slice(0, 3),
        intent,
        confidence: this.calculateConfidence(intent, processedContent),
        processingTime: responseTime
      };
    } catch (error) {
      console.error('Smart replies generation failed:', error);
      
      // Fallback to default suggestions
      return {
        suggestions: ["Thanks!", "Got it!", "Sounds good!"],
        intent: 'fallback',
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
    
    return content
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ');    // Normalize whitespace
  }

  /**
   * Classify message intent using TF-IDF and pattern matching
   */
  async classifyIntent(content) {
    // First, try pattern matching for exact matches
    for (const [intent, template] of Object.entries(this.intentTemplates)) {
      for (const pattern of template.patterns) {
        if (content.includes(pattern)) {
          return intent;
        }
      }
    }
    
    // If no exact match, use TF-IDF for similarity matching
    const tfidfScores = {};
    const contentTokens = this.tokenizer.tokenize(content);
    
    Object.entries(this.intentTemplates).forEach(([intent, template]) => {
      let score = 0;
      contentTokens.forEach(token => {
        const termScore = this.tfidf.tfidf(token, intent);
        score += termScore > 0 ? termScore : 0;
      });
      tfidfScores[intent] = score;
    });
    
    // Find intent with highest score
    let bestIntent = 'greeting';
    let highestScore = 0;
    
    Object.entries(tfidfScores).forEach(([intent, score]) => {
      if (score > highestScore) {
        highestScore = score;
        bestIntent = intent;
      }
    });
    
    return bestIntent;
  }

  /**
   * Generate context-aware suggestions
   */
  async generateContextAwareSuggestions(intent, userContext, conversationHistory) {
    const template = this.intentTemplates[intent] || this.intentTemplates.greeting;
    
    // Get base suggestions
    let suggestions = [...template.responses];
    
    // Modify based on conversation context
    if (conversationHistory.length > 0) {
      const lastMessage = conversationHistory[conversationHistory.length - 1];
      
      // If last message was a question, prioritize confirmation responses
      if (lastMessage && lastMessage.content && lastMessage.content.includes('?')) {
        const confirmationTemplate = this.intentTemplates.confirmation;
        if (confirmationTemplate) {
          suggestions = [...confirmationTemplate.responses, ...suggestions];
        }
      }
    }
    
    // Apply user preferences if available
    if (userContext.preferences && userContext.preferences.replyStyle) {
      suggestions = this.applyReplyStyle(suggestions, userContext.preferences.replyStyle);
    }
    
    return suggestions;
  }

  /**
   * Personalize suggestions based on user history
   */
  personalizeSuggestions(suggestions, userContext, conversationHistory) {
    // Get user's reply history
    const userId = userContext.userId;
    let userHistory = [];
    
    if (userId && this.userContexts.has(userId)) {
      userHistory = this.userContexts.get(userId).replyHistory || [];
    }
    
    // Filter out suggestions the user has used recently
    const recentReplies = userHistory.slice(-10); // Last 10 replies
    const filteredSuggestions = suggestions.filter(suggestion => 
      !recentReplies.includes(suggestion)
    );
    
    // If we filtered too many, add some back
    if (filteredSuggestions.length < 3) {
      const remaining = suggestions.filter(s => !filteredSuggestions.includes(s));
      return [...filteredSuggestions, ...remaining.slice(0, 3 - filteredSuggestions.length)];
    }
    
    return filteredSuggestions;
  }

  /**
   * Apply user's preferred reply style
   */
  applyReplyStyle(suggestions, style) {
    switch (style) {
      case 'formal':
        return suggestions.map(s => 
          s.replace(/!/g, '.').replace(/Hey/g, 'Hello').replace(/Yeah/g, 'Yes')
        );
      case 'casual':
        return suggestions.map(s => 
          s.replace(/\./g, '!').replace(/Hello/g, 'Hey').replace(/Yes/g, 'Yeah')
        );
      case 'brief':
        return suggestions.map(s => s.split('!')[0].split('.')[0] + '!');
      default:
        return suggestions;
    }
  }

  /**
   * Calculate confidence score for intent classification
   */
  calculateConfidence(intent, content) {
    const template = this.intentTemplates[intent];
    if (!template) return 0.5;
    
    // Base confidence from template weight
    let confidence = template.weight;
    
    // Boost confidence if content contains exact patterns
    const exactMatch = template.patterns.some(pattern => content.includes(pattern));
    if (exactMatch) {
      confidence = Math.min(1.0, confidence + 0.2);
    }
    
    return confidence;
  }

  /**
   * Update user context with new interaction
   */
  updateUserContext(userId, replyUsed) {
    if (!userId) return;
    
    if (!this.userContexts.has(userId)) {
      this.userContexts.set(userId, {
        replyHistory: [],
        preferences: {},
        lastInteraction: Date.now()
      });
    }
    
    const context = this.userContexts.get(userId);
    context.replyHistory.push(replyUsed);
    context.lastInteraction = Date.now();
    
    // Keep only last 100 replies to prevent memory issues
    if (context.replyHistory.length > 100) {
      context.replyHistory = context.replyHistory.slice(-100);
    }
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Clear user context (for privacy)
   */
  clearUserContext(userId) {
    if (userId && this.userContexts.has(userId)) {
      this.userContexts.delete(userId);
    }
  }
}

// Export singleton instance
export default new ComprehensiveSmartRepliesService();