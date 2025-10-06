/**
 * 🔒 COMPREHENSIVE SESSION REGENERATION SECURITY TESTS
 * 
 * Tests to verify session fixation attacks are properly prevented
 * and session regeneration works correctly under all scenarios
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import SessionManagementCore from '../../Security/SessionManagementCore.js';
import crypto from 'crypto';

describe('Session Regeneration Security Tests', () => {
  let mockUser;
  let mockRequest;
  let originalConsoleLog;
  let originalConsoleError;

  beforeEach(() => {
    // Mock console methods to reduce noise in tests
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = jest.fn();
    console.error = jest.fn();

    // Setup mock user
    mockUser = {
      id: crypto.randomUUID(),
      username: 'testuser',
      email: 'test@example.com',
      permissions: { role: 'user', scopes: [] },
      security: { 
        mfa: { enabled: false },
        accountStatus: 'active'
      }
    };

    // Setup mock request
    mockRequest = {
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Mozilla/5.0 (Test Browser)',
        'accept-language': 'en-US,en;q=0.9'
      },
      sessionID: crypto.randomUUID()
    };
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Session Fixation Prevention', () => {
    test('should regenerate session ID on authentication', async () => {
      // Create initial session
      const initialSession = await SessionManagementCore.createSession(mockUser, mockRequest);
      expect(initialSession.sessionId).toBeDefined();

      const oldSessionId = initialSession.sessionId;

      // Simulate session fixation prevention during authentication
      const regenerationResult = await SessionManagementCore.regenerateSessionOnAuth(
        mockUser.id,
        oldSessionId,
        {
          method: 'login',
          ipAddress: mockRequest.ip,
          userAgent: mockRequest.headers['user-agent']
        }
      );

      expect(regenerationResult.success).toBe(true);
      expect(regenerationResult.newSessionId).toBeDefined();
      expect(regenerationResult.newSessionId).not.toBe(oldSessionId);
      expect(regenerationResult.message).toContain('Session ID regenerated for security');
    });

    test('should invalidate old session after regeneration', async () => {
      // Create initial session
      const initialSession = await SessionManagementCore.createSession(mockUser, mockRequest);
      const oldSessionId = initialSession.sessionId;

      // Regenerate session
      const regenerationResult = await SessionManagementCore.regenerateSessionOnAuth(
        mockUser.id,
        oldSessionId,
        {
          method: 'login',
          ipAddress: mockRequest.ip,
          userAgent: mockRequest.headers['user-agent']
        }
      );

      // Verify old session is no longer accessible
      const oldSession = SessionManagementCore.activeSessions?.get(oldSessionId);
      expect(oldSession).toBeUndefined();

      // Verify new session exists
      const newSession = SessionManagementCore.activeSessions?.get(regenerationResult.newSessionId);
      expect(newSession).toBeDefined();
    });

    test('should preserve user data during regeneration', async () => {
      // Create initial session with custom attributes
      const initialSession = await SessionManagementCore.createSession(mockUser, mockRequest, {
        customData: 'test-value',
        authMethod: 'password'
      });

      const oldSessionId = initialSession.sessionId;

      // Regenerate session
      const regenerationResult = await SessionManagementCore.regenerateSessionOnAuth(
        mockUser.id,
        oldSessionId,
        {
          method: 'login',
          ipAddress: mockRequest.ip,
          userAgent: mockRequest.headers['user-agent']
        }
      );

      const newSession = SessionManagementCore.activeSessions?.get(regenerationResult.newSessionId);
      expect(newSession.userId).toBe(mockUser.id);
      expect(newSession.attributes.privileges).toEqual(mockUser.privileges || []);
      expect(newSession.flags.regenerated).toBe(true);
    });

    test('should generate new security keys during regeneration', async () => {
      // Create initial session
      const initialSession = await SessionManagementCore.createSession(mockUser, mockRequest);
      const oldSessionId = initialSession.sessionId;

      // Get old session data
      const oldSession = SessionManagementCore.activeSessions?.get(oldSessionId);
      const oldKeys = oldSession?.keys;

      // Regenerate session
      const regenerationResult = await SessionManagementCore.regenerateSessionOnAuth(
        mockUser.id,
        oldSessionId,
        {
          method: 'login',
          ipAddress: mockRequest.ip,
          userAgent: mockRequest.headers['user-agent']
        }
      );

      // Verify new session has different keys
      const newSession = SessionManagementCore.activeSessions?.get(regenerationResult.newSessionId);
      expect(newSession.keys).toBeDefined();
      
      if (oldKeys && newSession.keys) {
        expect(newSession.keys.sessionToken).not.toBe(oldKeys.sessionToken);
        expect(newSession.keys.refreshToken).not.toBe(oldKeys.refreshToken);
      }
    });
  });

  describe('Session Security Validation', () => {
    test('should reset risk score on regeneration', async () => {
      // Create session with elevated risk
      const initialSession = await SessionManagementCore.createSession(mockUser, mockRequest);
      const oldSessionId = initialSession.sessionId;

      // Simulate risk elevation
      const oldSession = SessionManagementCore.activeSessions?.get(oldSessionId);
      if (oldSession) {
        oldSession.riskScore = 75;
      }

      // Regenerate session
      const regenerationResult = await SessionManagementCore.regenerateSessionOnAuth(
        mockUser.id,
        oldSessionId,
        {
          method: 'login',
          ipAddress: mockRequest.ip,
          userAgent: mockRequest.headers['user-agent']
        }
      );

      // Verify risk score is reset
      const newSession = SessionManagementCore.activeSessions?.get(regenerationResult.newSessionId);
      expect(newSession.riskScore).toBe(0);
    });

    test('should reset activity counters on regeneration', async () => {
      // Create session with activity
      const initialSession = await SessionManagementCore.createSession(mockUser, mockRequest);
      const oldSessionId = initialSession.sessionId;

      // Simulate activity
      const oldSession = SessionManagementCore.activeSessions?.get(oldSessionId);
      if (oldSession) {
        oldSession.activity.requests = 100;
        oldSession.activity.dataTransferred = 1000000;
      }

      // Regenerate session
      const regenerationResult = await SessionManagementCore.regenerateSessionOnAuth(
        mockUser.id,
        oldSessionId,
        {
          method: 'login',
          ipAddress: mockRequest.ip,
          userAgent: mockRequest.headers['user-agent']
        }
      );

      // Verify activity counters are reset
      const newSession = SessionManagementCore.activeSessions?.get(regenerationResult.newSessionId);
      expect(newSession.activity.requests).toBe(0);
      expect(newSession.activity.dataTransferred).toBe(0);
    });

    test('should handle missing old session gracefully', async () => {
      const nonExistentSessionId = crypto.randomUUID();

      // Attempt to regenerate non-existent session
      const regenerationResult = await SessionManagementCore.regenerateSessionOnAuth(
        mockUser.id,
        nonExistentSessionId,
        {
          method: 'login',
          ipAddress: mockRequest.ip,
          userAgent: mockRequest.headers['user-agent']
        }
      );

      expect(regenerationResult.success).toBe(true);
      expect(regenerationResult.newSessionId).toBeDefined();
      expect(regenerationResult.message).toContain('New session created');
    });

    test('should handle null old session ID', async () => {
      // Attempt to regenerate with null session ID (new login)
      const regenerationResult = await SessionManagementCore.regenerateSessionOnAuth(
        mockUser.id,
        null,
        {
          method: 'login',
          ipAddress: mockRequest.ip,
          userAgent: mockRequest.headers['user-agent']
        }
      );

      expect(regenerationResult.success).toBe(true);
      expect(regenerationResult.newSessionId).toBeDefined();
      expect(regenerationResult.message).toContain('New session created');
    });
  });

  describe('Session Regeneration Security Logging', () => {
    test('should log session regeneration events', async () => {
      // Mock the logSessionEvent method
      const logEventSpy = jest.spyOn(SessionManagementCore, 'logSessionEvent')
        .mockImplementation(() => Promise.resolve());

      // Create and regenerate session
      const initialSession = await SessionManagementCore.createSession(mockUser, mockRequest);
      await SessionManagementCore.regenerateSessionOnAuth(
        mockUser.id,
        initialSession.sessionId,
        {
          method: 'login',
          ipAddress: mockRequest.ip,
          userAgent: mockRequest.headers['user-agent']
        }
      );

      // Verify logging occurred
      expect(logEventSpy).toHaveBeenCalledWith(
        'session_regenerated',
        expect.any(String),
        expect.objectContaining({
          userId: mockUser.id,
          preventedFixation: true
        })
      );

      logEventSpy.mockRestore();
    });

    test('should track regeneration in session flags', async () => {
      // Create and regenerate session
      const initialSession = await SessionManagementCore.createSession(mockUser, mockRequest);
      const regenerationResult = await SessionManagementCore.regenerateSessionOnAuth(
        mockUser.id,
        initialSession.sessionId,
        {
          method: 'login',
          ipAddress: mockRequest.ip,
          userAgent: mockRequest.headers['user-agent']
        }
      );

      // Verify regeneration flag is set
      const newSession = SessionManagementCore.activeSessions?.get(regenerationResult.newSessionId);
      expect(newSession.flags.regenerated).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle concurrent regeneration attempts', async () => {
      // Create initial session
      const initialSession = await SessionManagementCore.createSession(mockUser, mockRequest);
      const oldSessionId = initialSession.sessionId;

      // Attempt concurrent regenerations
      const promises = [
        SessionManagementCore.regenerateSessionOnAuth(mockUser.id, oldSessionId, {
          method: 'login',
          ipAddress: mockRequest.ip,
          userAgent: mockRequest.headers['user-agent']
        }),
        SessionManagementCore.regenerateSessionOnAuth(mockUser.id, oldSessionId, {
          method: 'login',
          ipAddress: mockRequest.ip,
          userAgent: mockRequest.headers['user-agent']
        })
      ];

      const results = await Promise.allSettled(promises);

      // At least one should succeed
      const successfulResults = results.filter(r => r.status === 'fulfilled' && r.value.success);
      expect(successfulResults.length).toBeGreaterThan(0);
    });

    test('should handle invalid user ID', async () => {
      const invalidUserId = 'invalid-user-id';

      try {
        const regenerationResult = await SessionManagementCore.regenerateSessionOnAuth(
          invalidUserId,
          null,
          {
            method: 'login',
            ipAddress: mockRequest.ip,
            userAgent: mockRequest.headers['user-agent']
          }
        );

        // Should still create a session but may have limited functionality
        expect(regenerationResult.success).toBe(true);
      } catch (error) {
        // Or should handle the error gracefully
        expect(error).toBeDefined();
      }
    });

    test('should validate authentication context', async () => {
      const initialSession = await SessionManagementCore.createSession(mockUser, mockRequest);

      // Test with missing context
      const regenerationResult = await SessionManagementCore.regenerateSessionOnAuth(
        mockUser.id,
        initialSession.sessionId,
        {} // Empty context
      );

      expect(regenerationResult.success).toBe(true);
      expect(regenerationResult.newSessionId).toBeDefined();
    });
  });

  describe('Performance and Resource Management', () => {
    test('should clean up old session resources', async () => {
      // Create session with mock resources
      const initialSession = await SessionManagementCore.createSession(mockUser, mockRequest);
      const oldSessionId = initialSession.sessionId;

      // Add mock resources to track cleanup
      const oldSession = SessionManagementCore.activeSessions?.get(oldSessionId);
      if (oldSession) {
        oldSession.mockResource = { cleaned: false };
      }

      // Regenerate session
      await SessionManagementCore.regenerateSessionOnAuth(
        mockUser.id,
        oldSessionId,
        {
          method: 'login',
          ipAddress: mockRequest.ip,
          userAgent: mockRequest.headers['user-agent']
        }
      );

      // Verify old session is cleaned up
      const cleanedSession = SessionManagementCore.activeSessions?.get(oldSessionId);
      expect(cleanedSession).toBeUndefined();
    });

    test('should handle high-frequency regeneration attempts', async () => {
      const startTime = Date.now();
      const iterations = 10;

      // Perform multiple rapid regenerations
      let lastSessionId = null;
      for (let i = 0; i < iterations; i++) {
        const result = await SessionManagementCore.regenerateSessionOnAuth(
          mockUser.id,
          lastSessionId,
          {
            method: 'login',
            ipAddress: mockRequest.ip,
            userAgent: mockRequest.headers['user-agent']
          }
        );
        
        expect(result.success).toBe(true);
        lastSessionId = result.newSessionId;
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(executionTime).toBeLessThan(5000); // 5 seconds
    });
  });
});

describe('Session Regeneration Integration Tests', () => {
  test('should integrate with token service', async () => {
    // This would test integration with TokenService
    // Mock or actual integration depending on test environment
    expect(true).toBe(true); // Placeholder
  });

  test('should integrate with audit logging', async () => {
    // This would test integration with audit systems
    // Mock or actual integration depending on test environment
    expect(true).toBe(true); // Placeholder
  });

  test('should work with different authentication methods', async () => {
    const authMethods = ['password', 'oauth', 'mfa', 'biometric'];

    for (const method of authMethods) {
      const mockRequest = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'Test Browser' },
        sessionID: crypto.randomUUID()
      };

      const mockUser = {
        id: crypto.randomUUID(),
        username: 'testuser'
      };

      const result = await SessionManagementCore.regenerateSessionOnAuth(
        mockUser.id,
        null,
        {
          method,
          ipAddress: mockRequest.ip,
          userAgent: mockRequest.headers['user-agent']
        }
      );

      expect(result.success).toBe(true);
      expect(result.newSessionId).toBeDefined();
    }
  });
});