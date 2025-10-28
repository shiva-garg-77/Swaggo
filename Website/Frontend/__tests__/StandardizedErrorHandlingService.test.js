const { 
  default: standardizedErrorHandlingService,
  AppError,
  ERROR_TYPES,
  ERROR_SEVERITY,
  RECOVERY_ACTIONS
} = require('../services/StandardizedErrorHandlingService.js');

describe('StandardizedErrorHandlingService', () => {
  beforeEach(() => {
    // Clear all errors before each test
    standardizedErrorHandlingService.clearErrors();
  });

  describe('AppError', () => {
    test('should create an AppError with correct properties', () => {
      const error = new AppError(
        ERROR_TYPES.NETWORK_ERROR,
        'Network connection failed',
        { url: 'https://api.example.com' }
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error.type).toBe(ERROR_TYPES.NETWORK_ERROR);
      expect(error.message).toBe('Network connection failed');
      expect(error.details).toEqual({ url: 'https://api.example.com' });
      expect(error.id).toBeDefined();
      expect(error.timestamp).toBeDefined();
      expect(error.severity).toBe(ERROR_SEVERITY.MEDIUM);
      expect(error.recoveryActions).toContain(RECOVERY_ACTIONS.RETRY);
      expect(error.userMessage).toBe('Connection problem. Please check your internet connection.');
    });

    test('should generate unique error IDs', () => {
      const error1 = new AppError(ERROR_TYPES.UNKNOWN_ERROR, 'Error 1');
      const error2 = new AppError(ERROR_TYPES.UNKNOWN_ERROR, 'Error 2');

      expect(error1.id).not.toBe(error2.id);
    });
  });

  describe('Error Handling Service', () => {
    test('should be a singleton instance', () => {
      const service1 = standardizedErrorHandlingService;
      const service2 = standardizedErrorHandlingService;
      
      expect(service1).toBe(service2);
    });

    test('should store and retrieve errors', async () => {
      const error = new AppError(ERROR_TYPES.VALIDATION_ERROR, 'Invalid input');
      await standardizedErrorHandlingService.handleError(error);

      const storedError = standardizedErrorHandlingService.getError(error.id);
      expect(storedError).toBeDefined();
      expect(storedError.id).toBe(error.id);
      expect(storedError.type).toBe(ERROR_TYPES.VALIDATION_ERROR);
    });

    test('should update statistics correctly', async () => {
      const error1 = new AppError(ERROR_TYPES.NETWORK_ERROR, 'Network error 1');
      const error2 = new AppError(ERROR_TYPES.NETWORK_ERROR, 'Network error 2');
      const error3 = new AppError(ERROR_TYPES.VALIDATION_ERROR, 'Validation error');

      await standardizedErrorHandlingService.handleError(error1);
      await standardizedErrorHandlingService.handleError(error2);
      await standardizedErrorHandlingService.handleError(error3);

      const stats = standardizedErrorHandlingService.getStats();
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType[ERROR_TYPES.NETWORK_ERROR]).toBe(2);
      expect(stats.errorsByType[ERROR_TYPES.VALIDATION_ERROR]).toBe(1);
    });

    test('should clear errors correctly', () => {
      // Add some errors
      const error1 = new AppError(ERROR_TYPES.NETWORK_ERROR, 'Network error');
      const error2 = new AppError(ERROR_TYPES.VALIDATION_ERROR, 'Validation error');
      
      standardizedErrorHandlingService.handleError(error1);
      standardizedErrorHandlingService.handleError(error2);

      expect(standardizedErrorHandlingService.getAllErrors().length).toBe(2);

      // Clear errors
      standardizedErrorHandlingService.clearErrors();
      expect(standardizedErrorHandlingService.getAllErrors().length).toBe(0);
    });

    test('should filter errors by type', async () => {
      const networkError = new AppError(ERROR_TYPES.NETWORK_ERROR, 'Network error');
      const validationError = new AppError(ERROR_TYPES.VALIDATION_ERROR, 'Validation error');
      const authError = new AppError(ERROR_TYPES.UNAUTHORIZED_ERROR, 'Auth error');

      await standardizedErrorHandlingService.handleError(networkError);
      await standardizedErrorHandlingService.handleError(validationError);
      await standardizedErrorHandlingService.handleError(authError);

      const networkErrors = standardizedErrorHandlingService.getErrorsByType(ERROR_TYPES.NETWORK_ERROR);
      const validationErrors = standardizedErrorHandlingService.getErrorsByType(ERROR_TYPES.VALIDATION_ERROR);

      expect(networkErrors.length).toBe(1);
      expect(networkErrors[0].type).toBe(ERROR_TYPES.NETWORK_ERROR);
      expect(validationErrors.length).toBe(1);
      expect(validationErrors[0].type).toBe(ERROR_TYPES.VALIDATION_ERROR);
    });

    test('should filter errors by severity', async () => {
      const criticalError = new AppError(ERROR_TYPES.INTERNAL_ERROR, 'Critical error');
      const highError = new AppError(ERROR_TYPES.UNAUTHORIZED_ERROR, 'High error');
      const mediumError = new AppError(ERROR_TYPES.NETWORK_ERROR, 'Medium error');

      await standardizedErrorHandlingService.handleError(criticalError);
      await standardizedErrorHandlingService.handleError(highError);
      await standardizedErrorHandlingService.handleError(mediumError);

      const criticalErrors = standardizedErrorHandlingService.getErrorsBySeverity(ERROR_SEVERITY.CRITICAL);
      const highErrors = standardizedErrorHandlingService.getErrorsBySeverity(ERROR_SEVERITY.HIGH);
      const mediumErrors = standardizedErrorHandlingService.getErrorsBySeverity(ERROR_SEVERITY.MEDIUM);

      expect(criticalErrors.length).toBe(1);
      expect(criticalErrors[0].severity).toBe(ERROR_SEVERITY.CRITICAL);
      expect(highErrors.length).toBe(1);
      expect(highErrors[0].severity).toBe(ERROR_SEVERITY.HIGH);
      expect(mediumErrors.length).toBe(1);
      expect(mediumErrors[0].severity).toBe(ERROR_SEVERITY.MEDIUM);
    });
  });

  describe('Configuration', () => {
    test('should allow configuration updates', () => {
      const originalConfig = { ...standardizedErrorHandlingService.config };
      
      standardizedErrorHandlingService.configure({
        enableNotifications: false,
        maxRetryAttempts: 5
      });

      expect(standardizedErrorHandlingService.config.enableNotifications).toBe(false);
      expect(standardizedErrorHandlingService.config.maxRetryAttempts).toBe(5);

      // Reset to original config
      standardizedErrorHandlingService.configure(originalConfig);
    });
  });
});