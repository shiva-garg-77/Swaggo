'use client';

import { BehaviorSubject, fromEvent, merge } from 'rxjs';
import { filter, debounceTime, retry, catchError } from 'rxjs/operators';

// AI Provider configurations
const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
    maxTokens: 4096,
    streaming: true,
    requiresKey: true
  },
  anthropic: {
    name: 'Anthropic',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    maxTokens: 4096,
    streaming: true,
    requiresKey: true
  },
  local: {
    name: 'Local Model',
    apiUrl: 'http://localhost:1234/v1/chat/completions',
    models: ['local-model'],
    maxTokens: 2048,
    streaming: true,
    requiresKey: false
  },
  mock: {
    name: 'Mock AI',
    apiUrl: null,
    models: ['mock-gpt'],
    maxTokens: 2048,
    streaming: true,
    requiresKey: false
  }
};

class AIResponseHandler {
  constructor() {
    this.currentProvider = 'mock';
    this.apiKey = null;
    this.isConnected = false;
    this.requestQueue = [];
    this.retryCount = 3;
    this.timeout = 30000; // 30 seconds
    this.streamingEnabled = true;
    
    // Observable streams
    this.connectionStatus$ = new BehaviorSubject('disconnected');
    this.response$ = new BehaviorSubject(null);
    this.error$ = new BehaviorSubject(null);
    this.typing$ = new BehaviorSubject(false);
    
    // Rate limiting
    this.rateLimitWindow = 60000; // 1 minute
    this.maxRequestsPerWindow = 50;
    this.requestHistory = [];
    
    this.initializeProvider();
  }

  // Initialize AI provider
  initializeProvider() {
    const provider = AI_PROVIDERS[this.currentProvider];
    
    if (provider.requiresKey && !this.apiKey) {
      this.connectionStatus$.next('missing-key');
      return;
    }
    
    this.connectionStatus$.next('connecting');
    
    // Test connection
    this.testConnection()
      .then(() => {
        this.isConnected = true;
        this.connectionStatus$.next('connected');
      })
      .catch((error) => {
        console.error('AI provider connection failed:', error);
        this.connectionStatus$.next('error');
        this.error$.next({ type: 'connection', message: error.message });
      });
  }

  // Test AI provider connection
  async testConnection() {
    if (this.currentProvider === 'mock') {
      // Mock connection is always successful
      return Promise.resolve();
    }
    
    const provider = AI_PROVIDERS[this.currentProvider];
    
    try {
      const response = await fetch(provider.apiUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(this.buildTestPayload()),
        signal: AbortSignal.timeout(5000) // 5 second timeout for connection test
      });
      
      if (!response.ok) {
        throw new Error(`Connection test failed: ${response.status} ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  // Set AI provider
  setProvider(providerKey, apiKey = null) {
    if (!AI_PROVIDERS[providerKey]) {
      throw new Error(`Unknown AI provider: ${providerKey}`);
    }
    
    this.currentProvider = providerKey;
    this.apiKey = apiKey;
    this.initializeProvider();
  }

  // Get request headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey) {
      switch (this.currentProvider) {
        case 'openai':
          headers['Authorization'] = `Bearer ${this.apiKey}`;
          break;
        case 'anthropic':
          headers['x-api-key'] = this.apiKey;
          headers['anthropic-version'] = '2023-06-01';
          break;
      }
    }
    
    return headers;
  }

  // Build test payload
  buildTestPayload() {
    const provider = AI_PROVIDERS[this.currentProvider];
    
    switch (this.currentProvider) {
      case 'openai':
      case 'local':
        return {
          model: provider.models[0],
          messages: [{ role: 'user', content: 'Test connection' }],
          max_tokens: 10,
          stream: false
        };
      case 'anthropic':
        return {
          model: provider.models[0],
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Test connection' }]
        };
      default:
        return {};
    }
  }

  // Check rate limits
  checkRateLimit() {
    const now = Date.now();
    this.requestHistory = this.requestHistory.filter(
      timestamp => now - timestamp < this.rateLimitWindow
    );
    
    return this.requestHistory.length < this.maxRequestsPerWindow;
  }

  // Send message to AI
  async sendMessage(messages, options = {}) {
    if (!this.isConnected && this.currentProvider !== 'mock') {
      throw new Error('AI provider not connected');
    }
    
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please wait before sending more messages.');
    }
    
    const provider = AI_PROVIDERS[this.currentProvider];
    const requestId = this.generateRequestId();
    
    // Add to request history
    this.requestHistory.push(Date.now());
    
    // Set typing indicator
    this.typing$.next(true);
    
    const requestOptions = {
      model: options.model || provider.models[0],
      temperature: options.temperature || 0.7,
      maxTokens: Math.min(options.maxTokens || 1000, provider.maxTokens),
      streaming: this.streamingEnabled && provider.streaming && options.streaming !== false,
      ...options
    };
    
    try {
      if (this.currentProvider === 'mock') {
        return await this.handleMockResponse(messages, requestOptions);
      } else if (requestOptions.streaming) {
        return await this.handleStreamingResponse(messages, requestOptions, requestId);
      } else {
        return await this.handleStandardResponse(messages, requestOptions, requestId);
      }
    } catch (error) {
      this.error$.next({
        type: 'request',
        message: error.message,
        requestId,
        timestamp: new Date()
      });
      throw error;
    } finally {
      this.typing$.next(false);
    }
  }

  // Handle mock AI responses
  async handleMockResponse(messages, options) {
    const delay = 1000 + Math.random() * 3000; // 1-4 seconds
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const lastMessage = messages[messages.length - 1];
    const responses = this.getMockResponses(lastMessage.content, options);
    
    const response = {
      id: this.generateRequestId(),
      content: responses[Math.floor(Math.random() * responses.length)],
      role: 'assistant',
      timestamp: new Date(),
      metadata: {
        model: 'mock-gpt',
        tokens: Math.floor(Math.random() * 100) + 50,
        confidence: 0.8 + Math.random() * 0.2,
        processingTime: delay
      }
    };
    
    this.response$.next(response);
    return response;
  }

  // Get mock responses based on input
  getMockResponses(input, options) {
    const inputLower = input.toLowerCase();
    
    if (inputLower.includes('code') || inputLower.includes('program')) {
      return [
        `Here's a solution for your coding question:\n\n\`\`\`javascript\n// Example code\nfunction solution() {\n  return \"This is a mock code response\";\n}\n\`\`\`\n\nThis approach should work well for your needs.`,
        "Let me help you with that code problem. Here's what I recommend:\n\n```python\ndef example_function():\n    return 'Mock response'\n```",
        "I'll provide a coding solution:\n\n```jsx\nconst Component = () => {\n  return <div>Mock AI Response</div>;\n};\n```"
      ];
    }
    
    if (inputLower.includes('data') || inputLower.includes('analysis')) {
      return [
        "Based on the data patterns I'm analyzing, here are the key insights:\n\n1. **Trend Analysis**: The data shows a clear upward trajectory\n2. **Key Metrics**: Performance indicators are positive\n3. **Recommendations**: Consider scaling based on current growth",
        "Let me break down the data analysis:\n\n📊 **Statistical Overview**\n- Sample size: Adequate for reliable conclusions\n- Confidence level: 95%\n- Key correlations: Strong positive trends\n\n**Actionable Insights**: The data suggests optimizing for performance improvements."
      ];
    }
    
    if (inputLower.includes('creative') || inputLower.includes('story')) {
      return [
        "✨ What an inspiring prompt! Here's a creative response:\n\nOnce upon a time, in a world where AI and humans collaborated seamlessly, there lived a curious developer who discovered that the best solutions come from the perfect blend of technology and imagination...",
        "🎨 Let me paint a picture with words:\n\nImagine a digital canvas where every pixel tells a story, where algorithms dance with creativity, and where your ideas become the brushstrokes of innovation...",
        "Here's a creative take on your idea:\n\n*The future whispers through lines of code,*\n*Each function a verse, each variable a note.*\n*In this symphony of logic and art,*\n*We craft tomorrow from today's start.*"
      ];
    }
    
    // Default responses
    return [
      `I understand you're asking about "${input}". Here's my analysis:\n\nThis is an interesting topic that requires careful consideration. Based on the information provided, I recommend exploring multiple approaches to find the best solution for your specific needs.`,
      `Thank you for your question about "${input}". Let me provide a comprehensive response:\n\n• **Key Points**: The main aspects to consider\n• **Analysis**: Breaking down the components\n• **Recommendations**: Actionable next steps\n\nWould you like me to elaborate on any of these areas?`,
      `Great question! Regarding "${input}", here are my thoughts:\n\nThe best approach would be to start with understanding the fundamentals, then build upon that knowledge systematically. This ensures a solid foundation for more advanced concepts.`,
      `I'd be happy to help with "${input}". Here's what I recommend:\n\n1. **First**: Assess the current situation\n2. **Then**: Identify key objectives\n3. **Finally**: Implement the solution step by step\n\nThis structured approach tends to yield the best results.`
    ];
  }

  // Handle streaming responses
  async handleStreamingResponse(messages, options, requestId) {
    const provider = AI_PROVIDERS[this.currentProvider];
    const payload = this.buildRequestPayload(messages, options, true);
    
    try {
      const response = await fetch(provider.apiUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let content = '';
      let metadata = {};
      
      while (reader) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              const delta = this.extractDeltaFromResponse(parsed, this.currentProvider);
              
              if (delta.content) {
                content += delta.content;
                
                // Emit partial response
                this.response$.next({
                  id: requestId,
                  content,
                  role: 'assistant',
                  partial: true,
                  timestamp: new Date(),
                  metadata: { ...metadata, streaming: true }
                });
              }
              
              if (delta.metadata) {
                metadata = { ...metadata, ...delta.metadata };
              }
            } catch (e) {
              console.warn('Failed to parse streaming chunk:', e);
            }
          }
        }
      }
      
      // Final response
      const finalResponse = {
        id: requestId,
        content,
        role: 'assistant',
        partial: false,
        timestamp: new Date(),
        metadata: {
          ...metadata,
          model: options.model,
          tokens: content.length / 4, // Rough estimate
          streaming: true
        }
      };
      
      this.response$.next(finalResponse);
      return finalResponse;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  }

  // Handle standard (non-streaming) responses
  async handleStandardResponse(messages, options, requestId) {
    const provider = AI_PROVIDERS[this.currentProvider];
    const payload = this.buildRequestPayload(messages, options, false);
    
    try {
      const response = await fetch(provider.apiUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      const content = this.extractContentFromResponse(data, this.currentProvider);
      
      const aiResponse = {
        id: requestId,
        content,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          model: options.model,
          tokens: data.usage?.total_tokens || content.length / 4,
          streaming: false,
          ...this.extractMetadataFromResponse(data, this.currentProvider)
        }
      };
      
      this.response$.next(aiResponse);
      return aiResponse;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  }

  // Build request payload based on provider
  buildRequestPayload(messages, options, streaming) {
    const provider = AI_PROVIDERS[this.currentProvider];
    
    switch (this.currentProvider) {
      case 'openai':
      case 'local':
        return {
          model: options.model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          max_tokens: options.maxTokens,
          temperature: options.temperature,
          stream: streaming,
          ...(options.systemPrompt && {
            messages: [
              { role: 'system', content: options.systemPrompt },
              ...messages.map(msg => ({ role: msg.role, content: msg.content }))
            ]
          })
        };
      
      case 'anthropic':
        return {
          model: options.model,
          max_tokens: options.maxTokens,
          temperature: options.temperature,
          stream: streaming,
          system: options.systemPrompt || 'You are a helpful assistant.',
          messages: messages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          }))
        };
      
      default:
        return { messages, options, streaming };
    }
  }

  // Extract content from API response
  extractContentFromResponse(data, provider) {
    switch (provider) {
      case 'openai':
      case 'local':
        return data.choices?.[0]?.message?.content || '';
      case 'anthropic':
        return data.content?.[0]?.text || '';
      default:
        return data.content || '';
    }
  }

  // Extract delta from streaming response
  extractDeltaFromResponse(data, provider) {
    switch (provider) {
      case 'openai':
      case 'local':
        return {
          content: data.choices?.[0]?.delta?.content || '',
          metadata: data.choices?.[0]?.finish_reason ? { finishReason: data.choices[0].finish_reason } : {}
        };
      case 'anthropic':
        return {
          content: data.delta?.text || '',
          metadata: data.type === 'content_block_stop' ? { finishReason: 'stop' } : {}
        };
      default:
        return { content: data.content || '', metadata: {} };
    }
  }

  // Extract metadata from response
  extractMetadataFromResponse(data, provider) {
    const metadata = {};
    
    if (data.usage) {
      metadata.promptTokens = data.usage.prompt_tokens;
      metadata.completionTokens = data.usage.completion_tokens;
      metadata.totalTokens = data.usage.total_tokens;
    }
    
    if (data.model) {
      metadata.modelUsed = data.model;
    }
    
    return metadata;
  }

  // Generate unique request ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get available models for current provider
  getAvailableModels() {
    return AI_PROVIDERS[this.currentProvider]?.models || [];
  }

  // Get current provider info
  getProviderInfo() {
    return AI_PROVIDERS[this.currentProvider];
  }

  // Get all available providers
  getAvailableProviders() {
    return Object.entries(AI_PROVIDERS).map(([key, provider]) => ({
      key,
      ...provider
    }));
  }

  // Cancel ongoing request (if supported)
  cancelRequest(requestId) {
    // Implementation would depend on tracking active requests
    console.log(`Cancelling request ${requestId}`);
  }

  // Clean up resources
  destroy() {
    this.connectionStatus$.complete();
    this.response$.complete();
    this.error$.complete();
    this.typing$.complete();
  }
}

// Export singleton instance
export const aiResponseHandler = new AIResponseHandler();
export default AIResponseHandler;
