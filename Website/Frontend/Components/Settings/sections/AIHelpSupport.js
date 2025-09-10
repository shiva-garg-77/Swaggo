'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  MessageCircle, 
  Search,
  HelpCircle,
  Book,
  FileText,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw,
  Mic,
  MicOff
} from 'lucide-react'

export default function AIHelpSupport() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "👋 Hi there! I'm your AI assistant. I'm here to help you with any questions or problems you might have with the app. What can I help you with today?",
      timestamp: new Date(),
      helpful: null
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const messagesContainerRef = useRef(null)

  const quickActions = [
    { id: 1, title: 'Account Issues', icon: User, color: 'blue' },
    { id: 2, title: 'Payment Problems', icon: Zap, color: 'green' },
    { id: 3, title: 'App Not Working', icon: AlertCircle, color: 'red' },
    { id: 4, title: 'How to Use Features', icon: HelpCircle, color: 'purple' },
    { id: 5, title: 'Privacy Settings', icon: Info, color: 'orange' },
    { id: 6, title: 'Report a Bug', icon: AlertCircle, color: 'pink' }
  ]

  const helpResources = [
    { 
      title: 'User Manual', 
      desc: 'Complete documentation', 
      icon: Book, 
      color: 'blue',
      count: '50+ articles'  
    },
    { 
      title: 'FAQ', 
      desc: 'Common questions', 
      icon: HelpCircle, 
      color: 'green',
      count: '100+ answers'
    },
    { 
      title: 'Release Notes', 
      desc: 'Latest updates', 
      icon: FileText, 
      color: 'purple',
      count: 'New'
    }
  ]

  // Simulate AI responses (replace with actual AI integration)
  const getAIResponse = async (userMessage) => {
    const responses = {
      greeting: [
        "Hello! I'm here to help you with any questions or issues. What's on your mind?",
        "Hi there! How can I assist you today? I'm ready to help solve any problems you might have.",
        "Welcome! I'm your AI support assistant. What would you like help with?"
      ],
      account: [
        "I can help you with account-related issues! Are you having trouble logging in, updating your profile, or something else? Let me know the specific problem and I'll guide you through the solution.",
        "Account issues can be frustrating. Let me help you resolve this quickly. Can you tell me more about what's happening with your account?"
      ],
      payment: [
        "I understand payment issues can be concerning. I'm here to help resolve this. Could you tell me more about the specific payment problem you're experiencing? Is it related to billing, subscriptions, or transaction errors?",
        "Let me assist you with your payment concern. What type of payment issue are you facing? I can help with subscription problems, billing questions, or transaction errors."
      ],
      bug: [
        "Thank you for reporting this issue! Bug reports help us improve the app for everyone. Can you describe what happened and when you first noticed the problem? I'll help you troubleshoot and escalate this to our development team if needed.",
        "I appreciate you taking the time to report this bug. Let's work together to understand what's happening. Can you walk me through the steps that led to this issue?"
      ],
      features: [
        "I'd love to help you learn more about our features! Which specific feature would you like to know more about? I can provide step-by-step instructions and tips to help you get the most out of the app.",
        "Great question about our features! I can guide you through how to use any part of the app. What feature are you interested in learning about?"
      ],
      default: [
        "I understand your concern. Let me help you find the best solution. Can you provide a bit more detail about what you're experiencing?",
        "I'm here to help! Could you tell me more about the specific issue you're facing? The more details you can provide, the better I can assist you.",
        "That's a great question! I want to make sure I give you the most accurate help. Could you elaborate on what you need assistance with?"
      ]
    }

    // Simple keyword matching (replace with actual AI)
    const message = userMessage.toLowerCase()
    let responseType = 'default'
    
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      responseType = 'greeting'
    } else if (message.includes('account') || message.includes('login') || message.includes('profile')) {
      responseType = 'account'
    } else if (message.includes('payment') || message.includes('billing') || message.includes('subscription')) {
      responseType = 'payment'
    } else if (message.includes('bug') || message.includes('error') || message.includes('broken') || message.includes('not working')) {
      responseType = 'bug'
    } else if (message.includes('how') || message.includes('feature') || message.includes('use')) {
      responseType = 'features'
    }

    const responseArray = responses[responseType]
    return responseArray[Math.floor(Math.random() * responseArray.length)]
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulate thinking time
    setTimeout(async () => {
      const aiResponse = await getAIResponse(inputMessage)
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: aiResponse,
        timestamp: new Date(),
        helpful: null
      }

      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, Math.random() * 2000 + 1000) // 1-3 seconds
  }

  const handleQuickAction = (action) => {
    setInputMessage(`I need help with: ${action.title}`)
    inputRef.current?.focus()
  }

  const handleFeedback = (messageId, isHelpful) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, helpful: isHelpful } : msg
    ))
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100
    setCanScrollDown(!isNearBottom)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } else {
      alert('Speech recognition not supported in your browser')
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/30 dark:bg-gray-900/30">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4 shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Help & Support
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Online • Response time: ~30 seconds
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
              <Star className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">AI Powered</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar with Quick Actions - HIDDEN */}
        {false && (
          <div className="relative w-80 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border-r border-gray-200/50 dark:border-gray-700/50">
            <div className="p-6 overflow-y-auto scrollbar-hide smooth-scroll h-full">
              {/* Content hidden */}
            </div>
          </div>
        )}
        {/* Chat Interface */}
        <div className="flex-1 flex flex-col relative">
          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide smooth-scroll relative"
          >
            {/* Scroll fade gradient overlays */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-50/80 dark:from-gray-900/80 to-transparent pointer-events-none z-10"></div>
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50/80 dark:from-gray-900/80 to-transparent pointer-events-none z-10"></div>
            
            {/* Scroll to bottom button */}
            {canScrollDown && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-20 right-6 w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 z-20 animate-bounce"
                style={{ boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.35)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            )}
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                        : 'bg-gradient-to-br from-purple-500 to-pink-600'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div className={`relative max-w-lg ${message.type === 'user' ? 'order-1' : 'order-2'}`}>
                      <div className={`px-4 py-3 rounded-2xl backdrop-blur-lg ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white ml-4'
                          : 'bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white mr-4 border border-gray-200/50 dark:border-gray-600/50'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                      
                      {/* Timestamp */}
                      <div className={`flex items-center mt-1 space-x-2 ${message.type === 'user' ? 'justify-end mr-4' : 'justify-start ml-4'}`}>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        {/* Feedback buttons for bot messages */}
                        {message.type === 'bot' && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleFeedback(message.id, true)}
                              className={`p-1 rounded-full transition-colors ${
                                message.helpful === true
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                  : 'text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(message.id, false)}
                              className={`p-1 rounded-full transition-colors ${
                                message.helpful === false
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                  : 'text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600'
                              }`}
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white/90 dark:bg-gray-700/90 backdrop-blur-lg px-4 py-3 rounded-2xl border border-gray-200/50 dark:border-gray-600/50">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything about the app..."
                  className="w-full px-4 py-3 pr-12 bg-white/90 dark:bg-gray-700/90 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent dark:text-white transition-all duration-200"
                  style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' }}
                />
                <button
                  onClick={handleVoiceInput}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                    isListening 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                      : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-600'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                style={{ boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.35)' }}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
