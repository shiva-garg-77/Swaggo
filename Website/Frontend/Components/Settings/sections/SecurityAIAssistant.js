'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  RefreshCw,
  Zap,
  Eye,
  Lock,
  Key,
  Smartphone,
  Globe,
  Activity,
  TrendingUp,
  Send,
  Bot,
  User,
  Clock,
  ChevronRight,
  Info
} from 'lucide-react'

export default function SecurityAIAssistant({ userSettings, onSettingsUpdate }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [securityScore, setSecurityScore] = useState(0)
  const [recommendations, setRecommendations] = useState([])
  const [activeAnalysis, setActiveAnalysis] = useState(null)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  // Calculate security score based on user settings
  const calculateSecurityScore = () => {
    let score = 0
    let maxScore = 100

    // Two-factor authentication (30 points)
    if (userSettings?.twoFactor) score += 30

    // Password strength (25 points)
    const passwordScore = (userSettings?.passwordStrength || 0) / 5 * 25
    score += passwordScore

    // Login notifications (15 points)
    if (userSettings?.loginNotifications) score += 15

    // Suspicious activity alerts (15 points)
    if (userSettings?.suspiciousActivityAlerts) score += 15

    // Recent password change (10 points)
    if (userSettings?.lastPasswordChange) {
      const daysSince = Math.floor((Date.now() - new Date(userSettings.lastPasswordChange).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSince < 90) score += 10
      else if (daysSince < 180) score += 5
    }

    // Session management (5 points)
    if (userSettings?.recentSessionsReview) score += 5

    return Math.min(score, maxScore)
  }

  // Generate security recommendations
  const generateRecommendations = () => {
    const recs = []
    
    if (!userSettings?.twoFactor) {
      recs.push({
        id: 'enable_2fa',
        type: 'critical',
        icon: Shield,
        title: 'Enable Two-Factor Authentication',
        description: 'Add an extra layer of security to prevent unauthorized access',
        impact: 'High',
        effort: 'Low',
        action: () => onSettingsUpdate({ twoFactor: true })
      })
    }

    if ((userSettings?.passwordStrength || 0) < 4) {
      recs.push({
        id: 'strengthen_password',
        type: 'high',
        icon: Lock,
        title: 'Strengthen Your Password',
        description: 'Your password could be stronger. Consider using more characters and symbols',
        impact: 'High',
        effort: 'Low'
      })
    }

    if (!userSettings?.loginNotifications) {
      recs.push({
        id: 'enable_login_alerts',
        type: 'medium',
        icon: Eye,
        title: 'Enable Login Notifications',
        description: 'Get alerted when someone logs into your account from a new device',
        impact: 'Medium',
        effort: 'Low',
        action: () => onSettingsUpdate({ loginNotifications: true })
      })
    }

    if (userSettings?.activeSessions?.length > 3) {
      recs.push({
        id: 'review_sessions',
        type: 'medium',
        icon: Smartphone,
        title: 'Review Active Sessions',
        description: 'You have multiple active sessions. Review and end unused ones',
        impact: 'Medium',
        effort: 'Low'
      })
    }

    if (!userSettings?.lastPasswordChange || 
        Math.floor((Date.now() - new Date(userSettings.lastPasswordChange).getTime()) / (1000 * 60 * 60 * 24)) > 180) {
      recs.push({
        id: 'update_password',
        type: 'low',
        icon: RefreshCw,
        title: 'Update Password Regularly',
        description: 'Consider updating your password every 90-180 days for better security',
        impact: 'Low',
        effort: 'Medium'
      })
    }

    return recs
  }

  // Initialize AI chat with welcome message
  useEffect(() => {
    const score = calculateSecurityScore()
    const recs = generateRecommendations()
    
    setSecurityScore(score)
    setRecommendations(recs)

    // Initial AI message
    const welcomeMessage = {
      id: 'welcome',
      type: 'ai',
      content: `Hi! I'm your Security AI Assistant. I've analyzed your account and found your security score is ${score}/100. ${score >= 80 ? 'Great work!' : score >= 60 ? 'You\'re on the right track!' : 'There\'s room for improvement!'} How can I help strengthen your security today?`,
      timestamp: new Date().toISOString(),
      suggestions: recs.slice(0, 3).map(r => r.title)
    }

    setMessages([welcomeMessage])
  }, [userSettings])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Simulate AI typing and responses
  const sendAIResponse = async (userMessage) => {
    setIsTyping(true)
    
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    let response = ''
    let analysis = null

    // Generate contextual responses
    if (userMessage.toLowerCase().includes('2fa') || userMessage.toLowerCase().includes('two factor')) {
      response = "Two-factor authentication is one of the most effective security measures! It prevents 99.9% of automated attacks. I can guide you through setting it up - would you like me to enable it for you?"
      analysis = {
        type: '2fa_setup',
        steps: [
          'Download an authenticator app (Google Authenticator, Authy, etc.)',
          'Scan the QR code that will be generated',
          'Enter the verification code from your app',
          'Save your backup codes in a secure location'
        ]
      }
    } else if (userMessage.toLowerCase().includes('password')) {
      response = `Your current password strength is ${userSettings?.passwordStrength || 0}/5. For optimal security, use at least 12 characters with a mix of uppercase, lowercase, numbers, and symbols. Consider using a passphrase like "Coffee!Mountain#2024" - it's both strong and memorable!`
    } else if (userMessage.toLowerCase().includes('session') || userMessage.toLowerCase().includes('device')) {
      response = `You currently have ${userSettings?.activeSessions?.length || 0} active sessions. I recommend reviewing these monthly and ending any unfamiliar sessions. Would you like me to show you how to manage them?`
    } else if (userMessage.toLowerCase().includes('score') || userMessage.toLowerCase().includes('security')) {
      response = `Your security score is ${securityScore}/100. Here's how to improve it: ${recommendations.slice(0, 2).map(r => r.title).join(', ')}. Each improvement significantly reduces your risk of being compromised.`
    } else {
      // Generic helpful response
      const tips = [
        "Always verify emails before clicking links - phishing is still the #1 attack vector.",
        "Use unique passwords for each account. A password manager can help with this!",
        "Keep your apps and devices updated - security patches are crucial.",
        "Be cautious about what you share on social media - attackers use this info.",
        "Trust your instincts - if something feels suspicious, it probably is."
      ]
      response = tips[Math.floor(Math.random() * tips.length)] + " What specific security topic would you like to discuss?"
    }

    const aiMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: response,
      timestamp: new Date().toISOString(),
      analysis
    }

    setMessages(prev => [...prev, aiMessage])
    setActiveAnalysis(analysis)
    setIsTyping(false)
  }

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    const messageContent = inputMessage
    setInputMessage('')
    
    await sendAIResponse(messageContent)
  }

  // Handle recommendation actions
  const handleRecommendationAction = (rec) => {
    if (rec.action) {
      rec.action()
      
      // Add AI response about the action
      const response = {
        id: Date.now().toString(),
        type: 'ai',
        content: `Great! I've helped you ${rec.title.toLowerCase()}. Your security score should improve shortly. Is there anything else I can help you with?`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, response])
    }
  }

  // Get security score color
  const getScoreColor = () => {
    if (securityScore >= 80) return 'text-green-600'
    if (securityScore >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = () => {
    if (securityScore >= 80) return 'bg-green-100 dark:bg-green-900/20'
    if (securityScore >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20'
    return 'bg-red-100 dark:bg-red-900/20'
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Security Assistant
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Powered by advanced security intelligence
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full ${getScoreBgColor()}`}>
            <span className={`text-sm font-semibold ${getScoreColor()}`}>
              {securityScore}/100
            </span>
          </div>
        </div>
      </div>

      {/* Security Overview */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {recommendations.filter(r => r.type === 'critical').length}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {recommendations.filter(r => r.type === 'high' || r.type === 'medium').length}
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400">High/Med</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {userSettings?.activeSessions?.length || 0}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Sessions</div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-xs lg:max-w-md space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-red-500' 
                  : 'bg-gradient-to-br from-red-500 to-pink-600'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className={`rounded-lg px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}>
                <p className="text-sm">{message.content}</p>
                {message.suggestions && (
                  <div className="mt-3 space-y-1">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputMessage(suggestion)}
                        className="block w-full text-left text-xs bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors duration-200"
                      >
                        💡 {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                {message.analysis && (
                  <div className="mt-3 p-2 bg-white dark:bg-gray-600 rounded">
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      Quick Guide:
                    </div>
                    <ol className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      {message.analysis.steps?.map((step, idx) => (
                        <li key={idx} className="flex items-start space-x-1">
                          <span className="font-medium">{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                <div className="text-xs opacity-70 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {recommendations.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Quick Actions:
          </div>
          <div className="space-y-2">
            {recommendations.slice(0, 2).map((rec) => {
              const IconComponent = rec.icon
              return (
                <button
                  key={rec.id}
                  onClick={() => handleRecommendationAction(rec)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 hover:shadow-md ${
                    rec.type === 'critical' 
                      ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' 
                      : 'bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`w-4 h-4 ${
                      rec.type === 'critical' ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'
                    }`} />
                    <div>
                      <div className={`font-medium text-sm ${
                        rec.type === 'critical' 
                          ? 'text-red-800 dark:text-red-200' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {rec.title}
                      </div>
                      <div className={`text-xs ${
                        rec.type === 'critical' 
                          ? 'text-red-600 dark:text-red-300' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {rec.impact} impact • {rec.effort} effort
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me about security best practices..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          AI responses are simulated for demonstration purposes
        </div>
      </div>
    </div>
  )
}
