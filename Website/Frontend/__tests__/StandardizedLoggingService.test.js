import standardizedLoggingService from '../services/StandardizedLoggingService.js';

describe('Frontend StandardizedLoggingService', () => {
  describe('Log Levels', () => {
    test('should log debug message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      standardizedLoggingService.debug('Test debug message', { test: true });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should log info message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      standardizedLoggingService.info('Test info message', { test: true });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should log warning message', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      standardizedLoggingService.warn('Test warning message', { test: true });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should log error message', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      standardizedLoggingService.error('Test error message', new Error('Test error'), { test: true });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should log fatal message', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      standardizedLoggingService.fatal('Test fatal message', new Error('Test fatal'), { test: true });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Utility Functions', () => {
    test('should create namespaced logger', () => {
      const namespacedLogger = standardizedLoggingService.createLogger('Test');
      
      expect(namespacedLogger).toBeDefined();
      expect(typeof namespacedLogger.debug).toBe('function');
      expect(typeof namespacedLogger.info).toBe('function');
      expect(typeof namespacedLogger.warn).toBe('function');
      expect(typeof namespacedLogger.error).toBe('function');
      expect(typeof namespacedLogger.fatal).toBe('function');
    });
  });
});