"use client";

// Conversation Management Utilities for AI Assistant
export class ConversationManager {
  constructor() {
    this.storageKey = 'ai_assistant_conversations';
    this.currentConversationKey = 'ai_assistant_current';
  }

  // Save conversations to localStorage
  saveConversations(conversations) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  // Load conversations from localStorage
  loadConversations() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const conversations = JSON.parse(saved);
        // Convert date strings back to Date objects
        return conversations.map(conv => ({
          ...conv,
          lastActive: new Date(conv.lastActive),
          messages: conv.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
    return null;
  }

  // Save current conversation ID
  saveCurrentConversation(conversationId) {
    try {
      localStorage.setItem(this.currentConversationKey, conversationId.toString());
    } catch (error) {
      console.error('Failed to save current conversation:', error);
    }
  }

  // Load current conversation ID
  loadCurrentConversation() {
    try {
      const saved = localStorage.getItem(this.currentConversationKey);
      return saved ? parseInt(saved, 10) : null;
    } catch (error) {
      console.error('Failed to load current conversation:', error);
      return null;
    }
  }

  // Create a new conversation
  createConversation(title = 'New Conversation') {
    return {
      id: Date.now(),
      title: title,
      messages: [{
        id: Date.now(),
        type: 'ai',
        content: "Hello! I'm your AI assistant. How can I help you today?",
        timestamp: new Date(),
        isMarkdown: false
      }],
      lastActive: new Date(),
      createdAt: new Date()
    };
  }

  // Update conversation title based on first user message
  generateConversationTitle(firstUserMessage) {
    const message = firstUserMessage.toLowerCase();
    
    // Extract key topics for title
    if (message.includes('code') || message.includes('programming')) {
      return 'Code Help';
    } else if (message.includes('write') || message.includes('essay')) {
      return 'Writing Assistance';
    } else if (message.includes('data') || message.includes('analysis')) {
      return 'Data Analysis';
    } else if (message.includes('plan') || message.includes('strategy')) {
      return 'Planning & Strategy';
    } else if (message.includes('learn') || message.includes('explain')) {
      return 'Learning & Explanation';
    } else {
      // Use first few words of the message
      const words = firstUserMessage.split(' ').slice(0, 3).join(' ');
      return words.length > 20 ? words.substring(0, 20) + '...' : words;
    }
  }

  // Export conversation as markdown
  exportConversationAsMarkdown(conversation) {
    let markdown = `# ${conversation.title}\n\n`;
    markdown += `*Conversation started: ${conversation.createdAt.toLocaleDateString()}*\n\n`;
    markdown += `---\n\n`;

    conversation.messages.forEach(message => {
      const sender = message.type === 'ai' ? '🤖 AI Assistant' : '👤 User';
      const time = message.timestamp.toLocaleTimeString();
      
      markdown += `## ${sender} - ${time}\n\n`;
      markdown += `${message.content}\n\n`;
      markdown += `---\n\n`;
    });

    return markdown;
  }

  // Export conversation as JSON
  exportConversationAsJSON(conversation) {
    return JSON.stringify(conversation, null, 2);
  }

  // Search through conversations
  searchConversations(conversations, query) {
    const searchTerm = query.toLowerCase();
    
    return conversations.filter(conv => {
      // Search in conversation title
      if (conv.title.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Search in message content
      return conv.messages.some(msg => 
        msg.content.toLowerCase().includes(searchTerm)
      );
    });
  }

  // Get conversation statistics
  getConversationStats(conversation) {
    const messageCount = conversation.messages.length;
    const userMessages = conversation.messages.filter(msg => msg.type === 'user').length;
    const aiMessages = conversation.messages.filter(msg => msg.type === 'ai').length;
    const totalWords = conversation.messages.reduce((total, msg) => {
      return total + msg.content.split(' ').length;
    }, 0);

    return {
      messageCount,
      userMessages,
      aiMessages,
      totalWords,
      duration: conversation.lastActive - conversation.createdAt
    };
  }

  // Clean old conversations (keep only last 50)
  cleanOldConversations(conversations) {
    if (conversations.length <= 50) return conversations;
    
    // Sort by last active time and keep the most recent 50
    return conversations
      .sort((a, b) => b.lastActive - a.lastActive)
      .slice(0, 50);
  }

  // Backup conversations to file
  backupConversations(conversations) {
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      conversations: conversations
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-assistant-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Restore conversations from backup
  async restoreConversations(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          
          if (backup.version && backup.conversations) {
            // Convert date strings back to Date objects
            const conversations = backup.conversations.map(conv => ({
              ...conv,
              lastActive: new Date(conv.lastActive),
              createdAt: new Date(conv.createdAt),
              messages: conv.messages.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }))
            }));
            
            resolve(conversations);
          } else {
            reject(new Error('Invalid backup file format'));
          }
        } catch (error) {
          reject(new Error('Failed to parse backup file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read backup file'));
      reader.readAsText(file);
    });
  }
}

// Export singleton instance
export const conversationManager = new ConversationManager();
