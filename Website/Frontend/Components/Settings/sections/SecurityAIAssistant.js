'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Bot, 
  Send, 
  User, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Smartphone,
  Wifi,
  Clock,
  RefreshCw,
  Zap,
  TrendingUp,
  Activity,
  Bell,
  Settings,
  Info,
  ExternalLink
} from 'lucide-react'

export default function SecurityAIAssistant({ userSettings, onSettingsUpdate }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: `🔐 **Welcome to your Security AI Assistant!** 

I'm here to help you strengthen your account security. I can:
• **Analyze** your current security settings
• **Recommend** improvements based on best practices
• **Guide** you through 2FA setup
• **Monitor** suspicious activity alerts
• **Answer** security-related questions

**Current Security Score: ${calculateSecurityScore(userSettings)}%**

What would you like to improve first?`,
      timestamp: new Date(),
      suggestions: ['Analyze Security', 'Setup 2FA', 'Password Tips', 'Activity Review']
    }
  ])
  
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [securityInsights, setSecurityInsights] = useState(generateSecurityInsights(userSettings))
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Security analysis state
  const [securityAnalysis, setSecurityAnalysis] = useState({
    score: calculateSecurityScore(userSettings),
    threats: detectThreats(userSettings),
    recommendations: generateRecommendations(userSettings)
  })

  const [activeInsight, setActiveInsight] = useState(null)
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(true)

  // Calculate security score based on settings
  function calculateSecurityScore(settings) {
    if (!settings) return 25
    
    let score = 0
    const maxScore = 100
    
    // 2FA enabled (40 points)
    if (settings.twoFactor) score += 40
    
    // Login notifications enabled (20 points)
    if (settings.loginNotifications) score += 20
    
    // Suspicious activity alerts (20 points)
    if (settings.suspiciousActivityAlerts) score += 20
    
    // Recent password change (10 points)
    if (settings.lastPasswordChange && 
        Date.now() - new Date(settings.lastPasswordChange).getTime() < 90 * 24 * 60 * 60 * 1000) {
      score += 10
    }
    
    // Active sessions reviewed (10 points)
    if (settings.recentSessionsReview) score += 10
    
    return Math.min(score, maxScore)
  }

  // Detect security threats
  function detectThreats(settings) {
    const threats = []
    
    if (!settings?.twoFactor) {
      threats.push({
        type: 'critical',
        title: '2FA Disabled',
        description: 'Two-factor authentication is your strongest defense against unauthorized access',
        action: 'Enable 2FA'
      })
    }
    
    if (!settings?.loginNotifications) {
      threats.push({
        type: 'warning',
        title: 'Login Notifications Off',
        description: 'You won\'t be notified of suspicious login attempts',
        action: 'Enable Notifications'
      })
    }
    
    if (settings?.activeSessions?.length > 3) {
      threats.push({
        type: 'info',
        title: 'Multiple Active Sessions',
        description: `You have ${settings.activeSessions.length} active sessions`,
        action: 'Review Sessions'
      })
    }
    
    return threats
  }

  // Generate security recommendations
  function generateRecommendations(settings) {
    const recommendations = [
      {
        id: 'strong-password',
        title: 'Use a Strong Password',
        description: 'Your password should be at least 12 characters with mixed case, numbers, and symbols',
        priority: 'high',
        implemented: settings?.passwordStrength >= 4,
        action: () => console.log('Navigate to password change')
      },
      {
        id: 'enable-2fa',
        title: 'Enable Two-Factor Authentication',
        description: 'Add an extra layer of security with SMS or authenticator app',
        priority: 'critical',
        implemented: settings?.twoFactor,
        action: () => console.log('Navigate to 2FA setup')
      },
      {
        id: 'review-sessions',
        title: 'Review Active Sessions',
        description: 'Regularly check and remove sessions from unknown devices',
        priority: 'medium',
        implemented: settings?.recentSessionsReview,
        action: () => console.log('Navigate to sessions')
      },
      {
        id: 'privacy-settings',
        title: 'Update Privacy Settings',
        description: 'Control who can see your profile and contact you',
        priority: 'medium',
        implemented: settings?.profileVisibility !== 'public',
        action: () => console.log('Navigate to privacy settings')
      }
    ]
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  // Generate security insights
  function generateSecurityInsights(settings) {
    return {
      accountAge: '2 years, 4 months',
      lastSecurityCheck: 'Never',
      riskLevel: calculateSecurityScore(settings) >= 80 ? 'Low' : 
                 calculateSecurityScore(settings) >= 60 ? 'Medium' : 'High',
      recentActivity: [
        { type: 'login', location: 'San Francisco, CA', time: '2 hours ago', status: 'normal' },
        { type: 'password', action: 'Password changed', time: '1 week ago', status: 'secure' },
        { type: 'device', action: 'New device added', time: '3 days ago', status: 'warning' }
      ]
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateAIResponse = (userInput) => {
    const input = userInput.toLowerCase()
    
    // Security-specific responses
    if (input.includes('2fa') || input.includes('two-factor') || input.includes('authenticator')) {
      return `🔐 **Two-Factor Authentication Setup**

I'll guide you through enabling 2FA:

**Step 1: Choose Your Method**
📱 **SMS (Quick)**: Get codes via text message
🔑 **Authenticator App (Recommended)**: Use Google Authenticator, Authy, or Microsoft Authenticator

**Step 2: Setup Process**
1. Go to Security Settings → Two-Factor Authentication
2. Choose your preferred method
3. Follow the verification steps
4. Save your backup codes in a secure location

**Why 2FA is Important:**
✅ Blocks 99.9% of automated attacks
✅ Protects even if your password is compromised
✅ Required for high-security accounts

Would you like me to walk you through the setup process?`
    }
    
    if (input.includes('password') || input.includes('strong') || input.includes('secure password')) {
      return `🔑 **Password Security Guide**

**Current Password Analysis:**
${userSettings?.passwordStrength >= 4 ? '✅ Your password appears strong' : '⚠️ Your password could be stronger'}

**Strong Password Checklist:**
✅ At least 12 characters long
✅ Mix of uppercase and lowercase letters
✅ Include numbers (0-9)
✅ Add special characters (!@#$%^&*)
✅ Avoid common words or personal info
✅ Don't reuse passwords from other accounts

**Pro Tips:**
• Use a passphrase: "Coffee!Makes-Me-Happy123"
• Try a password manager for unique passwords
• Change passwords if there's a security breach

**Password Strength**: ${userSettings?.passwordStrength || 2}/5
${userSettings?.passwordStrength < 4 ? 'Consider updating your password for better security.' : 'Great job on maintaining a strong password!'}

Need help changing your password?`
    }
    
    if (input.includes('activity') || input.includes('suspicious') || input.includes('monitoring')) {
      return `🕵️ **Security Activity Monitoring**

**Recent Account Activity:**
${securityInsights.recentActivity.map(activity => 
  `${activity.status === 'warning' ? '⚠️' : activity.status === 'secure' ? '🔒' : '✅'} **${activity.action}** - ${activity.location || ''} (${activity.time})`
).join('\n')}

**What I Monitor:**
🔍 Login attempts from new devices
🔍 Password changes and resets
🔍 Privacy setting modifications
🔍 Unusual access patterns
🔍 Failed login attempts

**Alert Settings:**
${userSettings?.loginNotifications ? '✅' : '❌'} Login notifications
${userSettings?.suspiciousActivityAlerts ? '✅' : '❌'} Suspicious activity alerts

**Risk Level: ${securityInsights.riskLevel}**

Would you like to review your security settings or enable additional monitoring?`
    }
    
    if (input.includes('analyze') || input.includes('security score') || input.includes('assessment')) {
      return `📊 **Security Assessment Results**

**Overall Security Score: ${securityAnalysis.score}%**
${securityAnalysis.score >= 80 ? '🟢 Excellent security posture!' : 
  securityAnalysis.score >= 60 ? '🟡 Good, but room for improvement' : 
  '🔴 Immediate action needed'}

**Security Breakdown:**
${userSettings?.twoFactor ? '✅' : '❌'} Two-Factor Authentication (40 pts)
${userSettings?.loginNotifications ? '✅' : '❌'} Login Notifications (20 pts)
${userSettings?.suspiciousActivityAlerts ? '✅' : '❌'} Activity Monitoring (20 pts)
${userSettings?.passwordStrength >= 4 ? '✅' : '❌'} Strong Password (10 pts)
${userSettings?.recentSessionsReview ? '✅' : '❌'} Regular Session Reviews (10 pts)

**Immediate Recommendations:**
${securityAnalysis.recommendations.slice(0, 3).map((rec, i) => 
  `${i + 1}. **${rec.title}** ${rec.implemented ? '✅' : '❌'}\n   ${rec.description}`
).join('\n\n')}

Which area would you like to improve first?`
    }
    
    // General security responses
    const securityResponses = [
      `🛡️ **Security Best Practices**

Here are some key security tips:

**Essential Security Steps:**
1. **Enable 2FA** - Your strongest defense
2. **Use unique passwords** - Never reuse passwords
3. **Keep software updated** - Install security patches
4. **Review permissions** - Check app and website access
5. **Monitor activity** - Watch for unusual behavior

**Current Security Status:**
- Security Score: ${securityAnalysis.score}%
- Active Threats: ${securityAnalysis.threats.length}
- Last Security Review: ${securityInsights.lastSecurityCheck}

What specific security topic interests you most?`,

      `🔍 **Account Security Analysis**

I've analyzed your security settings:

**Strengths:**
${userSettings?.twoFactor ? '• Two-factor authentication enabled 🔐' : ''}
${userSettings?.loginNotifications ? '• Login notifications active 🔔' : ''}
${userSettings?.passwordStrength >= 4 ? '• Strong password in use 💪' : ''}

**Areas for Improvement:**
${!userSettings?.twoFactor ? '• Enable two-factor authentication' : ''}
${!userSettings?.loginNotifications ? '• Turn on login notifications' : ''}
${userSettings?.passwordStrength < 4 ? '• Strengthen your password' : ''}

**Recent Security Events:**
${securityInsights.recentActivity.slice(0, 2).map(activity => 
  `• ${activity.action} - ${activity.time}`
).join('\n')}

Would you like help with any of these security improvements?`
    ]
    
    return securityResponses[Math.floor(Math.random() * securityResponses.length)]
  }

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isTyping) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    const currentInput = inputMessage
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = generateAIResponse(currentInput)
      const aiMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        suggestions: getContextualSuggestions(currentInput)
      }

      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1000 + Math.random() * 2000)
  }

  const getContextualSuggestions = (input) => {
    if (input.toLowerCase().includes('2fa')) {
      return ['Setup 2FA Now', 'Backup Codes', 'Authenticator Apps', 'SMS vs App']
    }
    if (input.toLowerCase().includes('password')) {
      return ['Change Password', 'Password Manager', 'Security Tips', 'Check Breaches']
    }
    if (input.toLowerCase().includes('activity')) {
      return ['Review Sessions', 'Check Devices', 'Security Alerts', 'Privacy Settings']
    }
    return ['Security Score', 'Enable 2FA', 'Password Tips', 'Activity Review']
  }

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion)
    inputRef.current?.focus()
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="h-full flex">
      {/* Security Dashboard Sidebar */}
      <div className={`${showSecurityDashboard ? 'w-80' : 'w-16'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold text-gray-900 dark:text-white ${showSecurityDashboard ? 'block' : 'hidden'}`}>
              Security Overview
            </h3>
            <button
              onClick={() => setShowSecurityDashboard(!showSecurityDashboard)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {showSecurityDashboard && (
            <div className="space-y-4">
              {/* Security Score */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Security Score</span>
                  <span className={`text-lg font-bold ${getScoreColor(securityAnalysis.score)}`}>
                    {securityAnalysis.score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${getScoreBgColor(securityAnalysis.score)}`}
                    style={{ width: `${securityAnalysis.score}%` }}
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 text-green-500 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Risk Level</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {securityInsights.riskLevel}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Threats</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {securityAnalysis.threats.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Threats */}
              {securityAnalysis.threats.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Issues</h4>
                  {securityAnalysis.threats.slice(0, 3).map((threat, index) => (
                    <div key={index} className={`p-2 rounded-lg border-l-4 ${
                      threat.type === 'critical' ? 'bg-red-50 border-red-500 dark:bg-red-900/20' :
                      threat.type === 'warning' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20' :
                      'bg-blue-50 border-blue-500 dark:bg-blue-900/20'
                    }`}>
                      <div className="text-xs font-medium text-gray-900 dark:text-white">
                        {threat.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {threat.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Actions</h4>
                <div className="space-y-1">
                  <button 
                    onClick={() => handleSuggestionClick('Enable 2FA')}
                    className="w-full text-left p-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    🔐 Enable 2FA
                  </button>
                  <button 
                    onClick={() => handleSuggestionClick('Check password strength')}
                    className="w-full text-left p-2 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  >
                    🔑 Password Check
                  </button>
                  <button 
                    onClick={() => handleSuggestionClick('Review recent activity')}
                    className="w-full text-left p-2 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                  >
                    📊 Activity Review
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Security AI Assistant</h3>
                <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Online • Expert security guidance
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${getScoreColor(securityAnalysis.score)}`}>
                Security: {securityAnalysis.score}%
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-4xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-start space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                      : 'bg-gradient-to-br from-purple-500 to-pink-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Shield className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-3xl ${message.type === 'user' ? 'order-1' : 'order-2'}`}>
                    <div className={`px-4 py-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="text-sm leading-relaxed whitespace-pre-line">
                        {message.content}
                      </div>
                    </div>
                    
                    {/* Suggestions */}
                    {message.suggestions && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className={`text-xs text-gray-500 dark:text-gray-400 mt-2 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-2xl">
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
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about security settings, 2FA, password tips..."
                disabled={isTyping}
                className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-all duration-200 disabled:opacity-50"
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
