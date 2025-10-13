/**
 * @fileoverview Tests for HealthCheck helper functions
 * @version 1.0.0
 */

import { HealthCheck } from '../HealthCheck.js';
import { checkDatabaseHealth } from '../DatabaseOptimization.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock dependencies
jest.mock('../DatabaseOptimization.js');
jest.mock('fs');
jest.mock('path');
jest.mock('os');

describe('HealthCheck', () => {
  let healthCheck;

  beforeEach(() => {
    jest.clearAllMocks();
    healthCheck = new HealthCheck();
  });

  describe('Constructor and Basic Methods', () => {
    test('should initialize with correct default values', () => {
      expect(healthCheck.startTime).toBeInstanceOf(Number);
      expect(healthCheck.requestCount).toBe(0);
      expect(healthCheck.errorCount).toBe(0);
      expect(healthCheck.lastHealthCheck).toBeNull();
      expect(healthCheck.healthHistory).toEqual([]);
    });

    test('should increment request counter', () => {
      expect(healthCheck.requestCount).toBe(0);
      
      healthCheck.incrementRequests();
      expect(healthCheck.requestCount).toBe(1);
      
      healthCheck.incrementRequests();
      healthCheck.incrementRequests();
      expect(healthCheck.requestCount).toBe(3);
    });

    test('should increment error counter', () => {
      expect(healthCheck.errorCount).toBe(0);
      
      healthCheck.incrementErrors();
      expect(healthCheck.errorCount).toBe(1);
      
      healthCheck.incrementErrors();
      healthCheck.incrementErrors();
      expect(healthCheck.errorCount).toBe(3);
    });
  });

  describe('System Health Check', () => {
    test('should perform system health check successfully', async () => {
      // Mock database health check
      checkDatabaseHealth.mockResolvedValue({
        status: 'healthy',
        connection: 'connected',
        responseTime: 5
      });

      // Mock file system
      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockImplementation(() => {});
      fs.unlinkSync.mockImplementation(() => {});
      fs.statSync.mockReturnValue({ mtime: new Date() });

      // Mock OS
      os.loadavg.mockReturnValue([0.1, 0.2, 0.3]);
      os.totalmem.mockReturnValue(8 * 1024 * 1024 * 1024); // 8GB
      os.freemem.mockReturnValue(4 * 1024 * 1024 * 1024); // 4GB
      os.cpus.mockReturnValue([{ model: 'CPU' }, { model: 'CPU' }]); // 2 CPUs

      // Mock process memory
      Object.defineProperty(process, 'memoryUsage', {
        value: () => ({
          heapUsed: 100 * 1024 * 1024, // 100MB
          heapTotal: 200 * 1024 * 1024, // 200MB
          external: 50 * 1024 * 1024, // 50MB
          arrayBuffers: 10 * 1024 * 1024 // 10MB
        }),
        writable: false
      });

      const result = await healthCheck.checkSystem();

      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeInstanceOf(Number);
      expect(result.services).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.errors).toEqual([]);

      // Verify all services are checked
      expect(result.services.database).toBeDefined();
      expect(result.services.filesystem).toBeDefined();
      expect(result.services.memory).toBeDefined();
      expect(result.services.environment).toBeDefined();

      // Verify metrics are collected
      expect(result.metrics.requests).toBe(0);
      expect(result.metrics.errors).toBe(0);
      expect(result.metrics.systemLoad).toEqual([0.1, 0.2, 0.3]);
      expect(result.metrics.cpuCount).toBe(2);
    });

    test('should handle database health check failure', async () => {
      // Mock failing database health check
      checkDatabaseHealth.mockResolvedValue({
        status: 'error',
        connection: 'disconnected',
        error: 'Connection failed'
      });

      // Mock other services as healthy
      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockImplementation(() => {});
      fs.unlinkSync.mockImplementation(() => {});
      fs.statSync.mockReturnValue({ mtime: new Date() });

      os.loadavg.mockReturnValue([0.1, 0.2, 0.3]);
      os.totalmem.mockReturnValue(8 * 1024 * 1024 * 1024);
      os.freemem.mockReturnValue(4 * 1024 * 1024 * 1024);
      os.cpus.mockReturnValue([{ model: 'CPU' }]);

      Object.defineProperty(process, 'memoryUsage', {
        value: () => ({
          heapUsed: 100 * 1024 * 1024,
          heapTotal: 200 * 1024 * 1024,
          external: 50 * 1024 * 1024,
          arrayBuffers: 10 * 1024 * 1024
        }),
        writable: false
      });

      const result = await healthCheck.checkSystem();

      expect(result.status).toBe('degraded');
      expect(result.errors).toContain('Database connection issues');
    });

    test('should handle file system health check failure', async () => {
      // Mock healthy database
      checkDatabaseHealth.mockResolvedValue({
        status: 'healthy',
        connection: 'connected'
      });

      // Mock failing file system
      fs.existsSync.mockReturnValue(false);

      os.loadavg.mockReturnValue([0.1, 0.2, 0.3]);
      os.totalmem.mockReturnValue(8 * 1024 * 1024 * 1024);
      os.freemem.mockReturnValue(4 * 1024 * 1024 * 1024);
      os.cpus.mockReturnValue([{ model: 'CPU' }]);

      Object.defineProperty(process, 'memoryUsage', {
        value: () => ({
          heapUsed: 100 * 1024 * 1024,
          heapTotal: 200 * 1024 * 1024,
          external: 50 * 1024 * 1024,
          arrayBuffers: 10 * 1024 * 1024
        }),
        writable: false
      });

      const result = await healthCheck.checkSystem();

      expect(result.services.filesystem.status).toBe('error');
      expect(result.services.filesystem.message).toBe('Uploads directory does not exist');
    });

    test('should handle overall system failure', async () => {
      // Mock system failure
      checkDatabaseHealth.mockRejectedValue(new Error('System failure'));

      const result = await healthCheck.checkSystem();

      expect(result.status).toBe('unhealthy');
      expect(result.errors).toContain('Health check failed: System failure');
    });
  });

  describe('File System Health Check', () => {
    test('should check file system health successfully', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockImplementation(() => {});
      fs.unlinkSync.mockImplementation(() => {});
      fs.statSync.mockReturnValue({ mtime: new Date('2023-01-01') });

      const result = await healthCheck.checkFileSystem();

      expect(result.status).toBe('healthy');
      expect(result.uploadsDirectory).toBe('accessible');
      expect(result.permissions).toBe('read/write');
      expect(result.lastModified).toEqual(new Date('2023-01-01'));
    });

    test('should handle missing uploads directory', async () => {
      fs.existsSync.mockReturnValue(false);

      const result = await healthCheck.checkFileSystem();

      expect(result.status).toBe('error');
      expect(result.message).toBe('Uploads directory does not exist');
    });

    test('should handle write permission issues', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await healthCheck.checkFileSystem();

      expect(result.status).toBe('error');
      expect(result.message).toBe('Cannot write to uploads directory');
      expect(result.error).toBe('Permission denied');
    });

    test('should handle general file system errors', async () => {
      fs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const result = await healthCheck.checkFileSystem();

      expect(result.status).toBe('error');
      expect(result.message).toBe('File system check failed');
      expect(result.error).toBe('File system error');
    });
  });

  describe('Environment Health Check', () => {
    test('should check environment configuration successfully', () => {
      // Mock environment variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        MONGODB_URI: 'mongodb://localhost:27017/test',
        ACCESS_TOKEN_SECRET: 'secret',
        REFRESH_TOKEN_SECRET: 'refresh',
        NODE_ENV: 'test',
        PORT: '3000'
      };

      const result = healthCheck.checkEnvironment();

      expect(result.status).toBe('healthy');
      expect(result.nodeEnv).toBe('test');
      expect(result.missingVariables).toEqual([]);
      expect(result.configuredVariables).toBe(5);

      // Restore environment
      process.env = originalEnv;
    });

    test('should detect missing environment variables', () => {
      // Mock environment with missing variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        NODE_ENV: 'test',
        PORT: '3000'
        // Missing MONGODB_URI, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET
      };

      const result = healthCheck.checkEnvironment();

      expect(result.status).toBe('error');
      expect(result.missingVariables).toEqual([
        'MONGODB_URI',
        'ACCESS_TOKEN_SECRET',
        'REFRESH_TOKEN_SECRET'
      ]);
      expect(result.configuredVariables).toBe(2);

      // Restore environment
      process.env = originalEnv;
    });
  });

  describe('Health History Management', () => {
    test('should add health check to history', () => {
      const healthCheckData = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        uptime: 1000,
        errors: 0
      };

      healthCheck.addToHistory(healthCheckData);

      expect(healthCheck.healthHistory.length).toBe(1);
      expect(healthCheck.healthHistory[0]).toEqual(healthCheckData);
    });

    test('should maintain history limit of 10 entries', () => {
      // Add 15 health check entries
      for (let i = 0; i < 15; i++) {
        healthCheck.addToHistory({
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
          status: 'healthy',
          uptime: 1000 + i * 100,
          errors: i % 3 // 0, 1, 2 repeating
        });
      }

      expect(healthCheck.healthHistory.length).toBe(10);
      // Should keep the last 10 entries
      expect(healthCheck.healthHistory[0].errors).toBe(5); // 5th entry (index 5)
      expect(healthCheck.healthHistory[9].errors).toBe(3); // Most recent entry
    });

    test('should get health history', () => {
      const historyData = {
        timestamp: new Date().toISOString(),
        status: 'degraded',
        uptime: 2000,
        errors: 2
      };

      healthCheck.addToHistory(historyData);

      const history = healthCheck.getHistory();

      expect(history).toEqual([historyData]);
      expect(history).toBe(healthCheck.healthHistory); // Should return the same array
    });
  });

  describe('Utility Methods', () => {
    test('should format uptime correctly', () => {
      // Test various uptime values
      const testCases = [
        { uptime: 1000, expected: expect.stringContaining('seconds') },
        { uptime: 60000, expected: expect.stringContaining('minute') },
        { uptime: 3600000, expected: expect.stringContaining('hour') },
        { uptime: 86400000, expected: expect.stringContaining('day') }
      ];

      testCases.forEach(({ uptime, expected }) => {
        const result = healthCheck.formatUptime(uptime);
        expect(result).toEqual(expected);
      });
    });

    test('should format bytes correctly', () => {
      const testCases = [
        { bytes: 1024, expected: '1 KB' },
        { bytes: 1024 * 1024, expected: '1 MB' },
        { bytes: 1024 * 1024 * 1024, expected: '1 GB' },
        { bytes: 500, expected: '500 Bytes' }
      ];

      testCases.forEach(({ bytes, expected }) => {
        const result = healthCheck.formatBytes(bytes);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete health check workflow with metrics', async () => {
      // Set up some request and error counts
      healthCheck.incrementRequests();
      healthCheck.incrementRequests();
      healthCheck.incrementErrors();

      // Mock all dependencies
      checkDatabaseHealth.mockResolvedValue({
        status: 'healthy',
        connection: 'connected',
        responseTime: 15
      });

      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockImplementation(() => {});
      fs.unlinkSync.mockImplementation(() => {});
      fs.statSync.mockReturnValue({ mtime: new Date() });

      os.loadavg.mockReturnValue([0.5, 0.3, 0.2]);
      os.totalmem.mockReturnValue(16 * 1024 * 1024 * 1024); // 16GB
      os.freemem.mockReturnValue(8 * 1024 * 1024 * 1024); // 8GB
      os.cpus.mockReturnValue(new Array(4).fill({ model: 'CPU' })); // 4 CPUs

      Object.defineProperty(process, 'memoryUsage', {
        value: () => ({
          heapUsed: 250 * 1024 * 1024, // 250MB
          heapTotal: 500 * 1024 * 1024, // 500MB
          external: 100 * 1024 * 1024, // 100MB
          arrayBuffers: 25 * 1024 * 1024 // 25MB
        }),
        writable: false
      });

      const result = await healthCheck.checkSystem();

      // Verify overall health
      expect(result.status).toBe('healthy');

      // Verify metrics
      expect(result.metrics.requests).toBe(2);
      expect(result.metrics.errors).toBe(1);
      expect(result.metrics.errorRate).toBe('50.00%');
      expect(result.metrics.cpuCount).toBe(4);
      expect(result.metrics.nodeVersion).toBe(process.version);

      // Verify memory metrics
      expect(result.services.memory.status).toBe('healthy');
      expect(result.services.memory.heapUsed).toBe('250 MB');
      expect(result.services.memory.heapTotal).toBe('500 MB');

      // Verify history is updated
      expect(healthCheck.healthHistory.length).toBe(1);
      expect(healthCheck.lastHealthCheck).toBe(result);
    });

    test('should handle degraded system state', async () => {
      // Set up metrics
      for (let i = 0; i < 100; i++) {
        healthCheck.incrementRequests();
      }
      for (let i = 0; i < 30; i++) {
        healthCheck.incrementErrors();
      }

      // Mock degraded services
      checkDatabaseHealth.mockResolvedValue({
        status: 'warning',
        connection: 'slow',
        responseTime: 5000 // 5 seconds - slow
      });

      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockImplementation(() => {});
      fs.unlinkSync.mockImplementation(() => {});
      fs.statSync.mockReturnValue({ mtime: new Date() });

      os.loadavg.mockReturnValue([2.0, 1.5, 1.0]); // High load
      os.totalmem.mockReturnValue(8 * 1024 * 1024 * 1024);
      os.freemem.mockReturnValue(1 * 1024 * 1024 * 1024); // Low free memory
      os.cpus.mockReturnValue(new Array(2).fill({ model: 'CPU' }));

      Object.defineProperty(process, 'memoryUsage', {
        value: () => ({
          heapUsed: 600 * 1024 * 1024, // 600MB - high usage
          heapTotal: 800 * 1024 * 1024, // 800MB
          external: 200 * 1024 * 1024, // 200MB
          arrayBuffers: 50 * 1024 * 1024 // 50MB
        }),
        writable: false
      });

      const result = await healthCheck.checkSystem();

      // Should be degraded due to database warning
      expect(result.status).toBe('degraded');

      // Verify metrics
      expect(result.metrics.requests).toBe(100);
      expect(result.metrics.errors).toBe(30);
      expect(result.metrics.errorRate).toBe('30.00%');

      // Verify high memory usage warning
      expect(result.services.memory.status).toBe('warning'); // 600MB > 500MB threshold

      // Verify history tracking
      expect(healthCheck.healthHistory.length).toBe(1);
    });

    test('should handle unhealthy system state', async () => {
      // Mock unhealthy services
      checkDatabaseHealth.mockResolvedValue({
        status: 'error',
        connection: 'disconnected',
        error: 'Connection timeout'
      });

      fs.existsSync.mockReturnValue(false); // Missing uploads directory

      os.loadavg.mockReturnValue([3.0, 2.5, 2.0]); // Very high load
      os.totalmem.mockReturnValue(8 * 1024 * 1024 * 1024);
      os.freemem.mockReturnValue(100 * 1024 * 1024); // Very low free memory
      os.cpus.mockReturnValue([{ model: 'CPU' }]);

      Object.defineProperty(process, 'memoryUsage', {
        value: () => ({
          heapUsed: 700 * 1024 * 1024, // 700MB
          heapTotal: 800 * 1024 * 1024, // 800MB
          external: 300 * 1024 * 1024, // 300MB
          arrayBuffers: 100 * 1024 * 1024 // 100MB
        }),
        writable: false
      });

      const result = await healthCheck.checkSystem();

      // Should be unhealthy due to multiple failures
      expect(result.status).toBe('unhealthy');
      expect(result.errors).toContain('Database connection issues');

      // Verify all services show problems
      expect(result.services.database.status).toBe('error');
      expect(result.services.filesystem.status).toBe('error');

      // Verify metrics still collected
      expect(result.metrics.systemLoad).toEqual([3.0, 2.5, 2.0]);
      expect(result.metrics.freeMemory).toBe('100 MB');
    });
  });
});