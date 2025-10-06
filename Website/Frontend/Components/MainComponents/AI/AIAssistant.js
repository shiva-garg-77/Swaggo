"use client";

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../Helper/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIAssistant() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your AI assistant. I'm here to help you with anything you need - from answering questions to helping with code, writing, analysis, and much more. What would you like to know?",
      timestamp: new Date(),
      isMarkdown: false
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState([
    { id: 1, title: 'New Conversation', messages: 1, lastActive: new Date() }
  ]);
  const [currentConversationId, setCurrentConversationId] = useState(1);
  const [showSidebar, setShowSidebar] = useState(true);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      isMarkdown: false
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    // Auto-resize textarea back to normal
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }

    try {
      // First, let's analyze the user's input for content moderation and tagging
      const analysisPromises = [
        // Content moderation
        fetch('http://localhost:5000/api/ai/moderate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: currentInput, content_id: `user_msg_${Date.now()}` })
        }),
        // Intelligent tagging
        fetch('http://localhost:5000/api/ai/generate-tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: currentInput, max_tags: 5 })
        }),
        // Sentiment analysis
        fetch('http://localhost:5000/api/text/sentiment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: currentInput })
        })
      ];

      const [moderationRes, tagsRes, sentimentRes] = await Promise.all(analysisPromises);
      const [moderation, tags, sentiment] = await Promise.all([
        moderationRes.json(),
        tagsRes.json(),
        sentimentRes.json()
      ]);

      // Generate AI response based on analysis
      let aiResponse = '';
      
      // Check if content needs moderation
      if (moderation.success && !moderation.moderation.is_safe) {
        aiResponse = `I notice your message contains some content that might need review. Let me help you rephrase that in a more constructive way. ${moderation.moderation.explanation}`;
      } else {
        // Generate contextual response based on tags and sentiment
        const detectedTags = tags.success ? tags.tags.map(tag => tag.tag) : [];
        const sentimentData = sentiment.success ? sentiment.sentiment : null;
        
        // Track user interaction for personalization
        const userId = 'demo_user_123'; // In real app, get from auth context
        if (detectedTags.length > 0) {
          fetch('http://localhost:5000/api/ai/personalize/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              content_tags: detectedTags,
              interaction_type: 'message',
              content_category: detectedTags[0]
            })
          }).catch(err => console.warn('Personalization update failed:', err));
        }

        // Generate intelligent response
        aiResponse = generateIntelligentResponse(currentInput, detectedTags, sentimentData);
      }

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date(),
        isMarkdown: aiResponse.includes('```') || aiResponse.includes('**') || aiResponse.includes('*'),
        analysis: {
          tags: tags.success ? tags.tags : [],
          sentiment: sentiment.success ? sentiment.sentiment : null,
          moderation: moderation.success ? moderation.moderation : null
        }
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    } catch (error) {
      console.error('AI processing error:', error);
      // Fallback to original response generation
      setTimeout(() => {
        const aiResponse = generateAIResponse(currentInput);
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: aiResponse,
          timestamp: new Date(),
          isMarkdown: aiResponse.includes('```') || aiResponse.includes('**') || aiResponse.includes('*')
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const generateIntelligentResponse = (userInput, tags = [], sentiment = null) => {
    const input = userInput.toLowerCase();
    
    // Use AI analysis to provide more contextual responses
    let contextPrefix = '';
    
    // Add sentiment-aware prefix
    if (sentiment) {
      if (sentiment.polarity > 0.3) {
        contextPrefix = "I can sense your positive energy! ";
      } else if (sentiment.polarity < -0.3) {
        contextPrefix = "I understand you might be facing some challenges. ";
      }
    }
    
    // Tag-based intelligent routing
    const tagCategories = tags.map(tag => tag.category).filter(Boolean);
    const topTags = tags.slice(0, 3).map(tag => tag.tag);
    
    // Technology-focused response
    if (tagCategories.includes('technology') || topTags.some(tag => ['ai', 'machine learning', 'programming', 'coding', 'software', 'development'].includes(tag))) {
      return contextPrefix + generateTechResponse(userInput, topTags);
    }
    
    // Business-focused response
    if (tagCategories.includes('business') || topTags.some(tag => ['startup', 'entrepreneur', 'marketing', 'strategy'].includes(tag))) {
      return contextPrefix + generateBusinessResponse(userInput, topTags);
    }
    
    // Education-focused response
    if (tagCategories.includes('education') || topTags.some(tag => ['learning', 'study', 'course', 'skill'].includes(tag))) {
      return contextPrefix + generateEducationResponse(userInput, topTags);
    }
    
    // Fallback to original response with context
    return contextPrefix + generateAIResponse(userInput);
  };
  
  const generateTechResponse = (userInput, tags) => {
    const techResponses = [
      `Great question about ${tags[0] || 'technology'}! Let me break this down from a technical perspective:

**Key Concepts:**
- ${tags.join(', ')} are interconnected in modern development
- Understanding the fundamentals is crucial for success
- Practical application drives real learning

**Recommended Approach:**
1. **Learn by Building** - Start with small projects
2. **Study Best Practices** - Follow industry standards
3. **Join Communities** - Connect with other developers
4. **Stay Updated** - Technology evolves rapidly

What specific aspect would you like me to dive deeper into?`,
      
      `Excellent! I can see you're interested in ${tags.join(' and ')}. Here's my technical analysis:

\`\`\`javascript
// Modern approach to ${tags[0] || 'development'}
const solution = {
  approach: 'systematic',
  tools: ['${tags.join("', '")}'],
  outcome: 'scalable and maintainable'
};
\`\`\`

**Technical Recommendations:**
- Focus on **clean architecture** and **best practices**
- Implement **testing strategies** early in development
- Consider **performance optimization** from the start
- Document your **learning journey** for future reference

Would you like me to provide more specific guidance on any of these areas?`
    ];
    return techResponses[Math.floor(Math.random() * techResponses.length)];
  };
  
  const generateBusinessResponse = (userInput, tags) => {
    const businessResponses = [
      `Interesting business insight about ${tags[0] || 'entrepreneurship'}! Here's my strategic analysis:

**Business Framework:**
- **Market Analysis**: Understanding your target audience
- **Value Proposition**: What unique value do you provide?
- **Execution Strategy**: How will you implement your vision?
- **Growth Metrics**: What success indicators will you track?

**Key Considerations for ${tags.join(', ')}:**
✅ Validate assumptions early
✅ Focus on customer feedback
✅ Build minimum viable products
✅ Iterate based on data

What specific business challenge can I help you tackle?`,
      
      `Great business thinking around ${tags.join(' and ')}! Let me share some strategic insights:

**Strategic Pillars:**
1. **Vision & Mission** - Clear direction and purpose
2. **Market Positioning** - Unique competitive advantage
3. **Operational Excellence** - Efficient execution capabilities
4. **Innovation Culture** - Continuous improvement mindset

**Actionable Steps:**
- Conduct thorough market research
- Develop a solid business plan
- Build strategic partnerships
- Focus on customer success metrics

Which area of your business strategy needs the most attention right now?`
    ];
    return businessResponses[Math.floor(Math.random() * businessResponses.length)];
  };
  
  const generateEducationResponse = (userInput, tags) => {
    const educationResponses = [
      `Perfect learning opportunity with ${tags[0] || 'skill development'}! Here's my educational guidance:

**Learning Framework:**
- **Foundation Building** - Master the basics thoroughly
- **Practical Application** - Learn through real projects
- **Continuous Practice** - Consistency over intensity
- **Knowledge Sharing** - Teach others to deepen understanding

**Study Plan for ${tags.join(', ')}:**
📚 **Phase 1**: Fundamental concepts and theory
🛠️ **Phase 2**: Hands-on projects and exercises
🤝 **Phase 3**: Collaborative learning and peer review
📈 **Phase 4**: Advanced topics and specialization

What's your current learning goal, and how can I help you achieve it?`,
      
      `Excellent learning focus on ${tags.join(' and ')}! Here's my educational roadmap:

**Learning Strategies:**
- **Active Learning**: Engage with material, don't just consume
- **Spaced Repetition**: Review concepts at increasing intervals
- **Project-Based Learning**: Apply knowledge to real scenarios
- **Peer Collaboration**: Learn from and teach others

**Resource Recommendations:**
- Interactive tutorials and courses
- Community forums and discussion groups
- Practice platforms and coding challenges
- Mentorship and expert guidance

**Success Metrics:**
- Track progress with measurable milestones
- Build a portfolio of completed projects
- Participate in relevant communities
- Continuously update and expand skills

What specific learning challenge can I help you overcome?`
    ];
    return educationResponses[Math.floor(Math.random() * educationResponses.length)];
  };

  const generateAIResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    // Code-related responses
    if (input.includes('code') || input.includes('programming') || input.includes('javascript') || input.includes('react')) {
      return `I'd be happy to help with coding! Here's an example based on your question:

\`\`\`javascript
// Example React component
import React, { useState } from 'react';

function ExampleComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default ExampleComponent;
\`\`\`

**Key points:**
- Always use functional components with hooks
- State management with \`useState\`
- Clean and readable code structure

Would you like me to explain any specific part or help with a particular coding problem?`;
    }
    
    // Help with writing
    if (input.includes('write') || input.includes('essay') || input.includes('article')) {
      return `I can definitely help you with writing! Here's a structured approach:

**Writing Process:**
1. **Planning** - Outline your main points
2. **Research** - Gather relevant information
3. **Draft** - Write your first version
4. **Review** - Edit and refine
5. **Polish** - Final checks

**Tips for better writing:**
- Start with a clear thesis statement
- Use varied sentence structures
- Support claims with evidence
- Conclude with impact

What specific type of writing are you working on? I can provide more targeted advice.`;
    }

    // Data analysis
    if (input.includes('data') || input.includes('analysis') || input.includes('chart')) {
      return `Great question about data analysis! Here's how I can help:

**Data Analysis Approaches:**
- **Descriptive Analysis**: What happened?
- **Diagnostic Analysis**: Why did it happen?
- **Predictive Analysis**: What might happen?
- **Prescriptive Analysis**: What should we do?

**Common Tools & Techniques:**
- Statistical analysis (mean, median, correlation)
- Data visualization (charts, graphs)
- Trend identification
- Pattern recognition

Would you like me to help analyze specific data or create visualizations? I can guide you through the process step by step.`;
    }

    // General helpful responses
    const responses = [
      `That's an interesting question! Let me break this down for you:

**Key Points to Consider:**
- Understanding the context is crucial
- Multiple perspectives often provide better insights
- Breaking complex problems into smaller parts helps

I'd be happy to dive deeper into any specific aspect you're curious about. What would you like to explore further?`,

      `Excellent question! Here's my analysis:

**Approach 1: Direct Solution**
This would involve tackling the problem head-on with immediate action.

**Approach 2: Strategic Planning**
Taking time to plan and considering long-term implications.

**Approach 3: Collaborative Method**
Involving others and leveraging collective expertise.

Which approach resonates most with your situation? I can provide more specific guidance based on your preference.`,

      `I understand you're looking for insights on this topic. Here's what I'd recommend:

**Step 1**: Clarify your objectives
**Step 2**: Gather all relevant information
**Step 3**: Consider multiple solutions
**Step 4**: Evaluate pros and cons
**Step 5**: Make an informed decision

**Additional Considerations:**
- Timeline and urgency
- Available resources
- Potential risks and benefits

Would you like me to help you work through any of these steps in detail?`,

      `That's a thoughtful inquiry! Let me provide a comprehensive perspective:

**The Core Issue:**
Understanding the fundamental aspects is key to finding the best solution.

**Practical Solutions:**
1. **Immediate actions** you can take right now
2. **Medium-term strategies** for sustained progress
3. **Long-term planning** for optimal outcomes

**Success Factors:**
- Consistency in approach
- Adaptability when needed
- Learning from feedback

What specific aspect would you like me to elaborate on? I'm here to help you succeed!`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = '24px';
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = Math.min(scrollHeight, 200) + 'px';
  };

  const startNewConversation = () => {
    const newConversation = {
      id: Date.now(),
      title: 'New Conversation',
      messages: 1,
      lastActive: new Date()
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setMessages([
      {
        id: Date.now(),
        type: 'ai',
        content: "Hello! I'm your AI assistant. How can I help you today?",
        timestamp: new Date(),
        isMarkdown: false
      }
    ]);
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    // You could add a toast notification here
  };

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`w-80 border-r ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            } flex flex-col`}
          >
            {/* New Chat Button */}
            <div className="p-4">
              <button
                onClick={startNewConversation}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed transition-all duration-200 ${
                  theme === 'dark'
                    ? 'border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <PlusIcon className="w-5 h-5" />
                New Conversation
              </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto px-4">
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <motion.div
                    key={conv.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      currentConversationId === conv.id
                        ? theme === 'dark'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : theme === 'dark'
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => setCurrentConversationId(conv.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conv.title}
                        </p>
                        <p className="text-xs opacity-70">
                          {conv.messages} messages
                        </p>
                      </div>
                      <div className="ml-2">
                        <button
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500 hover:text-white rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Delete conversation logic
                          }}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`border-b ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                AI Assistant
              </h1>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Powered by advanced AI
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              onClick={() => {
                const conversation = JSON.stringify(messages, null, 2);
                const blob = new Blob([conversation], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `conversation-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <DownloadIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              theme={theme}
              onCopy={copyMessage}
              isLast={index === messages.length - 1}
            />
          ))}
          
          {isTyping && (
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <div className={`max-w-3xl p-4 rounded-2xl ${
                theme === 'dark'
                  ? 'bg-gray-800 text-gray-300'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                <TypingIndicator />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`border-t ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } p-6`}>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Message AI Assistant..."
                disabled={isTyping}
                className={`w-full resize-none border rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ minHeight: '24px', maxHeight: '200px' }}
                rows="1"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                  inputValue.trim() && !isTyping
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
                    : theme === 'dark'
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </div>
          </form>
          
          <div className={`mt-2 text-xs text-center ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message, theme, onCopy, isLast }) {
  const [showActions, setShowActions] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-4"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        message.type === 'ai'
          ? 'bg-gradient-to-br from-blue-500 to-purple-600'
          : theme === 'dark'
          ? 'bg-gray-600'
          : 'bg-gray-300'
      }`}>
        {message.type === 'ai' ? (
          <SparklesIcon className="w-4 h-4 text-white" />
        ) : (
          <UserIcon className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 max-w-3xl">
        <div className={`p-4 rounded-2xl ${
          message.type === 'ai'
            ? theme === 'dark'
              ? 'bg-gray-800 text-gray-100'
              : 'bg-gray-100 text-gray-800'
            : theme === 'dark'
            ? 'bg-blue-600 text-white'
            : 'bg-blue-500 text-white'
        }`}>
          {message.isMarkdown ? (
            <MarkdownContent content={message.content} theme={theme} />
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          )}
        </div>
        
        {/* Actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 mt-2"
            >
              <button
                onClick={() => onCopy(message.content)}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700 text-gray-400'
                    : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <CopyIcon className="w-4 h-4" />
              </button>
              <span className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Markdown Content Component
function MarkdownContent({ content, theme }) {
  const formatContent = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<div class="code-block ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-4 my-3 overflow-x-auto">
          ${lang ? `<div class="text-xs text-blue-500 mb-2">${lang}</div>` : ''}
          <pre class="text-sm"><code>${code.trim()}</code></pre>
        </div>`;
      })
      .replace(/`([^`]+)`/g, `<code class="px-1.5 py-0.5 rounded text-sm ${
        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
      }">$1</code>`);
  };

  return (
    <div 
      className="prose prose-sm max-w-none leading-relaxed"
      dangerouslySetInnerHTML={{ __html: formatContent(content) }}
    />
  );
}

// Typing Indicator Component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <div className="flex space-x-1">
        <motion.div
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        />
      </div>
      <span className="ml-2 text-sm opacity-70">AI is thinking...</span>
    </div>
  );
}

// Icon Components
function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function MenuIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function SendIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function SparklesIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function UserIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function CopyIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function TrashIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function DownloadIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}
