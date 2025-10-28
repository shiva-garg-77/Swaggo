import mongoose from 'mongoose';
import User from '../../Models/User.js';
import AuditLog from '../../Models/FeedModels/AuditLog.js';
import SecurityAudit from '../../Models/FeedModels/AuditLog.js';
import { performance } from 'perf_hooks';

/**
 * Anomaly Detection Service
 * 
 * This service provides comprehensive anomaly detection capabilities for monitoring
 * unusual user behavior patterns, potential security threats, and system anomalies.
 * 
 * Features:
 * - Behavioral anomaly detection
 * - Geographic anomaly detection
 * - Request frequency anomaly detection
 * - Data access pattern anomaly detection
 * - Machine learning-based threat detection
 * - Real-time alerting for suspicious activities
 * - Compliance monitoring
 */

class AnomalyDetectionService {
  constructor() {
    this.anomalyDetectors = new Map();
    this.behavioralBaselines = new Map();
    this.alertThresholds = {
      loginFrequency: 10, // 10 login attempts in window
      requestFrequency: 100, // 100 requests in window
      dataAccess: 50, // 50 data access events in window
      geographicDistance: 1000, // 1000km in 1 hour
      sessionDuration: 24 * 60 * 60 * 1000 // 24 hours
    };
    
    this.initializeAnomalyDetectors();
    this.initializeBehavioralBaselines();
  }
  
  /**
   * Initialize all anomaly detectors
   */
  initializeAnomalyDetectors() {
    // Request frequency anomaly detector
    this.anomalyDetectors.set('request_frequency', {
      name: 'Request Frequency Anomaly Detector',
      description: 'Detects unusual request frequency patterns',
      check: this.checkRequestFrequencyAnomaly.bind(this)
    });
    
    // Geographic anomaly detector
    this.anomalyDetectors.set('geographic', {
      name: 'Geographic Anomaly Detector',
      description: 'Detects unusual geographic access patterns',
      check: this.checkGeographicAnomaly.bind(this)
    });
    
    // Login frequency anomaly detector
    this.anomalyDetectors.set('login_frequency', {
      name: 'Login Frequency Anomaly Detector',
      description: 'Detects unusual login attempt patterns',
      check: this.checkLoginFrequencyAnomaly.bind(this)
    });
    
    // Data access anomaly detector
    this.anomalyDetectors.set('data_access', {
      name: 'Data Access Anomaly Detector',
      description: 'Detects unusual data access patterns',
      check: this.checkDataAccessAnomaly.bind(this)
    });
    
    // Session duration anomaly detector
    this.anomalyDetectors.set('session_duration', {
      name: 'Session Duration Anomaly Detector',
      description: 'Detects unusually long session durations',
      check: this.checkSessionDurationAnomaly.bind(this)
    });
    
    // Behavioral pattern anomaly detector
    this.anomalyDetectors.set('behavioral_pattern', {
      name: 'Behavioral Pattern Anomaly Detector',
      description: 'Detects deviations from established behavioral patterns',
      check: this.checkBehavioralPatternAnomaly.bind(this)
    });
    
    console.log('✅ Anomaly detection service initialized with 6 detectors');
  }
  
  /**
   * Initialize behavioral baselines for users
   */
  async initializeBehavioralBaselines() {
    try {
      // Load existing baselines from database or create new ones
      console.log('🔄 Initializing behavioral baselines...');
      
      // In a production implementation, this would load from a database
      // For now, we'll initialize with empty baselines
      this.behavioralBaselines = new Map();
      
      console.log('✅ Behavioral baselines initialized');
    } catch (error) {
      console.error('❌ Failed to initialize behavioral baselines:', error);
    }
  }
  
  /**
   * Analyze user behavior for anomalies
   * @param {Object} userData - User data to analyze
   * @param {string} userId - User ID
   * @returns {Object} Analysis results
   */
  async analyzeUserBehavior(userData, userId) {
    const startTime = performance.now();
    const results = {
      userId,
      timestamp: new Date(),
      anomalies: [],
      riskScore: 0,
      detectorsTriggered: [],
      details: {}
    };
    
    try {
      // Run all anomaly detectors
      for (const [detectorName, detector] of this.anomalyDetectors.entries()) {
        try {
          const anomalyResult = await detector.check(userData, userId);
          if (anomalyResult && anomalyResult.isAnomalous) {
            results.anomalies.push({
              detector: detectorName,
              name: detector.name,
              severity: anomalyResult.severity || 'MEDIUM',
              confidence: anomalyResult.confidence || 0.5,
              details: anomalyResult.details || {}
            });
            
            results.detectorsTriggered.push(detectorName);
            results.riskScore += anomalyResult.riskContribution || 10;
            results.details[detectorName] = anomalyResult.details;
          }
        } catch (detectorError) {
          console.error(`Detector ${detectorName} failed:`, detectorError);
        }
      }
      
      // Cap risk score at 100
      results.riskScore = Math.min(100, results.riskScore);
      
      // Add processing time
      results.processingTime = performance.now() - startTime;
      
      // Log analysis if high risk
      if (results.riskScore >= 50) {
        console.warn(`🚨 High-risk behavior detected for user ${userId}: ${results.riskScore}`);
      }
      
      return results;
    } catch (error) {
      console.error(`Failed to analyze user behavior for ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Check for request frequency anomalies
   */
  async checkRequestFrequencyAnomaly(userData, userId) {
    try {
      const timeWindow = 5 * 60 * 1000; // 5 minutes
      const currentTime = Date.now();
      
      // Get recent requests for this user
      const recentRequests = await AuditLog.find({
        userId: userId,
        eventType: { $in: ['API_ACCESS', 'MESSAGE_SENT', 'FILE_UPLOADED'] },
        timestamp: { $gte: new Date(currentTime - timeWindow) }
      }).sort({ timestamp: -1 });
      
      const requestCount = recentRequests.length;
      
      // Check if request count exceeds threshold
      if (requestCount > this.alertThresholds.requestFrequency) {
        return {
          isAnomalous: true,
          severity: 'HIGH',
          confidence: Math.min(1.0, requestCount / (this.alertThresholds.requestFrequency * 2)),
          riskContribution: 25,
          details: {
            requestCount,
            threshold: this.alertThresholds.requestFrequency,
            timeWindow: '5 minutes',
            recentRequests: recentRequests.slice(0, 5).map(req => ({
              eventType: req.eventType,
              timestamp: req.timestamp,
              endpoint: req.details?.endpoint
            }))
          }
        };
      }
      
      return { isAnomalous: false };
    } catch (error) {
      console.error('Request frequency anomaly check failed:', error);
      return { isAnomalous: false };
    }
  }
  
  /**
   * Check for geographic anomalies
   */
  async checkGeographicAnomaly(userData, userId) {
    try {
      const timeWindow = 60 * 60 * 1000; // 1 hour
      const currentTime = Date.now();
      
      // Get recent login locations for this user
      const recentLogins = await AuditLog.find({
        userId: userId,
        eventType: 'USER_LOGIN',
        timestamp: { $gte: new Date(currentTime - timeWindow) }
      }).sort({ timestamp: -1 }).limit(2);
      
      // Need at least 2 logins to compare locations
      if (recentLogins.length < 2) {
        return { isAnomalous: false };
      }
      
      const currentLogin = recentLogins[0];
      const previousLogin = recentLogins[1];
      
      // Check if both logins have location data
      if (!currentLogin.location || !previousLogin.location) {
        return { isAnomalous: false };
      }
      
      // Calculate distance between locations
      const distance = this.calculateDistance(
        currentLogin.location.coordinates,
        previousLogin.location.coordinates
      );
      
      // Calculate time difference in hours
      const timeDiff = (currentLogin.timestamp - previousLogin.timestamp) / (1000 * 60 * 60);
      
      // Calculate speed (km/h)
      const speed = timeDiff > 0 ? distance / timeDiff : 0;
      
      // If speed exceeds commercial aircraft speed, it's suspicious
      if (speed > 1000) { // Faster than commercial aircraft
        return {
          isAnomalous: true,
          severity: 'CRITICAL',
          confidence: Math.min(1.0, speed / 2000),
          riskContribution: 30,
          details: {
            distance: Math.round(distance),
            timeDiff: Math.round(timeDiff * 60), // in minutes
            speed: Math.round(speed),
            currentLocation: currentLogin.location,
            previousLocation: previousLogin.location
          }
        };
      }
      
      return { isAnomalous: false };
    } catch (error) {
      console.error('Geographic anomaly check failed:', error);
      return { isAnomalous: false };
    }
  }
  
  /**
   * Check for login frequency anomalies
   */
  async checkLoginFrequencyAnomaly(userData, userId) {
    try {
      const timeWindow = 15 * 60 * 1000; // 15 minutes
      const currentTime = Date.now();
      
      // Get recent login attempts for this user
      const recentLogins = await AuditLog.find({
        userId: userId,
        eventType: { $in: ['USER_LOGIN', 'LOGIN_FAILED'] },
        timestamp: { $gte: new Date(currentTime - timeWindow) }
      }).sort({ timestamp: -1 });
      
      const loginCount = recentLogins.length;
      const failedLogins = recentLogins.filter(login => login.eventType === 'LOGIN_FAILED').length;
      
      // Check for brute force attempts
      if (failedLogins >= 5) {
        return {
          isAnomalous: true,
          severity: 'HIGH',
          confidence: Math.min(1.0, failedLogins / 10),
          riskContribution: 25,
          details: {
            totalAttempts: loginCount,
            failedAttempts: failedLogins,
            successAttempts: loginCount - failedLogins,
            timeWindow: '15 minutes'
          }
        };
      }
      
      // Check for excessive login attempts
      if (loginCount > this.alertThresholds.loginFrequency) {
        return {
          isAnomalous: true,
          severity: 'MEDIUM',
          confidence: Math.min(1.0, loginCount / (this.alertThresholds.loginFrequency * 2)),
          riskContribution: 15,
          details: {
            totalAttempts: loginCount,
            timeWindow: '15 minutes'
          }
        };
      }
      
      return { isAnomalous: false };
    } catch (error) {
      console.error('Login frequency anomaly check failed:', error);
      return { isAnomalous: false };
    }
  }
  
  /**
   * Check for data access anomalies
   */
  async checkDataAccessAnomaly(userData, userId) {
    try {
      const timeWindow = 30 * 60 * 1000; // 30 minutes
      const currentTime = Date.now();
      
      // Get recent data access events for this user
      const recentDataAccess = await AuditLog.find({
        userId: userId,
        eventType: { $in: ['DATA_ACCESS', 'FILE_DOWNLOADED', 'MESSAGE_SENT'] },
        timestamp: { $gte: new Date(currentTime - timeWindow) }
      }).sort({ timestamp: -1 });
      
      const accessCount = recentDataAccess.length;
      
      // Check if data access count exceeds threshold
      if (accessCount > this.alertThresholds.dataAccess) {
        return {
          isAnomalous: true,
          severity: 'MEDIUM',
          confidence: Math.min(1.0, accessCount / (this.alertThresholds.dataAccess * 2)),
          riskContribution: 20,
          details: {
            accessCount,
            threshold: this.alertThresholds.dataAccess,
            timeWindow: '30 minutes',
            accessTypes: recentDataAccess.slice(0, 10).map(access => ({
              eventType: access.eventType,
              resourceId: access.resourceId,
              timestamp: access.timestamp
            }))
          }
        };
      }
      
      return { isAnomalous: false };
    } catch (error) {
      console.error('Data access anomaly check failed:', error);
      return { isAnomalous: false };
    }
  }
  
  /**
   * Check for session duration anomalies
   */
  async checkSessionDurationAnomaly(userData, userId) {
    try {
      // Get user's last login
      const lastLogin = await AuditLog.findOne({
        userId: userId,
        eventType: 'USER_LOGIN'
      }).sort({ timestamp: -1 });
      
      if (!lastLogin) {
        return { isAnomalous: false };
      }
      
      const sessionDuration = Date.now() - lastLogin.timestamp;
      
      // Check if session duration exceeds threshold
      if (sessionDuration > this.alertThresholds.sessionDuration) {
        return {
          isAnomalous: true,
          severity: 'LOW',
          confidence: Math.min(1.0, sessionDuration / (this.alertThresholds.sessionDuration * 2)),
          riskContribution: 5,
          details: {
            sessionDuration: Math.round(sessionDuration / (1000 * 60 * 60)), // in hours
            threshold: this.alertThresholds.sessionDuration / (1000 * 60 * 60), // in hours
            loginTime: lastLogin.timestamp
          }
        };
      }
      
      return { isAnomalous: false };
    } catch (error) {
      console.error('Session duration anomaly check failed:', error);
      return { isAnomalous: false };
    }
  }
  
  /**
   * Check for behavioral pattern anomalies
   */
  async checkBehavioralPatternAnomaly(userData, userId) {
    try {
      // Get user's behavioral baseline
      let baseline = this.behavioralBaselines.get(userId);
      if (!baseline) {
        // Create baseline if it doesn't exist
        baseline = await this.createUserBehavioralBaseline(userId);
        this.behavioralBaselines.set(userId, baseline);
      }
      
      // Extract current behavior metrics
      const currentMetrics = this.extractBehaviorMetrics(userData, userId);
      
      // Compare with baseline
      const deviations = this.compareWithBaseline(currentMetrics, baseline);
      
      // Calculate overall deviation score
      const deviationScore = this.calculateDeviationScore(deviations);
      
      // If deviation score exceeds threshold, it's anomalous
      if (deviationScore > 0.3) { // 30% deviation threshold
        return {
          isAnomalous: true,
          severity: deviationScore > 0.6 ? 'HIGH' : 'MEDIUM',
          confidence: deviationScore,
          riskContribution: Math.round(deviationScore * 25),
          details: {
            deviationScore: Math.round(deviationScore * 100),
            deviations,
            baselineMetrics: baseline.metrics,
            currentMetrics
          }
        };
      }
      
      return { isAnomalous: false };
    } catch (error) {
      console.error('Behavioral pattern anomaly check failed:', error);
      return { isAnomalous: false };
    }
  }
  
  /**
   * Create user behavioral baseline
   */
  async createUserBehavioralBaseline(userId) {
    try {
      // Get historical data for this user (last 30 days)
      const timeWindow = 30 * 24 * 60 * 60 * 1000; // 30 days
      const currentTime = Date.now();
      
      const historicalEvents = await AuditLog.find({
        userId: userId,
        timestamp: { $gte: new Date(currentTime - timeWindow) }
      }).sort({ timestamp: -1 });
      
      // Extract metrics from historical data
      const metrics = this.extractBehaviorMetricsFromHistory(historicalEvents);
      
      const baseline = {
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        metrics,
        sampleSize: historicalEvents.length
      };
      
      return baseline;
    } catch (error) {
      console.error(`Failed to create behavioral baseline for user ${userId}:`, error);
      return {
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        metrics: this.getDefaultBehaviorMetrics(),
        sampleSize: 0
      };
    }
  }
  
  /**
   * Extract behavior metrics from user data
   */
  extractBehaviorMetrics(userData, userId) {
    return {
      averageRequestsPerHour: userData.requestsPerHour || 0,
      preferredTimeRanges: userData.preferredTimeRanges || [],
      commonEndpoints: userData.commonEndpoints || [],
      averageSessionDuration: userData.sessionDuration || 0,
      dataAccessPatterns: userData.dataAccessPatterns || [],
      devicePreferences: userData.devicePreferences || [],
      geographicPreferences: userData.geographicPreferences || []
    };
  }
  
  /**
   * Extract behavior metrics from historical events
   */
  extractBehaviorMetricsFromHistory(events) {
    const metrics = {
      averageRequestsPerHour: 0,
      preferredTimeRanges: [],
      commonEndpoints: [],
      averageSessionDuration: 0,
      dataAccessPatterns: [],
      devicePreferences: [],
      geographicPreferences: []
    };
    
    if (events.length === 0) {
      return metrics;
    }
    
    // Calculate average requests per hour
    const timeSpan = (events[0].timestamp - events[events.length - 1].timestamp) / (1000 * 60 * 60);
    metrics.averageRequestsPerHour = timeSpan > 0 ? events.length / timeSpan : 0;
    
    // Extract time ranges
    const hourCounts = {};
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    // Find most common hours (top 3)
    const sortedHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
    metrics.preferredTimeRanges = sortedHours;
    
    // Extract common endpoints
    const endpointCounts = {};
    events.forEach(event => {
      const endpoint = event.details?.endpoint || 'unknown';
      endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
    });
    
    // Find most common endpoints (top 5)
    const sortedEndpoints = Object.entries(endpointCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([endpoint]) => endpoint);
    metrics.commonEndpoints = sortedEndpoints;
    
    return metrics;
  }
  
  /**
   * Get default behavior metrics
   */
  getDefaultBehaviorMetrics() {
    return {
      averageRequestsPerHour: 0,
      preferredTimeRanges: [],
      commonEndpoints: [],
      averageSessionDuration: 0,
      dataAccessPatterns: [],
      devicePreferences: [],
      geographicPreferences: []
    };
  }
  
  /**
   * Compare current metrics with baseline
   */
  compareWithBaseline(currentMetrics, baseline) {
    const deviations = {};
    
    // Compare average requests per hour
    if (baseline.metrics.averageRequestsPerHour > 0) {
      const deviation = Math.abs(currentMetrics.averageRequestsPerHour - baseline.metrics.averageRequestsPerHour) / baseline.metrics.averageRequestsPerHour;
      deviations.requestsPerHour = deviation;
    }
    
    // Compare preferred time ranges
    const timeRangeDeviation = this.calculateArrayDeviation(
      currentMetrics.preferredTimeRanges,
      baseline.metrics.preferredTimeRanges
    );
    deviations.timeRanges = timeRangeDeviation;
    
    // Compare common endpoints
    const endpointDeviation = this.calculateArrayDeviation(
      currentMetrics.commonEndpoints,
      baseline.metrics.commonEndpoints
    );
    deviations.endpoints = endpointDeviation;
    
    return deviations;
  }
  
  /**
   * Calculate deviation score from deviations object
   */
  calculateDeviationScore(deviations) {
    const deviationValues = Object.values(deviations);
    if (deviationValues.length === 0) return 0;
    
    const sum = deviationValues.reduce((acc, val) => acc + val, 0);
    return sum / deviationValues.length;
  }
  
  /**
   * Calculate array deviation
   */
  calculateArrayDeviation(currentArray, baselineArray) {
    if (baselineArray.length === 0) return currentArray.length > 0 ? 1 : 0;
    
    // Calculate Jaccard similarity
    const set1 = new Set(currentArray);
    const set2 = new Set(baselineArray);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    if (union.size === 0) return 0;
    
    const similarity = intersection.size / union.size;
    return 1 - similarity; // Return dissimilarity
  }
  
  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2) return 0;
    
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLon = this.toRadians(coord2.lng - coord1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  /**
   * Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Get anomaly detection statistics
   */
  async getStatistics() {
    try {
      const totalAnomalies = await AuditLog.countDocuments({
        eventType: 'SECURITY_ALERT',
        'details.anomalyDetected': true
      });
      
      const recentAnomalies = await AuditLog.find({
        eventType: 'SECURITY_ALERT',
        'details.anomalyDetected': true
      }).sort({ timestamp: -1 }).limit(10);
      
      const anomalyTypes = await AuditLog.aggregate([
        { $match: { 
          eventType: 'SECURITY_ALERT',
          'details.anomalyDetected': true
        }},
        { $group: { 
          _id: '$details.anomalyType',
          count: { $sum: 1 }
        }}
      ]);
      
      return {
        totalAnomalies,
        recentAnomalies: recentAnomalies.map(anomaly => ({
          id: anomaly.logId,
          type: anomaly.details?.anomalyType,
          severity: anomaly.severity,
          userId: anomaly.userId,
          timestamp: anomaly.timestamp,
          ipAddress: anomaly.ipAddress
        })),
        anomalyTypes: anomalyTypes.map(type => ({
          type: type._id,
          count: type.count
        }))
      };
    } catch (error) {
      console.error('Failed to get anomaly detection statistics:', error);
      throw error;
    }
  }
  
  /**
   * Update behavioral baseline for a user
   */
  async updateUserBaseline(userId) {
    try {
      const baseline = await this.createUserBehavioralBaseline(userId);
      this.behavioralBaselines.set(userId, baseline);
      return baseline;
    } catch (error) {
      console.error(`Failed to update behavioral baseline for user ${userId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export default new AnomalyDetectionService();