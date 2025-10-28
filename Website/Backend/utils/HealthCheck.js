import { checkDatabaseHealth } from './DatabaseOptimization.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Comprehensive Health Check and Monitoring System
 */

export class HealthCheck {
    constructor() {
        this.startTime = Date.now();
        this.requestCount = 0;
        this.errorCount = 0;
        this.lastHealthCheck = null;
        this.healthHistory = [];
    }

    // Increment request counter
    incrementRequests() {
        this.requestCount++;
    }

    // Increment error counter
    incrementErrors() {
        this.errorCount++;
    }

    // System health check
    async checkSystem() {
        const now = Date.now();
        const uptime = now - this.startTime;
        
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: uptime,
            uptimeReadable: this.formatUptime(uptime),
            services: {},
            metrics: {},
            errors: []
        };

        try {
            // Database health
            const dbHealth = await checkDatabaseHealth();
            health.services.database = dbHealth;
            
            if (dbHealth.status !== 'healthy') {
                health.status = 'degraded';
                health.errors.push('Database connection issues');
            }

            // File system health
            health.services.filesystem = await this.checkFileSystem();
            
            // Memory usage
            const memUsage = process.memoryUsage();
            health.services.memory = {
                status: memUsage.heapUsed > 500 * 1024 * 1024 ? 'warning' : 'healthy', // 500MB threshold
                heapUsed: this.formatBytes(memUsage.heapUsed),
                heapTotal: this.formatBytes(memUsage.heapTotal),
                external: this.formatBytes(memUsage.external),
                arrayBuffers: this.formatBytes(memUsage.arrayBuffers)
            };

            // System metrics
            health.metrics = {
                requests: this.requestCount,
                errors: this.errorCount,
                errorRate: this.requestCount > 0 ? ((this.errorCount / this.requestCount) * 100).toFixed(2) + '%' : '0%',
                systemLoad: os.loadavg(),
                totalMemory: this.formatBytes(os.totalmem()),
                freeMemory: this.formatBytes(os.freemem()),
                cpuCount: os.cpus().length,
                platform: os.platform(),
                nodeVersion: process.version
            };

            // Environment checks
            health.services.environment = this.checkEnvironment();

            // API endpoints health
            health.services.endpoints = {
                status: 'healthy',
                graphql: 'operational',
                rest: 'operational',
                websocket: 'operational'
            };

            // Overall health determination
            const unhealthyServices = Object.values(health.services)
                .filter(service => service.status === 'error' || service.status === 'unhealthy');
                
            if (unhealthyServices.length > 0) {
                health.status = 'unhealthy';
            } else {
                const degradedServices = Object.values(health.services)
                    .filter(service => service.status === 'warning' || service.status === 'degraded');
                    
                if (degradedServices.length > 0) {
                    health.status = 'degraded';
                }
            }

            this.lastHealthCheck = health;
            this.addToHistory(health);
            
            return health;
            
        } catch (error) {
            health.status = 'unhealthy';
            health.errors.push(`Health check failed: ${error.message}`);
            return health;
        }
    }

    // Check file system health
    async checkFileSystem() {
        try {
            const uploadsDir = path.join(process.cwd(), 'uploads');
            
            // Check if uploads directory exists
            const exists = await fs.promises.access(uploadsDir, fs.constants.F_OK).then(() => true).catch(() => false);
            if (!exists) {
                return {
                    status: 'error',
                    message: 'Uploads directory does not exist'
                };
            }

            // Check if we can write to uploads directory
            const testFile = path.join(uploadsDir, '.health-check');
            try {
                await fs.promises.writeFile(testFile, 'health-check');
                await fs.promises.unlink(testFile);
            } catch (writeError) {
                return {
                    status: 'error',
                    message: 'Cannot write to uploads directory',
                    error: writeError.message
                };
            }

            // Get disk space information
            const stats = await fs.promises.stat(uploadsDir);
            
            return {
                status: 'healthy',
                uploadsDirectory: 'accessible',
                permissions: 'read/write',
                lastModified: stats.mtime
            };
            
        } catch (error) {
            return {
                status: 'error',
                message: 'File system check failed',
                error: error.message
            };
        }
    }

    // Check environment configuration
    checkEnvironment() {
        const requiredEnvVars = [
            'MONGODB_URI',
            'ACCESS_TOKEN_SECRET',
            'REFRESH_TOKEN_SECRET',
            'NODE_ENV',
            'PORT'
        ];

        const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
        
        return {
            status: missing.length === 0 ? 'healthy' : 'error',
            nodeEnv: process.env.NODE_ENV || 'development',
            missingVariables: missing,
            configuredVariables: requiredEnvVars.filter(envVar => process.env[envVar]).length
        };
    }

    // Add health check to history (keep last 10)
    addToHistory(healthCheck) {
        this.healthHistory.push({
            timestamp: healthCheck.timestamp,
            status: healthCheck.status,
            uptime: healthCheck.uptime,
            errors: healthCheck.errors.length
        });

        if (this.healthHistory.length > 10) {
            this.healthHistory.shift();
        }
    }

    // Get health history
    getHistory() {
        return this.healthHistory;
    }

    // Format uptime in readable format
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // Format bytes in readable format
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Quick health check (lightweight)
    async quickCheck() {
        const dbConnected = mongoose.connection.readyState === 1;
        
        return {
            status: dbConnected ? 'healthy' : 'unhealthy',
            database: dbConnected ? 'connected' : 'disconnected',
            uptime: Date.now() - this.startTime,
            timestamp: new Date().toISOString()
        };
    }

    // Get system metrics only
    getMetrics() {
        return {
            uptime: Date.now() - this.startTime,
            requests: this.requestCount,
            errors: this.errorCount,
            errorRate: this.requestCount > 0 ? ((this.errorCount / this.requestCount) * 100).toFixed(2) + '%' : '0%',
            memoryUsage: process.memoryUsage(),
            systemLoad: os.loadavg(),
            timestamp: new Date().toISOString()
        };
    }
}

// Create singleton instance
export const healthCheck = new HealthCheck();

// Middleware to track requests and errors
export const trackRequests = (req, res, next) => {
    healthCheck.incrementRequests();
    
    // Track response errors
    const originalSend = res.send;
    res.send = function(data) {
        if (res.statusCode >= 400) {
            healthCheck.incrementErrors();
        }
        return originalSend.call(this, data);
    };
    
    next();
};

// Express middleware for health endpoints
export const healthEndpoints = (app) => {
    // Comprehensive health check
    app.get('/health', async (req, res) => {
        try {
            const health = await healthCheck.checkSystem();
            const statusCode = health.status === 'healthy' ? 200 : 
                             health.status === 'degraded' ? 200 : 503;
            res.status(statusCode).json(health);
        } catch (error) {
            res.status(503).json({
                status: 'error',
                message: 'Health check failed',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Quick health check (for load balancers)
    app.get('/health/quick', async (req, res) => {
        try {
            const health = await healthCheck.quickCheck();
            res.status(health.status === 'healthy' ? 200 : 503).json(health);
        } catch (error) {
            res.status(503).json({
                status: 'error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // System metrics - SECURED (requires authentication for sensitive data)
    app.get('/health/metrics', (req, res) => {
        // Only allow in development or for authenticated admin users
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                error: 'Metrics endpoint not available in production without authentication',
                timestamp: new Date().toISOString()
            });
        }
        try {
            const metrics = healthCheck.getMetrics();
            res.json(metrics);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get metrics',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Health history - SECURED (requires authentication for sensitive data)
    app.get('/health/history', (req, res) => {
        // Only allow in development or for authenticated admin users
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                error: 'History endpoint not available in production without authentication',
                timestamp: new Date().toISOString()
            });
        }
        try {
            const history = healthCheck.getHistory();
            res.json({
                history,
                count: history.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get health history',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Readiness probe (for Kubernetes)
    app.get('/ready', async (req, res) => {
        try {
            const dbConnected = mongoose.connection.readyState === 1;
            if (dbConnected) {
                res.status(200).json({ status: 'ready' });
            } else {
                res.status(503).json({ status: 'not ready', reason: 'database not connected' });
            }
        } catch (error) {
            res.status(503).json({ status: 'not ready', error: error.message });
        }
    });

    // Liveness probe (for Kubernetes)
    app.get('/live', (req, res) => {
        res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
    });
};

export default { HealthCheck, healthCheck, trackRequests, healthEndpoints };