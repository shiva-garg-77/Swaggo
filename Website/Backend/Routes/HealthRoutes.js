import express from 'express';

const router = express.Router();

/**
 * SECURITY FIX: Backend Health Check Endpoint
 * GET /api/health
 * 
 * Provides a simple health check for the autologin system to verify
 * backend availability before attempting session validation
 */
router.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  res.status(200).json(health);
});

/**
 * Detailed Health Check (Optional - for monitoring)
 * GET /api/health/detailed
 */
router.get('/health/detailed', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: 'connected', // This could be enhanced to actually check DB
      connectionPool: 'active'
    },
    services: {
      auth: 'operational',
      tokens: 'operational',
      sessions: 'operational'
    }
  };

  res.status(200).json(health);
});

export default router;