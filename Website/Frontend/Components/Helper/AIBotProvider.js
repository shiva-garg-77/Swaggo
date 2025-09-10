'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BehaviorSubject } from 'rxjs';

const AIBotContext = createContext();

// AI Bot personalities and configurations
const BOT_PERSONALITIES = {
  assistant: {
    name: 'Assistant',
    description: 'Helpful and professional assistant',
    avatar: '🤖',
    color: 'blue',
    systemPrompt: 'You are a helpful, accurate, and professional assistant.',
    capabilities: ['text', 'analysis', 'coding', 'math']
  },
  creative: {
    name: 'Creative Writer',
    description: 'Creative and imaginative storyteller',
    avatar: '✨',
    color: 'purple',
    systemPrompt: 'You are a creative writer who helps with storytelling, creative writing, and imaginative content.',
    capabilities: ['text', 'creative', 'storytelling']
  },
  developer: {
    name: 'Code Expert',
    description: 'Technical programming assistant',
    avatar: '💻',
    color: 'green',
    systemPrompt: 'You are an expert programmer who helps with coding, debugging, and technical solutions.',
    capabilities: ['coding', 'debugging', 'technical', 'architecture']
  },
  analyst: {
    name: 'Data Analyst',
    description: 'Data analysis and insights specialist',
    avatar: '📊',
    color: 'indigo',
    systemPrompt: 'You are a data analyst who helps interpret data, create insights, and explain complex information.',
    capabilities: ['analysis', 'data', 'visualization', 'math']
  }
};

// Message types and statuses
const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  ERROR: 'error',
  TYPING: 'typing'
};

const MESSAGE_TYPES = {
  TEXT: 'text',
  CODE: 'code',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system'
};

export const AIBotProvider = ({ children }) => {
  // Core state
  const [conversations, setConversations] = useState(new Map());
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentPersonality, setCurrentPersonality] = useState('assistant');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // Settings
  const [settings, setSettings] = useState({
    theme: 'auto',
    language: 'en',
    voiceEnabled: false,
    streamingEnabled: true,
    maxTokens: 2000,
    temperature: 0.7,
    autoSave: true,
    notifications: true
  });

  // Reactive streams for real-time updates
  const [messageStream] = useState(new BehaviorSubject(null));
  const [typingStream] = useState(new BehaviorSubject(false));

  // Initialize default conversation
  useEffect(() => {
    const defaultConversation = createConversation('Default Chat');
    setCurrentConversationId(defaultConversation.id);
  }, []);

  // Create new conversation
  const createConversation = useCallback((title = 'New Chat') => {
    const conversation = {
      id: generateId(),
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      personality: currentPersonality,
      settings: { ...settings }
    };
    
    setConversations(prev => new Map(prev).set(conversation.id, conversation));
    return conversation;
  }, [currentPersonality, settings]);

  // Send message
  const sendMessage = useCallback(async (content, type = MESSAGE_TYPES.TEXT, attachments = []) => {
    if (!currentConversationId) return;

    const message = {
      id: generateId(),
      content,
      type,
      attachments,
      sender: 'user',
      timestamp: new Date(),
      status: MESSAGE_STATUS.SENDING
    };

    // Add user message
    updateConversation(currentConversationId, (conv) => ({
      ...conv,
      messages: [...conv.messages, message],
      updatedAt: new Date()
    }));

    // Update message status
    setTimeout(() => {
      updateMessage(currentConversationId, message.id, { status: MESSAGE_STATUS.SENT });
    }, 100);

    // Simulate AI response
    setIsTyping(true);
    typingStream.next(true);

    try {
      // This would be your actual AI API call
      const response = await simulateAIResponse(content, currentPersonality);
      
      const aiMessage = {
        id: generateId(),
        content: response.content,
        type: response.type || MESSAGE_TYPES.TEXT,
        sender: 'ai',
        timestamp: new Date(),
        status: MESSAGE_STATUS.DELIVERED,
        personality: currentPersonality,
        metadata: response.metadata || {}
      };

      updateConversation(currentConversationId, (conv) => ({
        ...conv,
        messages: [...conv.messages, aiMessage],
        updatedAt: new Date()
      }));

      messageStream.next(aiMessage);
    } catch (error) {
      console.error('AI response error:', error);
      updateMessage(currentConversationId, message.id, { status: MESSAGE_STATUS.ERROR });
    } finally {
      setIsTyping(false);
      typingStream.next(false);
    }
  }, [currentConversationId, currentPersonality, messageStream, typingStream]);

  // Update conversation
  const updateConversation = useCallback((id, updater) => {
    setConversations(prev => {
      const newMap = new Map(prev);
      const conversation = newMap.get(id);
      if (conversation) {
        newMap.set(id, typeof updater === 'function' ? updater(conversation) : updater);
      }
      return newMap;
    });
  }, []);

  // Update message
  const updateMessage = useCallback((conversationId, messageId, updates) => {
    updateConversation(conversationId, (conv) => ({
      ...conv,
      messages: conv.messages.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    }));
  }, [updateConversation]);

  // Switch personality
  const switchPersonality = useCallback((personalityKey) => {
    if (BOT_PERSONALITIES[personalityKey]) {
      setCurrentPersonality(personalityKey);
      
      // Add system message about personality switch
      if (currentConversationId) {
        const systemMessage = {
          id: generateId(),
          content: `Switched to ${BOT_PERSONALITIES[personalityKey].name}`,
          type: MESSAGE_TYPES.SYSTEM,
          sender: 'system',
          timestamp: new Date(),
          status: MESSAGE_STATUS.DELIVERED
        };

        updateConversation(currentConversationId, (conv) => ({
          ...conv,
          messages: [...conv.messages, systemMessage],
          personality: personalityKey,
          updatedAt: new Date()
        }));
      }
    }
  }, [currentConversationId, updateConversation]);

  // Export conversation
  const exportConversation = useCallback((conversationId, format = 'json') => {
    const conversation = conversations.get(conversationId);
    if (!conversation) return null;

    const exportData = {
      ...conversation,
      exportedAt: new Date(),
      format
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'markdown') {
      return convertToMarkdown(exportData);
    }
    
    return exportData;
  }, [conversations]);

  // Clear conversation
  const clearConversation = useCallback((conversationId) => {
    updateConversation(conversationId, (conv) => ({
      ...conv,
      messages: [],
      updatedAt: new Date()
    }));
  }, [updateConversation]);

  // Delete conversation
  const deleteConversation = useCallback((conversationId) => {
    setConversations(prev => {
      const newMap = new Map(prev);
      newMap.delete(conversationId);
      return newMap;
    });
    
    if (currentConversationId === conversationId) {
      const remainingConversations = Array.from(conversations.keys())
        .filter(id => id !== conversationId);
      
      if (remainingConversations.length > 0) {
        setCurrentConversationId(remainingConversations[0]);
      } else {
        const newConversation = createConversation();
        setCurrentConversationId(newConversation.id);
      }
    }
  }, [conversations, currentConversationId, createConversation]);

  // Context value
  const value = {
    // State
    conversations,
    currentConversationId,
    currentConversation: conversations.get(currentConversationId),
    currentPersonality,
    isTyping,
    connectionStatus,
    settings,
    
    // Data
    personalities: BOT_PERSONALITIES,
    messageTypes: MESSAGE_TYPES,
    messageStatus: MESSAGE_STATUS,
    
    // Streams
    messageStream,
    typingStream,
    
    // Actions
    createConversation,
    sendMessage,
    updateConversation,
    updateMessage,
    switchPersonality,
    exportConversation,
    clearConversation,
    deleteConversation,
    setCurrentConversationId,
    setSettings: (newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))
  };

  return (
    <AIBotContext.Provider value={value}>
      {children}
    </AIBotContext.Provider>
  );
};

// Custom hook to use AI Bot context
export const useAIBot = () => {
  const context = useContext(AIBotContext);
  if (!context) {
    throw new Error('useAIBot must be used within an AIBotProvider');
  }
  return context;
};

// Helper functions
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function simulateAIResponse(userMessage, personality) {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const persona = BOT_PERSONALITIES[personality];
  
  // Simple response simulation - replace with actual AI API
  const responses = {
    assistant: [
      "I'd be happy to help you with that. Let me provide a comprehensive response.",
      "That's an interesting question. Here's my analysis:",
      "I understand what you're looking for. Let me break this down:"
    ],
    creative: [
      "What an intriguing idea! Let me weave a story around this...",
      "Imagine this scenario unfolding in a world where...",
      "Your creativity sparks my imagination! Here's what I envision:"
    ],
    developer: [
      "From a technical perspective, here's how we can approach this:",
      "Let me analyze this code problem and provide a solution:",
      "Here's the optimal implementation strategy:"
    ],
    analyst: [
      "Based on the data patterns, I can see that...",
      "Let me break down these insights for you:",
      "The analysis reveals several key trends:"
    ]
  };

  const personalityResponses = responses[personality] || responses.assistant;
  const randomResponse = personalityResponses[Math.floor(Math.random() * personalityResponses.length)];

  return {
    content: `${randomResponse} "${userMessage}"`,
    type: MESSAGE_TYPES.TEXT,
    metadata: {
      personality,
      processingTime: Math.random() * 2000,
      confidence: 0.8 + Math.random() * 0.2
    }
  };
}

function convertToMarkdown(conversation) {
  let markdown = `# ${conversation.title}\n\n`;
  markdown += `**Created:** ${conversation.createdAt.toISOString()}\n`;
  markdown += `**Personality:** ${BOT_PERSONALITIES[conversation.personality]?.name || 'Unknown'}\n\n`;
  
  conversation.messages.forEach(message => {
    const sender = message.sender === 'user' ? '**You**' : `**${BOT_PERSONALITIES[conversation.personality]?.name || 'AI'}**`;
    markdown += `${sender}: ${message.content}\n\n`;
  });
  
  return markdown;
}
