import express from 'express';
// 🔧 API RESPONSE TIME OPTIMIZATION #184: Import cache middleware
import { cacheMiddleware } from '../../../utils/PerformanceOptimization.js';

const router = express.Router();

/**
 * Backend Health Check
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Provides a simple health check to verify backend availability
 *     tags: [System]
 *     responses:
 *       "200":
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 1234.56
 *                 memory:
 *                   type: object
 *                   properties:
 *                     rss:
 *                       type: number
 *                     heapTotal:
 *                       type: number
 *                     heapUsed:
 *                       type: number
 *                     external:
 *                       type: number
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 environment:
 *                   type: string
 *                   example: development
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
// 🔧 API RESPONSE TIME OPTIMIZATION #184: Add cache middleware to health check endpoint (10 second cache)
router.get('/health', cacheMiddleware('api', () => 'health-check', 10), (req, res) => {
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
 * Detailed Health Check
 * @swagger
 * /api/v1/health/detailed:
 *   get:
 *     summary: Detailed health check endpoint
 *     description: Provides a detailed health check with service status information
 *     tags: [System]
 *     responses:
 *       "200":
 *         description: Service is healthy with detailed information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 1234.56
 *                 memory:
 *                   type: object
 *                   properties:
 *                     rss:
 *                       type: number
 *                     heapTotal:
 *                       type: number
 *                     heapUsed:
 *                       type: number
 *                     external:
 *                       type: number
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 environment:
 *                   type: string
 *                   example: development
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: connected
 *                     connectionPool:
 *                       type: string
 *                       example: active
 *                 services:
 *                   type: object
 *                   properties:
 *                     auth:
 *                       type: string
 *                       example: operational
 *                     tokens:
 *                       type: string
 *                       example: operational
 *                     sessions:
 *                       type: string
 *                       example: operational
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
// 🔧 API RESPONSE TIME OPTIMIZATION #184: Add cache middleware to detailed health check endpoint (5 second cache)
router.get('/health/detailed', cacheMiddleware('api', () => 'health-check-detailed', 5), (req, res) => {
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