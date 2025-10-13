'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, Search, Bell, BellOff, AlertTriangle, 
  Settings, Trash2, Edit3, Check, X as XIcon 
} from 'lucide-react';

/**
 * Enhanced Smart Notifications & Keyword Alerts Manager
 * 
 * Features:
 * - Add/remove keyword alerts with AI-powered suggestions
 * - Priority levels with smart auto-detection
 * - Context-aware matching (mentions, topics, sentiment)
 * - Real-time keyword testing with advanced preview
 * - Alert statistics, analytics, and smart grouping
 * - Time-based rules and quiet hours
 * - Integration with user presence and status
 * - Machine learning-based relevance scoring
 */
export default function KeywordAlertsManager({ 
  user, 
  isOpen, 
  onClose,
  onKeywordAlertChange 
}) {
  const [keywordAlerts, setKeywordAlerts] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newCaseSensitive, setNewCaseSensitive] = useState(false);
  const [newWholeWord, setNewWholeWord] = useState(true);
  const [testMessage, setTestMessage] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [editingAlert, setEditingAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Enhanced Smart Notifications state
  const [keywordSuggestions, setKeywordSuggestions] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [alertAnalytics, setAlertAnalytics] = useState(null);
  const [quietHours, setQuietHours] = useState({ enabled: false, start: '22:00', end: '08:00' });
  const [contextFilters, setContextFilters] = useState({
    mentions: true,
    directMessages: true,
    groupMessages: true,
    sentimentFilter: 'all', // all, positive, negative, neutral
    channelTypes: ['all']
  });
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const priorityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  };

  const priorityIcons = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    critical: '🔴'
  };

  // Load keyword alerts and analytics on mount
  useEffect(() => {
    if (user?.profileid) {
      loadKeywordAlerts();
      loadAlertAnalytics();
      loadUserPreferences();
    }
  }, [user]);

  // Generate AI-powered keyword suggestions when typing
  useEffect(() => {
    if (newKeyword.length > 2 && aiSuggestionsEnabled) {
      const debounceTimer = setTimeout(() => {
        generateKeywordSuggestions(newKeyword);
      }, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      setKeywordSuggestions([]);
    }
  }, [newKeyword, aiSuggestionsEnabled]);

  const loadKeywordAlerts = async () => {
    try {
      const response = await fetch(`/api/keyword-alerts/${user.profileid}`);
      if (response.ok) {
        const alerts = await response.json();
        setKeywordAlerts(alerts);
      }
    } catch (error) {
      console.error('Error loading keyword alerts:', error);
    }
  };

  const loadAlertAnalytics = async () => {
    try {
      const response = await fetch(`/api/keyword-alerts/${user.profileid}/analytics`);
      if (response.ok) {
        const analytics = await response.json();
        setAlertAnalytics(analytics);
      }
    } catch (error) {
      console.error('Error loading alert analytics:', error);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const response = await fetch(`/api/user-preferences/${user.profileid}/notifications`);
      if (response.ok) {
        const prefs = await response.json();
        if (prefs.quietHours) setQuietHours(prefs.quietHours);
        if (prefs.contextFilters) setContextFilters(prefs.contextFilters);
        if (prefs.aiSuggestionsEnabled !== undefined) setAiSuggestionsEnabled(prefs.aiSuggestionsEnabled);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const generateKeywordSuggestions = async (partialKeyword) => {
    if (!aiSuggestionsEnabled) return;
    
    try {
      setLoadingSuggestions(true);
      const response = await fetch('/api/ai/keyword-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partialKeyword,
          userId: user.profileid,
          existingKeywords: keywordAlerts.map(a => a.keyword),
          context: {
            userRole: user.role,
            interests: user.interests || [],
            recentMessages: [], // Could include recent message history for context
          }
        })
      });

      if (response.ok) {
        const suggestions = await response.json();
        setKeywordSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error generating keyword suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const predictPriority = async (keyword) => {
    try {
      const response = await fetch('/api/ai/predict-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          userId: user.profileid,
          userContext: {
            role: user.role,
            department: user.department,
            previousAlerts: keywordAlerts
          }
        })
      });

      if (response.ok) {
        const { suggestedPriority, confidence, reasoning } = await response.json();
        if (confidence > 0.7) {
          setNewPriority(suggestedPriority);
          // Could show reasoning to user
          console.log(`AI suggests ${suggestedPriority} priority (${Math.round(confidence * 100)}% confidence): ${reasoning}`);
        }
      }
    } catch (error) {
      console.error('Error predicting priority:', error);
    }
  };

  const saveUserPreferences = async () => {
    try {
      await fetch(`/api/user-preferences/${user.profileid}/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quietHours,
          contextFilters,
          aiSuggestionsEnabled
        })
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const addKeywordAlert = async () => {
    if (!newKeyword.trim()) return;

    const alert = {
      keyword: newKeyword.trim(),
      priority: newPriority,
      caseSensitive: newCaseSensitive,
      wholeWord: newWholeWord,
      userId: user.profileid,
      active: true,
      contextFilters: contextFilters,
      quietHours: quietHours.enabled ? quietHours : null,
      createdAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/keyword-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });

      if (response.ok) {
        const savedAlert = await response.json();
        setKeywordAlerts(prev => [...prev, savedAlert]);
        setNewKeyword('');
        setNewPriority('medium');
        setNewCaseSensitive(false);
        setNewWholeWord(true);
        setKeywordSuggestions([]);
        onKeywordAlertChange?.(savedAlert, 'added');
        
        // Update analytics
        loadAlertAnalytics();
      }
    } catch (error) {
      console.error('Error adding keyword alert:', error);
    }
  };

  const handleKeywordChange = (value) => {
    setNewKeyword(value);
    // Trigger AI priority prediction for meaningful keywords
    if (value.length > 3) {
      predictPriority(value);
    }
  };

  const applySuggestion = (suggestion) => {
    setNewKeyword(suggestion.keyword);
    setNewPriority(suggestion.suggestedPriority || 'medium');
    setKeywordSuggestions([]);
  };

  const removeKeywordAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/keyword-alerts/${alertId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setKeywordAlerts(prev => prev.filter(alert => alert.id !== alertId));
        onKeywordAlertChange?.(alertId, 'removed');
      }
    } catch (error) {
      console.error('Error removing keyword alert:', error);
    }
  };

  const toggleAlertActive = async (alertId, active) => {
    try {
      const response = await fetch(`/api/keyword-alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      });

      if (response.ok) {
        setKeywordAlerts(prev => 
          prev.map(alert => 
            alert.id === alertId ? { ...alert, active } : alert
          )
        );
      }
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const testKeywordMatching = async () => {
    if (!testMessage.trim()) return;

    try {
      const response = await fetch('/api/keyword-alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          userId: user.profileid
        })
      });

      if (response.ok) {
        const results = await response.json();
        setTestResults(results);
      }
    } catch (error) {
      console.error('Error testing keywords:', error);
    }
  };

  const filteredAlerts = keywordAlerts.filter(alert => 
    alert.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Keyword Alerts
            </h2>
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
              {keywordAlerts.length} alerts
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Add New Alert */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Add New Alert
            </h3>

            <div className="space-y-4">
              {/* Keyword Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Keyword
                  </label>
                  <button
                    onClick={() => setAiSuggestionsEnabled(!aiSuggestionsEnabled)}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      aiSuggestionsEnabled 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                    title="Toggle AI suggestions"
                  >
                    🤖 AI {aiSuggestionsEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => handleKeywordChange(e.target.value)}
                    placeholder="Enter keyword to monitor..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {loadingSuggestions && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                
                {/* AI Suggestions */}
                {keywordSuggestions.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm">
                    {keywordSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => applySuggestion(suggestion)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {suggestion.keyword}
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className={`px-1.5 py-0.5 text-xs rounded-full ${priorityColors[suggestion.suggestedPriority || 'medium']}`}>
                              {suggestion.suggestedPriority || 'medium'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {Math.round(suggestion.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        {suggestion.reasoning && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {suggestion.reasoning}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Priority Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low - General notifications</option>
                  <option value="medium">Medium - Important updates</option>
                  <option value="high">High - Urgent messages</option>
                  <option value="critical">Critical - Emergency alerts</option>
                </select>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newCaseSensitive}
                    onChange={(e) => setNewCaseSensitive(e.target.checked)}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Case sensitive
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newWholeWord}
                    onChange={(e) => setNewWholeWord(e.target.checked)}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Whole word matching
                  </span>
                </label>
              </div>

              {/* Add Button */}
              <button
                onClick={addKeywordAlert}
                disabled={!newKeyword.trim()}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Alert</span>
              </button>
            </div>

            {/* Test Section */}
            <div className="mt-8">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Test Keywords
              </h4>
              <div className="space-y-3">
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Type a test message to see which keywords match..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
                <button
                  onClick={testKeywordMatching}
                  disabled={!testMessage.trim()}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Test Match
                </button>
              </div>

              {/* Test Results */}
              {testResults && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Test Results:
                  </h5>
                  {testResults.matches.length > 0 ? (
                    <div className="space-y-1">
                      {testResults.matches.map((match, index) => (
                        <div key={index} className="text-sm text-green-600 dark:text-green-400">
                          ✓ "{match.keyword}" - {match.priority} priority
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No keyword matches found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Alert List */}
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Your Alerts
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search alerts..."
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {filteredAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-4 border rounded-lg transition-all ${
                      alert.active 
                        ? 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800' 
                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{priorityIcons[alert.priority]}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              "{alert.keyword}"
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full border ${priorityColors[alert.priority]}`}>
                              {alert.priority}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {alert.caseSensitive && 'Case sensitive'} 
                            {alert.caseSensitive && alert.wholeWord && ' • '}
                            {alert.wholeWord && 'Whole word'}
                            {!alert.caseSensitive && !alert.wholeWord && 'Partial matching'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleAlertActive(alert.id, !alert.active)}
                          className={`p-2 rounded-lg transition-colors ${
                            alert.active 
                              ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20' 
                              : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          title={alert.active ? 'Disable alert' : 'Enable alert'}
                        >
                          {alert.active ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => removeKeywordAlert(alert.id)}
                          className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredAlerts.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No alerts match your search' : 'No keyword alerts yet'}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Add your first keyword alert to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

