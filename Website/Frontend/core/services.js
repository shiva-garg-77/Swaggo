/**
 * Service Registration Configuration
 * Wires up all centralized services with dependency injection
 */

import container from './ServiceContainer';

// Import all services
import apiService from '../services/ApiService';
import validationService from '../services/ValidationService';
import webRTCService from '../services/WebRTCService';
import notificationService from '../services/UnifiedNotificationService.js';
import fileUploadService from '../services/FileUploadService';
import errorHandlingService from '../services/ErrorHandlingService';
import cacheService from '../services/CacheService';
import UnifiedSocketService from '../services/UnifiedSocketService.js'; // Import UnifiedSocketService

// Import utilities
import DataTransformer from '../utils/DataTransformer';

/**
 * Register all services with the container
 */
export function registerServices() {
  // Core Services (highest priority)
  container.singleton('errorHandling', errorHandlingService, {
    priority: 100,
    tags: ['core', 'infrastructure'],
    interfaces: ['IErrorHandler'],
    metadata: {
      description: 'Handles all application errors with standardized recovery',
      version: '1.0.0'
    }
  });

  container.singleton('cache', cacheService, {
    priority: 95,
    tags: ['core', 'infrastructure'],
    interfaces: ['ICache'],
    dependencies: ['errorHandling'],
    metadata: {
      description: 'Centralized caching with multiple storage backends',
      version: '1.0.0'
    }
  });

  container.singleton('notification', notificationService, {
    priority: 90,
    tags: ['core', 'ui'],
    interfaces: ['INotificationService'],
    dependencies: ['errorHandling'],
    metadata: {
      description: 'Unified notification system with multiple channels',
      version: '1.0.0'
    }
  });

  // Infrastructure Services (high priority)
  container.singleton('api', apiService, {
    priority: 80,
    tags: ['infrastructure', 'networking'],
    interfaces: ['IApiService'],
    dependencies: ['errorHandling', 'notification', 'cache'],
    metadata: {
      description: 'Centralized API client with standardized error handling',
      version: '1.0.0'
    }
  });

  container.singleton('validation', validationService, {
    priority: 75,
    tags: ['infrastructure', 'validation'],
    interfaces: ['IValidationService'],
    dependencies: ['errorHandling'],
    metadata: {
      description: 'Comprehensive data validation with extensible rules',
      version: '1.0.0'
    }
  });

  // Application Services (medium priority)
  // Note: Authentication is handled by React Context (FixedSecureAuthContext)

  container.singleton('webrtc', webRTCService, {
    priority: 60,
    tags: ['application', 'media'],
    interfaces: ['IWebRTCService'],
    dependencies: ['errorHandling', 'notification'],
    metadata: {
      description: 'WebRTC communication and media handling',
      version: '1.0.0'
    }
  });

  container.singleton('fileUpload', fileUploadService, {
    priority: 55,
    tags: ['application', 'media'],
    interfaces: ['IFileUploadService'],
    dependencies: ['api', 'validation', 'notification', 'errorHandling'],
    metadata: {
      description: 'File upload with progress tracking and validation',
      version: '1.0.0'
    }
  });

  // Register UnifiedSocketService with dependency injection
  container.singleton('socket', UnifiedSocketService, {
    priority: 50,
    tags: ['application', 'networking'],
    interfaces: ['ISocketService'],
    dependencies: ['notification'], // Inject notification service to avoid circular dependency
    factory: (notification) => new UnifiedSocketService(notification), // Factory function to inject dependencies
    metadata: {
      description: 'Unified Socket.IO service with proper dependency injection',
      version: '3.2.0'
    }
  });

  // Utility Services (low priority)
  container.singleton('dataTransformer', DataTransformer, {
    priority: 50,
    tags: ['utility', 'data'],
    interfaces: ['IDataTransformer'],
    dependencies: ['errorHandling'],
    metadata: {
      description: 'Data transformation and formatting utilities',
      version: '1.0.0'
    }
  });

  // Register service aliases for convenience
  container.alias('errors', 'errorHandling');
  container.alias('notifications', 'notification');
  // Note: Authentication aliases removed - use React Context instead
  container.alias('transformer', 'dataTransformer');
  container.alias('uploads', 'fileUpload');
  container.alias('rtc', 'webrtc');
  container.alias('socketService', 'socket'); // Alias for socket service

  console.log('✅ All services registered successfully');
}

/**
 * Initialize and start all services
 */
export async function startServices() {
  try {
    await container.start();
    console.log('✅ All services started successfully');
    
    // Log service statistics
    const stats = container.getStats();
    console.log('📊 Service Container Stats:', stats);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to start services:', error);
    throw error;
  }
}

/**
 * Stop all services
 */
export async function stopServices() {
  try {
    await container.stop();
    console.log('✅ All services stopped successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to stop services:', error);
    throw error;
  }
}

/**
 * Get service instance by name
 */
export async function getService(name) {
  return await container.resolve(name);
}

/**
 * Check if service is registered
 */
export function hasService(name) {
  return container.has(name);
}

/**
 * Get services by tag
 */
export function getServicesByTag(tag) {
  return container.getByTag(tag);
}

/**
 * Get services by interface
 */
export function getServicesByInterface(interfaceName) {
  return container.getByInterface(interfaceName);
}

/**
 * Create a new service scope
 */
export function createServiceScope(name) {
  return container.createScope(name);
}

/**
 * Execute function within a service scope
 */
export async function withServiceScope(scopeName, callback) {
  return await container.withScope(scopeName, callback);
}

/**
 * Get container statistics
 */
export function getServiceStats() {
  return container.getStats();
}

/**
 * Get dependency graph
 */
export function getDependencyGraph() {
  return container.getDependencyGraph();
}

/**
 * Register custom service
 */
export function registerService(name, implementation, options = {}) {
  return container.register(name, implementation, options);
}

/**
 * Register singleton service
 */
export function registerSingleton(name, implementation, options = {}) {
  return container.singleton(name, implementation, options);
}

/**
 * Register transient service
 */
export function registerTransient(name, implementation, options = {}) {
  return container.transient(name, implementation, options);
}

/**
 * Register scoped service
 */
export function registerScoped(name, implementation, options = {}) {
  return container.scoped(name, implementation, options);
}

/**
 * Register factory service
 */
export function registerFactory(name, factory, options = {}) {
  return container.factory(name, factory, options);
}

/**
 * Service-aware React Hook
 */
export function useService(serviceName) {
  const [service, setService] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;

    async function resolveService() {
      try {
        setLoading(true);
        setError(null);
        
        const serviceInstance = await container.resolve(serviceName);
        
        if (mounted) {
          setService(serviceInstance);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      }
    }

    resolveService();

    return () => {
      mounted = false;
    };
  }, [serviceName]);

  return { service, loading, error };
}

/**
 * Service-aware Higher-Order Component
 */
export function withServices(serviceMap) {
  return function(WrappedComponent) {
    const ServiceInjectedComponent = (props) => {
      const [services, setServices] = React.useState({});
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState(null);

      React.useEffect(() => {
        let mounted = true;

        async function resolveServices() {
          try {
            setLoading(true);
            setError(null);
            
            const resolvedServices = {};
            
            for (const [key, serviceName] of Object.entries(serviceMap)) {
              resolvedServices[key] = await container.resolve(serviceName);
            }
            
            if (mounted) {
              setServices(resolvedServices);
              setLoading(false);
            }
          } catch (err) {
            if (mounted) {
              setError(err);
              setLoading(false);
            }
          }
        }

        resolveServices();

        return () => {
          mounted = false;
        };
      }, []);

      if (loading) {
        return <div>Loading services...</div>;
      }

      if (error) {
        return <div>Error loading services: {error.message}</div>;
      }

      return <WrappedComponent {...props} services={services} />;
    };

    ServiceInjectedComponent.displayName = `withServices(${WrappedComponent.displayName || WrappedComponent.name})`;
    
    return ServiceInjectedComponent;
  };
}

/**
 * Bootstrap the application with services
 */
export async function bootstrapApplication() {
  try {
    console.log('🚀 Bootstrapping application...');
    
    // Register all services
    registerServices();
    
    // Start all services
    await startServices();
    
    console.log('✅ Application bootstrap completed');
    
    // Setup graceful shutdown
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', async () => {
        await stopServices();
      });
    }
    
    // Setup error boundary for unhandled service errors
    container.on('serviceResolutionFailed', ({ name, error }) => {
      console.error(`Service '${name}' resolution failed:`, error);
    });
    
    container.on('containerStartFailed', (error) => {
      console.error('Container start failed:', error);
    });
    
    return container;
    
  } catch (error) {
    console.error('❌ Application bootstrap failed:', error);
    throw error;
  }
}

// Export the container for advanced usage
export { container };

export default {
  registerServices,
  startServices,
  stopServices,
  getService,
  hasService,
  getServicesByTag,
  getServicesByInterface,
  createServiceScope,
  withServiceScope,
  getServiceStats,
  getDependencyGraph,
  registerService,
  registerSingleton,
  registerTransient,
  registerScoped,
  registerFactory,
  useService,
  withServices,
  bootstrapApplication,
  container
};