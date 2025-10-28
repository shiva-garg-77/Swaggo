/**
 * @fileoverview Unit tests for WebSocketReconnectionService
 * @module tests/unit/services/WebSocketReconnectionService
 */

import service from '../../../Services/WebSocketReconnectionService.js';

describe('WebSocketReconnectionService', () => {
  afterEach(() => {
    // Clear all intervals that might have been set
    // Note: We can't easily clear intervals in Jest without proper setup
  });

  describe('cleanupOldReconnectionAttempts', () => {
    it('should clean up old reconnection attempts without throwing an error', () => {
      // This test verifies that the cleanup method can run without throwing
      // "this.reconnectionAttempts is not iterable" error
      expect(() => {
        service.cleanupOldReconnectionAttempts();
      }).not.toThrow();
    });

    it('should handle cleanup with actual data', () => {
      // Store original sizes
      const originalAttemptsSize = service.reconnectionAttempts.size();
      const originalDelaysSize = service.reconnectionDelays.size();
      const originalReasonsSize = service.disconnectionReasons.size();

      // Add some test data
      service.reconnectionAttempts.set('test-socket-1', {
        attempts: 1,
        timestamp: Date.now() - 400000 // 400 seconds ago
      });

      service.reconnectionDelays.set('test-socket-1', {
        delay: 1000,
        timestamp: Date.now() - 400000 // 400 seconds ago
      });

      service.disconnectionReasons.set('test-socket-1', {
        reason: 'test-reason',
        timestamp: Date.now() - 400000 // 400 seconds ago
      });

      // This should not throw an error
      expect(() => {
        service.cleanupOldReconnectionAttempts();
      }).not.toThrow();

      // After cleanup, the old entries should be removed
      // Note: We can't easily test the exact size because other tests might be running
      // But we can verify that our specific entries were removed
      expect(service.reconnectionAttempts.has('test-socket-1')).toBe(false);
      expect(service.reconnectionDelays.has('test-socket-1')).toBe(false);
      expect(service.disconnectionReasons.has('test-socket-1')).toBe(false);
    });
  });
});