import express from 'express';
import authMiddleware from '../../../Middleware/Authentication/AuthenticationMiddleware.js';

// Note: In a real implementation, this would interface with the Python AI features
// For now, we'll simulate the notification engine functionality

// In-memory storage for keyword alerts (in a real app, this would be in a database)
const keywordAlerts = {};

const router = express.Router();

// Get keyword alerts for a user
router.get('/:userId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user has permission to view these alerts
    if (userId !== req.user.profileid) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    const alerts = keywordAlerts[userId] || [];
    
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching keyword alerts:', error);
    res.status(500).json({ error: 'Failed to fetch keyword alerts' });
  }
});

// Create a new keyword alert
router.post('/', authMiddleware.authenticate, async (req, res) => {
  try {
    const { keyword, priority = 'medium', caseSensitive = false, wholeWord = true } = req.body;
    const userId = req.user.profileid;
    
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }
    
    // Initialize alerts array for user if it doesn't exist
    if (!keywordAlerts[userId]) {
      keywordAlerts[userId] = [];
    }
    
    // Create new alert
    const newAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      keyword,
      priority,
      caseSensitive,
      wholeWord,
      active: true,
      createdAt: new Date().toISOString()
    };
    
    keywordAlerts[userId].push(newAlert);
    
    res.status(201).json(newAlert);
  } catch (error) {
    console.error('Error creating keyword alert:', error);
    res.status(500).json({ error: 'Failed to create keyword alert' });
  }
});

// Update a keyword alert
router.patch('/:alertId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { active } = req.body;
    const userId = req.user.profileid;
    
    // Check if user has alerts
    if (!keywordAlerts[userId]) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    // Find and update the alert
    const alertIndex = keywordAlerts[userId].findIndex(alert => alert.id === alertId);
    if (alertIndex === -1) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    keywordAlerts[userId][alertIndex].active = active;
    
    res.json(keywordAlerts[userId][alertIndex]);
  } catch (error) {
    console.error('Error updating keyword alert:', error);
    res.status(500).json({ error: 'Failed to update keyword alert' });
  }
});

// Delete a keyword alert
router.delete('/:alertId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user.profileid;
    
    // Check if user has alerts
    if (!keywordAlerts[userId]) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    // Remove the alert
    const initialLength = keywordAlerts[userId].length;
    keywordAlerts[userId] = keywordAlerts[userId].filter(alert => alert.id !== alertId);
    
    if (keywordAlerts[userId].length === initialLength) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting keyword alert:', error);
    res.status(500).json({ error: 'Failed to delete keyword alert' });
  }
});

// Test keyword matching
router.post('/test', authMiddleware.authenticate, async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    // Check if user has permission to test these alerts
    if (userId !== req.user.profileid) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Get user's alerts
    const alerts = keywordAlerts[userId] || [];
    
    // Simple keyword matching logic
    const results = {
      keyword_matches: [],
      mentions: [],
      urgency_level: 'low',
      should_notify: false,
      notification_reason: ''
    };
    
    if (message && alerts.length > 0) {
      const contentLower = message.toLowerCase();
      
      // Check for keyword matches
      for (const alert of alerts) {
        if (!alert.active) continue;
        
        const keyword = alert.keyword;
        const searchContent = alert.caseSensitive ? message : contentLower;
        
        let isMatch = false;
        if (alert.wholeWord) {
          // Whole word matching
          const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, alert.caseSensitive ? 'g' : 'gi');
          isMatch = regex.test(searchContent);
        } else {
          // Partial matching
          isMatch = searchContent.includes(alert.caseSensitive ? keyword : keyword.toLowerCase());
        }
        
        if (isMatch) {
          results.keyword_matches.push({
            keyword: alert.keyword,
            priority: alert.priority,
            match_type: alert.wholeWord ? 'whole_word' : 'partial'
          });
        }
      }
      
      // Check for mentions (simple @username pattern)
      const mentionRegex = /@(\w+)/g;
      let mentionMatch;
      while ((mentionMatch = mentionRegex.exec(message)) !== null) {
        results.mentions.push({
          mentioned_user: mentionMatch[1],
          pattern_type: 'direct'
        });
      }
      
      // Determine urgency level based on content
      const urgencyKeywords = {
        critical: ['urgent', 'emergency', 'asap', 'critical', 'important'],
        high: ['meeting', 'deadline', 'project', 'task', 'reminder'],
        medium: ['update', 'status', 'progress', 'review'],
        low: ['info', 'general', 'news', 'update']
      };
      
      for (const [level, keywords] of Object.entries(urgencyKeywords)) {
        if (keywords.some(keyword => contentLower.includes(keyword))) {
          results.urgency_level = level;
          break;
        }
      }
      
      // Determine if notification should be sent
      if (results.keyword_matches.length > 0 || results.mentions.length > 0) {
        results.should_notify = true;
        if (results.keyword_matches.length > 0) {
          results.notification_reason = `Keyword match: ${results.keyword_matches.map(m => m.keyword).join(', ')}`;
        }
        if (results.mentions.length > 0) {
          results.notification_reason += results.keyword_matches.length > 0 ? ` | Mentions: ${results.mentions.map(m => m.mentioned_user).join(', ')}` : `Mentions: ${results.mentions.map(m => m.mentioned_user).join(', ')}`;
        }
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error testing keyword matching:', error);
    res.status(500).json({ error: 'Failed to test keyword matching' });
  }
});

export default router;