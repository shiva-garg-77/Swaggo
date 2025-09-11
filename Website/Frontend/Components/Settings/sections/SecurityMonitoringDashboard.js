'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Eye, 
  Globe, 
  Clock, 
  MapPin,
  Smartphone,
  Monitor,
  Wifi,
  Lock,
  Unlock,
  RefreshCw,
  Bell,
  AlertCircle,
  Info,
  Zap,
  Users,
  Target
} from 'lucide-react'

export default function SecurityMonitoringDashboard({ userSettings, onAlert }) {
  const [securityMetrics, setSecurityMetrics] = useState({
    score: 0,
    trend: 0,
    threats: [],
    activities: [],
    devices: [],
    locations: []
  })
  
  const [realTimeData, setRealTimeData] = useState({
    currentThreats: 0,
    blockedAttempts: 0,
    activeMonitoring: true,
    lastScan: new Date()
  })
  
  const [chartData, setChartData] = useState([])
  const [isLive, setIsLive] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')
  
  const intervalRef = useRef(null)

  // Initialize security monitoring
  useEffect(() => {
    generateInitialMetrics()
    
    if (isLive) {
      intervalRef.current = setInterval(() => {
        updateRealTimeMetrics()
        generateChartData()
      }, 5000) // Update every 5 seconds
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isLive, userSettings])

  const generateInitialMetrics = () => {
    const score = calculateSecurityScore()
    const threats = generateThreats()
    const activities = generateRecentActivities()
    const devices = generateKnownDevices()
    const locations = generateAccessLocations()
    
    setSecurityMetrics({
      score,
      trend: Math.random() > 0.5 ? 5 : -2,
      threats,
      activities,
      devices,
      locations
    })
    
    generateChartData()
  }

  const calculateSecurityScore = () => {
    let score = 40 // Base score
    
    if (userSettings?.twoFactor) score += 30
    if (userSettings?.loginNotifications) score += 15
    if (userSettings?.suspiciousActivityAlerts) score += 10
    if (userSettings?.profileVisibility !== 'public') score += 5
    
    return Math.min(score, 100)
  }

  const generateThreats = () => {
    const possibleThreats = [
      {
        id: 1,
        type: 'login_attempt',
        severity: 'medium',
        title: 'Failed Login Attempts',
        description: '3 failed attempts from unknown IP',
        location: 'Unknown Location',
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        status: 'blocked'
      },
      {
        id: 2,
        type: 'suspicious_device',
        severity: 'high',
        title: 'New Device Access',
        description: 'Login from unrecognized device',
        location: 'New York, NY',
        timestamp: new Date(Date.now() - Math.random() * 172800000),
        status: 'monitoring'
      },
      {
        id: 3,
        type: 'data_breach',
        severity: 'low',
        title: 'Password in Known Breach',
        description: 'Your password was found in a data breach',
        location: 'External Database',
        timestamp: new Date(Date.now() - Math.random() * 604800000),
        status: 'warning'
      }
    ]
    
    // Randomly include 0-2 threats
    return possibleThreats.filter(() => Math.random() > 0.4).slice(0, 2)
  }

  const generateRecentActivities = () => {
    const activities = [
      {
        id: 1,
        type: 'login',
        action: 'Successful login',
        device: 'Chrome on Windows',
        location: 'San Francisco, CA',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        risk: 'low'
      },
      {
        id: 2,
        type: 'settings',
        action: 'Privacy settings updated',
        device: 'Mobile App',
        location: 'San Francisco, CA',
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        risk: 'normal'
      },
      {
        id: 3,
        type: 'password',
        action: 'Password changed',
        device: 'Safari on macOS',
        location: 'Los Angeles, CA',
        timestamp: new Date(Date.now() - 604800000), // 1 week ago
        risk: 'normal'
      }
    ]
    
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  const generateKnownDevices = () => [
    {
      id: 1,
      name: 'iPhone 15 Pro',
      type: 'mobile',
      browser: 'Mobile Safari',
      lastSeen: new Date(Date.now() - 3600000),
      location: 'San Francisco, CA',
      status: 'active'
    },
    {
      id: 2,
      name: 'MacBook Pro',
      type: 'desktop',
      browser: 'Chrome',
      lastSeen: new Date(Date.now() - 7200000),
      location: 'San Francisco, CA',
      status: 'active'
    },
    {
      id: 3,
      name: 'Windows PC',
      type: 'desktop',
      browser: 'Edge',
      lastSeen: new Date(Date.now() - 259200000),
      location: 'New York, NY',
      status: 'inactive'
    }
  ]

  const generateAccessLocations = () => [
    { city: 'San Francisco', country: 'USA', count: 45, risk: 'low' },
    { city: 'Los Angeles', country: 'USA', count: 12, risk: 'low' },
    { city: 'New York', country: 'USA', count: 3, risk: 'medium' },
    { city: 'Unknown', country: 'Unknown', count: 1, risk: 'high' }
  ]

  const updateRealTimeMetrics = () => {
    setRealTimeData(prev => ({
      ...prev,
      currentThreats: Math.max(0, prev.currentThreats + (Math.random() > 0.8 ? 1 : 0)),
      blockedAttempts: prev.blockedAttempts + (Math.random() > 0.9 ? 1 : 0),
      lastScan: new Date()
    }))
  }

  const generateChartData = () => {
    const hours = selectedTimeframe === '24h' ? 24 : selectedTimeframe === '7d' ? 168 : 720
    const dataPoints = selectedTimeframe === '24h' ? 24 : selectedTimeframe === '7d' ? 7 : 30
    
    const data = []
    const now = Date.now()
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = now - (i * (hours * 60 * 60 * 1000) / dataPoints)
      const securityEvents = Math.floor(Math.random() * 5)
      const blockedThreats = Math.floor(Math.random() * 3)
      
      data.push({
        time: new Date(timestamp),
        securityEvents,
        blockedThreats,
        score: securityMetrics.score + (Math.random() - 0.5) * 10
      })
    }
    
    setChartData(data)
  }

  const handleThreatAction = (threatId, action) => {
    setSecurityMetrics(prev => ({
      ...prev,
      threats: prev.threats.map(threat => 
        threat.id === threatId 
          ? { ...threat, status: action }
          : threat
      )
    }))
    
    if (onAlert) {
      onAlert(`Threat ${threatId} has been ${action}`)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const formatRelativeTime = (date) => {
    const now = new Date()
    const diff = now - date
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return 'Just now'
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Security Monitoring
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time threat detection and analysis
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isLive 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">{isLive ? 'Live' : 'Paused'}</span>
            </button>
            
            <select 
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${
              securityMetrics.trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {securityMetrics.trend >= 0 ? '+' : ''}{securityMetrics.trend}%
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {securityMetrics.score}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Security Score</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <TrendingDown className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {securityMetrics.threats.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Threats</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              +{realTimeData.blockedAttempts}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {realTimeData.blockedAttempts}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Blocked Today</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className={`w-2 h-2 rounded-full ${realTimeData.activeMonitoring ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            24/7
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {realTimeData.activeMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Threat Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Active Security Threats
            </h3>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {securityMetrics.threats.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No active threats detected</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Your security is looking good!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {securityMetrics.threats.map((threat) => (
                <div key={threat.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityColor(threat.severity)}`}>
                          {threat.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {formatRelativeTime(threat.timestamp)}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {threat.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {threat.description}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <MapPin className="w-3 h-3 mr-1" />
                        {threat.location}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleThreatAction(threat.id, 'dismissed')}
                      className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleThreatAction(threat.id, 'blocked')}
                      className="text-xs px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                    >
                      Block
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Recent Security Activity
          </h3>
          
          <div className="space-y-4">
            {securityMetrics.activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activity.type === 'login' ? 'bg-blue-100 dark:bg-blue-900/20' :
                  activity.type === 'settings' ? 'bg-purple-100 dark:bg-purple-900/20' :
                  'bg-green-100 dark:bg-green-900/20'
                }`}>
                  {activity.type === 'login' ? <Smartphone className="w-4 h-4 text-blue-600" /> :
                   activity.type === 'settings' ? <Lock className="w-4 h-4 text-purple-600" /> :
                   <Shield className="w-4 h-4 text-green-600" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <span className={`text-xs ${getRiskColor(activity.risk)}`}>
                      {activity.risk}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <Monitor className="w-3 h-3 mr-1" />
                    {activity.device}
                    <MapPin className="w-3 h-3 ml-3 mr-1" />
                    {activity.location}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Devices and Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Known Devices */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Trusted Devices
          </h3>
          
          <div className="space-y-4">
            {securityMetrics.devices.map((device) => (
              <div key={device.id} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {device.type === 'mobile' ? 
                    <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" /> :
                    <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  }
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {device.name}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      device.status === 'active' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {device.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {device.browser}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    Last seen {formatRelativeTime(device.lastSeen)}
                    <MapPin className="w-3 h-3 ml-3 mr-1" />
                    {device.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Access Locations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Access Locations
          </h3>
          
          <div className="space-y-4">
            {securityMetrics.locations.map((location, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {location.city}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {location.country}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {location.count} logins
                  </p>
                  <span className={`text-xs ${getRiskColor(location.risk)}`}>
                    {location.risk} risk
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
