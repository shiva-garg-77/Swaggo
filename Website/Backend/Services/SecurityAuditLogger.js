import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Security Audit Schema for MongoDB logging
 */
const SecurityAuditSchema = new mongoose.Schema({
    // Event Information
    eventType: {
        type: String,
        required: true,
        enum: [
            'LOGIN_ATTEMPT', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_BLOCKED',
            'LOGOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETE',
            'TOKEN_REFRESH', 'TOKEN_REFRESH_FAILED', 'TOKEN_ROTATION', 'TOKEN_THEFT_DETECTED',
            'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_REACTIVATED',
            'PERMISSION_DENIED', 'UNAUTHORIZED_ACCESS', 'SUSPICIOUS_ACTIVITY',
            '2FA_ENABLED', '2FA_DISABLED', '2FA_VERIFICATION', '2FA_FAILED',
            'SESSION_CREATED', 'SESSION_EXPIRED', 'SESSION_TERMINATED',
            'DATA_EXPORT', 'DATA_DELETE', 'PROFILE_UPDATE', 'SECURITY_SETTING_CHANGE',
            'API_RATE_LIMIT', 'BRUTE_FORCE_DETECTED', 'SQL_INJECTION_ATTEMPT', 'XSS_ATTEMPT'
        ]
    },
    severity: {
        type: String,
        required: true,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    // User Information
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    username: String,
    email: String,
    
    // Request Information
    ip: {
        type: String,
        required: true,
        index: true
    },
    userAgent: String,
    requestId: String,
    sessionId: String,
    
    // Event Details
    details: {
        action: String,
        resource: String,
        method: String,
        endpoint: String,
        statusCode: Number,
        errorMessage: String,
        additionalInfo: mongoose.Schema.Types.Mixed
    },
    
    // Location Information (if available)
    location: {
        country: String,
        city: String,
        region: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    
    // Device Information
    device: {
        type: String, // mobile, desktop, tablet
        os: String,
        browser: String,
        version: String
    },
    
    // Security Context
    securityContext: {
        threatLevel: String,
        riskScore: Number,
        anomalyDetected: Boolean,
        requiresReview: Boolean,
        reviewedBy: String,
        reviewedAt: Date,
        actionTaken: String
    },
    
    // Metadata
    metadata: mongoose.Schema.Types.Mixed
});

// Indexes for efficient querying
SecurityAuditSchema.index({ eventType: 1, timestamp: -1 });
SecurityAuditSchema.index({ userId: 1, timestamp: -1 });
SecurityAuditSchema.index({ 'securityContext.requiresReview': 1 });
SecurityAuditSchema.index({ severity: 1, timestamp: -1 });

const SecurityAudit = mongoose.models.SecurityAudit || mongoose.model('SecurityAudit', SecurityAuditSchema);

/**
 * Security Audit Logger Service
 * Provides comprehensive logging for security-critical operations
 */
class SecurityAuditLogger {
    constructor() {
        this.logQueue = [];
        this.batchSize = 10;
        this.flushInterval = 5000; // 5 seconds
        this.fileLogPath = path.join(__dirname, '../../logs/security');
        this.alertThresholds = {
            failedLogins: 5,
            tokenRefreshFailures: 3,
            suspiciousActivities: 2
        };
        
        // Ensure log directory exists
        this.ensureLogDirectory();
        
        // Start batch processing
        this.startBatchProcessor();
        
        // Track recent events for anomaly detection
        this.recentEvents = new Map();
    }
    
    ensureLogDirectory() {
        try {
            if (!fs.existsSync(this.fileLogPath)) {
                fs.mkdirSync(this.fileLogPath, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create log directory:', error);
        }
    }
    
    /**
     * Main logging method with comprehensive sanitization
     */
    async log(eventData) {
        try {
            // 🛡️ CRITICAL SECURITY FIX: Sanitize all log data before processing
            eventData = this.sanitizeLogData(eventData);
            
            // Determine severity if not provided
            if (!eventData.severity) {
                eventData.severity = this.determineSeverity(eventData.eventType);
            }
            
            // Add timestamp if not provided
            if (!eventData.timestamp) {
                eventData.timestamp = new Date();
            }
            
            // Check for anomalies
            const anomaly = await this.detectAnomaly(eventData);
            if (anomaly) {
                eventData.securityContext = {
                    ...eventData.securityContext,
                    anomalyDetected: true,
                    requiresReview: true,
                    threatLevel: anomaly.level,
                    riskScore: anomaly.score
                };
            }
            
            // Add to queue for batch processing
            this.logQueue.push(eventData);
            
            // Write to file for critical events
            if (eventData.severity === 'CRITICAL' || eventData.severity === 'HIGH') {
                this.writeToFile(eventData);
            }
            
            // Send alerts for critical events
            if (eventData.severity === 'CRITICAL') {
                await this.sendAlert(eventData);
            }
            
            // Process immediately if queue is full
            if (this.logQueue.length >= this.batchSize) {
                await this.flushLogs();
            }
            
            return true;
        } catch (error) {
            console.error('SecurityAuditLogger error:', error);
            // Fallback to file logging
            this.writeToFile({
                eventType: 'LOGGING_ERROR',
                severity: 'HIGH',
                error: error.message,
                originalEvent: eventData
            });
            return false;
        }
    }
    
    /**
     * Log login attempt
     */
    async logLoginAttempt(user, ip, userAgent, success, reason = null) {
        const eventData = {
            eventType: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
            severity: success ? 'LOW' : 'MEDIUM',
            userId: user?._id,
            username: user?.username,
            email: user?.email,
            ip,
            userAgent,
            details: {
                action: 'login',
                method: 'POST',
                endpoint: '/api/login',
                statusCode: success ? 200 : 401,
                errorMessage: reason
            }
        };
        
        // Check for brute force
        if (!success) {
            const recentFailures = await this.countRecentEvents(ip, 'LOGIN_FAILED', 15);
            if (recentFailures >= this.alertThresholds.failedLogins) {
                eventData.eventType = 'BRUTE_FORCE_DETECTED';
                eventData.severity = 'HIGH';
                eventData.securityContext = {
                    threatLevel: 'HIGH',
                    riskScore: 0.8,
                    requiresReview: true
                };
            }
        }
        
        return this.log(eventData);
    }
    
    /**
     * Log token operations
     */
    async logTokenOperation(type, userId, ip, success, details = {}) {
        const eventTypes = {
            refresh: success ? 'TOKEN_REFRESH' : 'TOKEN_REFRESH_FAILED',
            rotation: 'TOKEN_ROTATION',
            theft: 'TOKEN_THEFT_DETECTED'
        };
        
        return this.log({
            eventType: eventTypes[type] || 'TOKEN_OPERATION',
            severity: type === 'theft' ? 'CRITICAL' : (success ? 'LOW' : 'MEDIUM'),
            userId,
            ip,
            details: {
                action: `token_${type}`,
                ...details
            }
        });
    }
    
    /**
     * Log password operations
     */
    async logPasswordOperation(type, user, ip, userAgent, success = true) {
        const eventTypes = {
            change: 'PASSWORD_CHANGE',
            reset_request: 'PASSWORD_RESET_REQUEST',
            reset_complete: 'PASSWORD_RESET_COMPLETE'
        };
        
        return this.log({
            eventType: eventTypes[type],
            severity: 'MEDIUM',
            userId: user._id,
            username: user.username,
            email: user.email,
            ip,
            userAgent,
            details: {
                action: type,
                success
            }
        });
    }
    
    /**
     * Log suspicious activity
     */
    async logSuspiciousActivity(type, details, ip, userId = null) {
        return this.log({
            eventType: 'SUSPICIOUS_ACTIVITY',
            severity: 'HIGH',
            userId,
            ip,
            details: {
                suspicionType: type,
                ...details
            },
            securityContext: {
                requiresReview: true,
                anomalyDetected: true
            }
        });
    }
    
    /**
     * Log rate limiting events
     */
    async logRateLimit(endpoint, ip, userId = null) {
        return this.log({
            eventType: 'API_RATE_LIMIT',
            severity: 'MEDIUM',
            userId,
            ip,
            details: {
                action: 'rate_limit_exceeded',
                endpoint
            }
        });
    }
    
    /**
     * Batch processor for efficient DB writes
     */
    startBatchProcessor() {
        setInterval(async () => {
            if (this.logQueue.length > 0) {
                await this.flushLogs();
            }
        }, this.flushInterval);
    }
    
    async flushLogs() {
        if (this.logQueue.length === 0) return;
        
        const logsToProcess = [...this.logQueue];
        this.logQueue = [];
        
        try {
            await SecurityAudit.insertMany(logsToProcess);
        } catch (error) {
            console.error('Failed to flush security logs:', error);
            // Write to file as fallback
            logsToProcess.forEach(log => this.writeToFile(log));
        }
    }
    
    /**
     * Write critical logs to file
     */
    writeToFile(eventData) {
        try {
            const date = new Date();
            const fileName = `security-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.log`;
            const filePath = path.join(this.fileLogPath, fileName);
            const logEntry = `${date.toISOString()} | ${eventData.severity} | ${eventData.eventType} | ${JSON.stringify(eventData)}\n`;
            
            fs.appendFileSync(filePath, logEntry, 'utf8');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    
    /**
     * Anomaly detection
     */
    async detectAnomaly(eventData) {
        try {
            // Check for unusual login patterns
            if (eventData.eventType === 'LOGIN_SUCCESS') {
                const lastLogin = await SecurityAudit.findOne({
                    userId: eventData.userId,
                    eventType: 'LOGIN_SUCCESS'
                }).sort({ timestamp: -1 });
                
                if (lastLogin) {
                    // Check for rapid location changes
                    if (lastLogin.location && eventData.location) {
                        const timeDiff = eventData.timestamp - lastLogin.timestamp;
                        const distance = this.calculateDistance(
                            lastLogin.location.coordinates,
                            eventData.location.coordinates
                        );
                        
                        // If logged in from very far location in short time
                        if (distance > 1000 && timeDiff < 3600000) { // 1000km in 1 hour
                            return {
                                level: 'HIGH',
                                score: 0.9,
                                reason: 'Impossible travel detected'
                            };
                        }
                    }
                }
            }
            
            // Check for multiple failed attempts from same IP
            const failedAttempts = await this.countRecentEvents(
                eventData.ip,
                'LOGIN_FAILED',
                15
            );
            
            if (failedAttempts > 10) {
                return {
                    level: 'CRITICAL',
                    score: 1.0,
                    reason: 'Excessive failed login attempts'
                };
            }
        } catch (error) {
            console.error('Anomaly detection error:', error);
        }
        
        return null;
    }
    
    /**
     * Count recent events of a specific type
     */
    async countRecentEvents(identifier, eventType, minutes) {
        try {
            const since = new Date(Date.now() - minutes * 60 * 1000);
            
            const count = await SecurityAudit.countDocuments({
                $or: [
                    { ip: identifier },
                    { userId: identifier }
                ],
                eventType,
                timestamp: { $gte: since }
            });
            
            return count;
        } catch (error) {
            console.error('Error counting recent events:', error);
            return 0;
        }
    }
    
    /**
     * 🛡️ COMPREHENSIVE LOG DATA SANITIZATION
     * Removes all sensitive information from log data to prevent data leakage
     */
    sanitizeLogData(eventData) {
        if (!eventData || typeof eventData !== 'object') {
            return eventData;
        }
        
        // Deep clone to avoid modifying original object
        const sanitized = JSON.parse(JSON.stringify(eventData));
        
        // 🔐 CRITICAL: Remove sensitive data that should NEVER be logged
        const sensitiveFields = [
            'password', 'passwordHash', 'secret', 'token', 'key', 'apiKey',
            'refreshToken', 'accessToken', 'authToken', 'sessionToken',
            'csrfToken', 'otp', '2faCode', 'mfaCode', 'verificationCode',
            'privateKey', 'secretKey', 'encryptionKey', 'salt', 'pepper',
            'cookieSecret', 'jwtSecret', 'databasePassword', 'redisPassword',
            'smtpPassword', 'sslKey', 'certificate', 'privateKeyData'
        ];
        
        // Recursively sanitize object
        const sanitizeObject = (obj, path = '') => {
            if (!obj || typeof obj !== 'object') {
                return obj;
            }
            
            for (const key in obj) {
                const fullPath = path ? `${path}.${key}` : key;
                const lowercaseKey = key.toLowerCase();
                const lowercaseFullPath = fullPath.toLowerCase();
                
                // Remove sensitive fields completely
                if (sensitiveFields.some(field => 
                    lowercaseKey.includes(field.toLowerCase()) ||
                    lowercaseFullPath.includes(field.toLowerCase())
                )) {
                    obj[key] = '[REDACTED]';
                    continue;
                }
                
                // Sanitize email addresses (keep domain, mask local part)
                if ((lowercaseKey.includes('email') || lowercaseKey.includes('mail')) && 
                    typeof obj[key] === 'string' && obj[key].includes('@')) {
                    obj[key] = this.maskEmail(obj[key]);
                    continue;
                }
                
                // Sanitize IP addresses (keep first 2 octets for IPv4, first 4 groups for IPv6)
                if ((lowercaseKey.includes('ip') || lowercaseKey === 'address') && 
                    typeof obj[key] === 'string') {
                    obj[key] = this.maskIPAddress(obj[key]);
                    continue;
                }
                
                // Sanitize user agents (remove version info that could be fingerprinting)
                if (lowercaseKey.includes('useragent') && typeof obj[key] === 'string') {
                    obj[key] = this.sanitizeUserAgent(obj[key]);
                    continue;
                }
                
                // Sanitize URLs (remove query parameters that might contain sensitive data)
                if ((lowercaseKey.includes('url') || lowercaseKey.includes('uri') || 
                     lowercaseKey.includes('endpoint')) && typeof obj[key] === 'string') {
                    obj[key] = this.sanitizeURL(obj[key]);
                    continue;
                }
                
                // Sanitize error messages (remove potential sensitive data)
                if ((lowercaseKey.includes('error') || lowercaseKey.includes('message')) && 
                    typeof obj[key] === 'string') {
                    obj[key] = this.sanitizeErrorMessage(obj[key]);
                    continue;
                }
                
                // Recursively sanitize nested objects
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    obj[key] = sanitizeObject(obj[key], fullPath);
                }
                
                // Sanitize arrays
                if (Array.isArray(obj[key])) {
                    obj[key] = obj[key].map((item, index) => 
                        typeof item === 'object' ? 
                        sanitizeObject(item, `${fullPath}[${index}]`) : 
                        this.sanitizeValue(item, key)
                    );
                }
            }
            
            return obj;
        };
        
        return sanitizeObject(sanitized);
    }
    
    /**
     * Mask email addresses for privacy
     */
    maskEmail(email) {
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return '[INVALID_EMAIL]';
        }
        
        const [localPart, domain] = email.split('@');
        const maskedLocal = localPart.length <= 2 ? 
            '*'.repeat(localPart.length) : 
            localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
        
        return `${maskedLocal}@${domain}`;
    }
    
    /**
     * Mask IP addresses for privacy
     */
    maskIPAddress(ip) {
        if (!ip || typeof ip !== 'string') {
            return '[INVALID_IP]';
        }
        
        // IPv4 masking
        if (ip.includes('.')) {
            const parts = ip.split('.');
            if (parts.length === 4) {
                return `${parts[0]}.${parts[1]}.xxx.xxx`;
            }
        }
        
        // IPv6 masking  
        if (ip.includes(':')) {
            const parts = ip.split(':');
            if (parts.length >= 4) {
                return `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}:xxxx:xxxx:xxxx:xxxx`;
            }
        }
        
        return '[MASKED_IP]';
    }
    
    /**
     * Sanitize user agent strings
     */
    sanitizeUserAgent(userAgent) {
        if (!userAgent || typeof userAgent !== 'string') {
            return '[INVALID_USER_AGENT]';
        }
        
        // Remove specific version numbers that could be used for fingerprinting
        return userAgent
            .replace(/\/\d+\.\d+\.\d+\.\d+/g, '/X.X.X.X')  // Version numbers
            .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, 'X.X.X')  // Version patterns
            .replace(/\(([^)]*\d{1,2}\.\d{1,2}[^)]*)/g, '(Version Info Removed)');  // Parenthetical version info
    }
    
    /**
     * Sanitize URLs to remove sensitive query parameters
     */
    sanitizeURL(url) {
        if (!url || typeof url !== 'string') {
            return '[INVALID_URL]';
        }
        
        try {
            const urlObj = new URL(url);
            
            // List of sensitive query parameters to remove
            const sensitiveParams = [
                'token', 'key', 'secret', 'password', 'auth', 'session',
                'api_key', 'apikey', 'access_token', 'refresh_token',
                'csrf', 'nonce', 'signature', 'code', 'state'
            ];
            
            // Remove sensitive query parameters
            sensitiveParams.forEach(param => {
                urlObj.searchParams.delete(param);
            });
            
            return urlObj.toString();
        } catch (error) {
            // If URL parsing fails, return sanitized string
            return url.split('?')[0] + (url.includes('?') ? '?[PARAMS_REMOVED]' : '');
        }
    }
    
    /**
     * Sanitize error messages to remove sensitive data
     */
    sanitizeErrorMessage(message) {
        if (!message || typeof message !== 'string') {
            return '[INVALID_ERROR_MESSAGE]';
        }
        
        // Remove common patterns that might leak sensitive data
        return message
            .replace(/password[=:]\s*[^\s,}\]"]+/gi, 'password=[REDACTED]')
            .replace(/token[=:]\s*[^\s,}\]"]+/gi, 'token=[REDACTED]')
            .replace(/key[=:]\s*[^\s,}\]"]+/gi, 'key=[REDACTED]')
            .replace(/secret[=:]\s*[^\s,}\]"]+/gi, 'secret=[REDACTED]')
            .replace(/\b[A-Za-z0-9+\/]{20,}={0,2}\b/g, '[BASE64_DATA]')  // Base64 data
            .replace(/\b[0-9a-fA-F]{32,}\b/g, '[HEX_DATA]')  // Hex data (hashes, keys)
            .replace(/mongodb:\/\/[^\s"]+/g, 'mongodb://[CONNECTION_STRING]')  // MongoDB URIs
            .replace(/redis:\/\/[^\s"]+/g, 'redis://[CONNECTION_STRING]')  // Redis URIs
            .replace(/\"[^\"]*(?:password|token|key|secret)[^\"]*\"/gi, '"[SENSITIVE_DATA]"');
    }
    
    /**
     * Sanitize individual values based on context
     */
    sanitizeValue(value, context) {
        if (typeof value !== 'string') {
            return value;
        }
        
        const lowercaseContext = (context || '').toLowerCase();
        
        if (lowercaseContext.includes('email')) {
            return this.maskEmail(value);
        }
        
        if (lowercaseContext.includes('ip')) {
            return this.maskIPAddress(value);
        }
        
        if (lowercaseContext.includes('error') || lowercaseContext.includes('message')) {
            return this.sanitizeErrorMessage(value);
        }
        
        return value;
    }
    
    /**
     * Calculate distance between two coordinates
     */
    calculateDistance(coord1, coord2) {
        if (!coord1 || !coord2) return 0;
        
        const R = 6371; // Earth's radius in km
        const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
        const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    /**
     * Determine severity based on event type
     */
    determineSeverity(eventType) {
        const severityMap = {
            'LOGIN_SUCCESS': 'LOW',
            'LOGIN_FAILED': 'MEDIUM',
            'LOGIN_BLOCKED': 'HIGH',
            'TOKEN_THEFT_DETECTED': 'CRITICAL',
            'BRUTE_FORCE_DETECTED': 'CRITICAL',
            'SQL_INJECTION_ATTEMPT': 'CRITICAL',
            'XSS_ATTEMPT': 'CRITICAL',
            'UNAUTHORIZED_ACCESS': 'HIGH',
            'ACCOUNT_LOCKED': 'MEDIUM',
            'PASSWORD_CHANGE': 'MEDIUM',
            'TOKEN_REFRESH': 'LOW'
        };
        
        return severityMap[eventType] || 'MEDIUM';
    }
    
    /**
     * Send alerts for critical events
     */
    async sendAlert(eventData) {
        // This would integrate with your notification system
        console.error(`🚨 SECURITY ALERT: ${eventData.eventType} - ${JSON.stringify(eventData)}`);
        
        // You can integrate with email, SMS, Slack, etc.
        // Example: await emailService.sendSecurityAlert(eventData);
    }
    
    /**
     * Get security dashboard data
     */
    async getDashboardData(hours = 24) {
        try {
            const since = new Date(Date.now() - hours * 60 * 60 * 1000);
            
            const [
                totalEvents,
                criticalEvents,
                failedLogins,
                suspiciousActivities,
                eventsByType,
                eventsBySeverity,
                topIPs
            ] = await Promise.all([
                SecurityAudit.countDocuments({ timestamp: { $gte: since } }),
                SecurityAudit.countDocuments({ 
                    timestamp: { $gte: since },
                    severity: 'CRITICAL'
                }),
                SecurityAudit.countDocuments({ 
                    timestamp: { $gte: since },
                    eventType: 'LOGIN_FAILED'
                }),
                SecurityAudit.countDocuments({ 
                    timestamp: { $gte: since },
                    eventType: 'SUSPICIOUS_ACTIVITY'
                }),
                SecurityAudit.aggregate([
                    { $match: { timestamp: { $gte: since } } },
                    { $group: { _id: '$eventType', count: { $sum: 1 } } }
                ]),
                SecurityAudit.aggregate([
                    { $match: { timestamp: { $gte: since } } },
                    { $group: { _id: '$severity', count: { $sum: 1 } } }
                ]),
                SecurityAudit.aggregate([
                    { $match: { timestamp: { $gte: since } } },
                    { $group: { _id: '$ip', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ])
            ]);
            
            return {
                summary: {
                    totalEvents,
                    criticalEvents,
                    failedLogins,
                    suspiciousActivities
                },
                eventsByType,
                eventsBySeverity,
                topIPs
            };
        } catch (error) {
            console.error('Error getting dashboard data:', error);
            return null;
        }
    }
    
    /**
     * Get events requiring review
     */
    async getEventsForReview() {
        return SecurityAudit.find({
            'securityContext.requiresReview': true,
            'securityContext.reviewedAt': null
        }).sort({ timestamp: -1 });
    }
    
    /**
     * Mark event as reviewed
     */
    async markAsReviewed(eventId, reviewerId, actionTaken) {
        return SecurityAudit.findByIdAndUpdate(eventId, {
            'securityContext.reviewedBy': reviewerId,
            'securityContext.reviewedAt': new Date(),
            'securityContext.actionTaken': actionTaken,
            'securityContext.requiresReview': false
        });
    }
    
    /**
     * Clean up old logs
     */
    async cleanupOldLogs(days = 90) {
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        try {
            const result = await SecurityAudit.deleteMany({
                timestamp: { $lt: cutoffDate },
                severity: { $nin: ['CRITICAL', 'HIGH'] } // Keep critical logs longer
            });
            
            console.log(`Cleaned up ${result.deletedCount} old security logs`);
            return result.deletedCount;
        } catch (error) {
            console.error('Error cleaning up logs:', error);
            return 0;
        }
    }
}

// Create singleton instance
const securityAuditLogger = new SecurityAuditLogger();

export default securityAuditLogger;
export { SecurityAudit };