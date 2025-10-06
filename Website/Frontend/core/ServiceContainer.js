/**
 * Service Container for Dependency Injection
 * Separates business logic from components using service layer architecture
 */

import { EventEmitter } from 'events';
import errorHandlingService, { ERROR_TYPES } from '../services/ErrorHandlingService';

/**
 * Service Lifecycle States
 */
const SERVICE_STATES = {
  UNREGISTERED: 'unregistered',
  REGISTERED: 'registered',
  INITIALIZING: 'initializing',
  INITIALIZED: 'initialized',
  STARTING: 'starting',
  STARTED: 'started',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  ERROR: 'error'
};

/**
 * Service Registration Types
 */
const SERVICE_TYPES = {
  SINGLETON: 'singleton',      // Single instance shared across the app
  TRANSIENT: 'transient',      // New instance every time
  SCOPED: 'scoped',           // Instance per scope (e.g., per request)
  FACTORY: 'factory'          // Factory function that creates instances
};

/**
 * Dependency Resolution Strategies
 */
const RESOLUTION_STRATEGIES = {
  LAZY: 'lazy',               // Resolve dependencies when needed
  EAGER: 'eager',             // Resolve dependencies at registration
  CIRCULAR: 'circular'        // Allow circular dependencies
};

/**
 * Service Definition Class
 */
class ServiceDefinition {
  constructor(name, implementation, options = {}) {
    this.name = name;
    this.implementation = implementation;
    this.type = options.type || SERVICE_TYPES.SINGLETON;
    this.dependencies = options.dependencies || [];
    this.interfaces = options.interfaces || [];
    this.tags = options.tags || [];
    this.lazy = options.lazy !== false;
    this.resolutionStrategy = options.resolutionStrategy || RESOLUTION_STRATEGIES.LAZY;
    this.factory = options.factory || null;
    this.initializer = options.initializer || null;
    this.destroyer = options.destroyer || null;
    this.metadata = options.metadata || {};
    this.scope = options.scope || 'global';
    this.priority = options.priority || 0;
    this.enabled = options.enabled !== false;
    
    // Internal state
    this.state = SERVICE_STATES.REGISTERED;
    this.instance = null;
    this.instances = new Map(); // For scoped services
    this.error = null;
    this.initPromise = null;
    this.startPromise = null;
    this.stopPromise = null;
    this.dependents = new Set(); // Services that depend on this one
  }

  /**
   * Check if service matches interface
   */
  implementsInterface(interfaceName) {
    return this.interfaces.includes(interfaceName);
  }

  /**
   * Check if service has tag
   */
  hasTag(tag) {
    return this.tags.includes(tag);
  }

  /**
   * Get service metadata
   */
  getMetadata(key) {
    return key ? this.metadata[key] : this.metadata;
  }

  /**
   * Set service metadata
   */
  setMetadata(key, value) {
    if (typeof key === 'object') {
      this.metadata = { ...this.metadata, ...key };
    } else {
      this.metadata[key] = value;
    }
  }

  /**
   * Check if service is in specified state
   */
  isState(...states) {
    return states.includes(this.state);
  }

  /**
   * Transition to new state
   */
  setState(newState, error = null) {
    const oldState = this.state;
    this.state = newState;
    this.error = error;
    
    return { oldState, newState, error };
  }
}

/**
 * Service Scope Class
 */
class ServiceScope {
  constructor(name, container) {
    this.name = name;
    this.container = container;
    this.instances = new Map();
    this.disposed = false;
    this.startTime = Date.now();
  }

  /**
   * Get or create scoped instance
   */
  getInstance(serviceName) {
    if (this.disposed) {
      throw new Error(`Scope '${this.name}' has been disposed`);
    }

    if (!this.instances.has(serviceName)) {
      const instance = this.container.createInstance(serviceName);
      this.instances.set(serviceName, instance);
    }

    return this.instances.get(serviceName);
  }

  /**
   * Dispose scope and cleanup instances
   */
  async dispose() {
    if (this.disposed) return;
    
    this.disposed = true;

    // Dispose instances in reverse order
    const instances = Array.from(this.instances.entries()).reverse();
    
    for (const [serviceName, instance] of instances) {
      try {
        const definition = this.container.getDefinition(serviceName);
        if (definition && definition.destroyer && typeof definition.destroyer === 'function') {
          await definition.destroyer(instance);
        } else if (instance && typeof instance.dispose === 'function') {
          await instance.dispose();
        }
      } catch (error) {
        console.warn(`Error disposing service '${serviceName}':`, error);
      }
    }

    this.instances.clear();
  }

  /**
   * Get scope statistics
   */
  getStats() {
    return {
      name: this.name,
      instanceCount: this.instances.size,
      services: Array.from(this.instances.keys()),
      lifespan: Date.now() - this.startTime,
      disposed: this.disposed
    };
  }
}

/**
 * Main Service Container Class
 */
class ServiceContainer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.config = {
      enableCircularDependencyDetection: true,
      enableDependencyGraph: true,
      enableLifecycleEvents: true,
      enableMetrics: true,
      maxCircularDepth: 10,
      autoStart: false,
      strictMode: true,
      ...options
    };

    // Service registry
    this.services = new Map(); // serviceName -> ServiceDefinition
    this.aliases = new Map(); // alias -> serviceName
    this.interfaces = new Map(); // interfaceName -> Set of serviceNames
    this.tags = new Map(); // tagName -> Set of serviceNames
    
    // Scopes
    this.scopes = new Map(); // scopeName -> ServiceScope
    this.currentScope = null;
    
    // Dependency graph
    this.dependencyGraph = new Map(); // serviceName -> Set of dependencies
    this.dependentGraph = new Map(); // serviceName -> Set of dependents
    
    // State tracking
    this.isStarted = false;
    this.isStarting = false;
    this.isStopping = false;
    
    // Metrics
    this.metrics = {
      registrations: 0,
      resolutions: 0,
      circularDependencies: 0,
      errors: 0,
      startTime: null,
      services: {
        total: 0,
        singletons: 0,
        transients: 0,
        scoped: 0,
        factories: 0
      }
    };
    
    // Initialize core services
    this.initializeCoreServices();
  }

  /**
   * Initialize core container services
   */
  initializeCoreServices() {
    // Register the container itself
    this.register('container', this, {
      type: SERVICE_TYPES.SINGLETON,
      tags: ['core', 'container']
    });

    // Register configuration
    this.register('config', this.config, {
      type: SERVICE_TYPES.SINGLETON,
      tags: ['core', 'config']
    });
  }

  /**
   * Register a service
   */
  register(name, implementation, options = {}) {
    try {
      if (this.services.has(name)) {
        if (this.config.strictMode) {
          throw new Error(`Service '${name}' is already registered`);
        } else {
          console.warn(`Service '${name}' is being overridden`);
        }
      }

      // Create service definition
      const definition = new ServiceDefinition(name, implementation, options);
      
      // Validate dependencies
      if (definition.dependencies.length > 0) {
        this.validateDependencies(name, definition.dependencies);
      }
      
      // Store service definition
      this.services.set(name, definition);
      
      // Update indexes
      this.updateServiceIndexes(name, definition);
      
      // Update metrics
      this.metrics.registrations++;
      this.metrics.services.total++;
      this.metrics.services[definition.type]++;
      
      // Emit registration event
      if (this.config.enableLifecycleEvents) {
        this.emit('serviceRegistered', { name, definition });
      }
      
      // Auto-initialize if not lazy
      if (!definition.lazy && this.isStarted) {
        this.initialize(name);
      }
      
      return this;
    } catch (error) {
      this.metrics.errors++;
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.DEPENDENCY_ERROR,
          `Service registration failed: ${name}`,
          { name, implementation, options, error }
        )
      );
      throw error;
    }
  }

  /**
   * Register service factory
   */
  factory(name, factory, options = {}) {
    return this.register(name, null, {
      ...options,
      type: SERVICE_TYPES.FACTORY,
      factory
    });
  }

  /**
   * Register singleton service
   */
  singleton(name, implementation, options = {}) {
    return this.register(name, implementation, {
      ...options,
      type: SERVICE_TYPES.SINGLETON
    });
  }

  /**
   * Register transient service
   */
  transient(name, implementation, options = {}) {
    return this.register(name, implementation, {
      ...options,
      type: SERVICE_TYPES.TRANSIENT
    });
  }

  /**
   * Register scoped service
   */
  scoped(name, implementation, options = {}) {
    return this.register(name, implementation, {
      ...options,
      type: SERVICE_TYPES.SCOPED
    });
  }

  /**
   * Register service alias
   */
  alias(aliasName, serviceName) {
    if (this.aliases.has(aliasName)) {
      throw new Error(`Alias '${aliasName}' already exists`);
    }
    
    if (!this.services.has(serviceName)) {
      throw new Error(`Service '${serviceName}' not found for alias '${aliasName}'`);
    }
    
    this.aliases.set(aliasName, serviceName);
    
    this.emit('aliasRegistered', { alias: aliasName, service: serviceName });
    
    return this;
  }

  /**
   * Resolve service by name
   */
  async resolve(name, scope = null) {
    try {
      // Resolve alias
      const serviceName = this.aliases.get(name) || name;
      
      if (!this.services.has(serviceName)) {
        throw new Error(`Service '${serviceName}' not found`);
      }
      
      const definition = this.services.get(serviceName);
      
      // Check if service is enabled
      if (!definition.enabled) {
        throw new Error(`Service '${serviceName}' is disabled`);
      }
      
      // Update metrics
      this.metrics.resolutions++;
      
      // Emit resolution event
      this.emit('serviceResolving', { name: serviceName, definition });
      
      let instance;
      
      switch (definition.type) {
        case SERVICE_TYPES.SINGLETON:
          instance = await this.resolveSingleton(definition);
          break;
        case SERVICE_TYPES.TRANSIENT:
          instance = await this.resolveTransient(definition);
          break;
        case SERVICE_TYPES.SCOPED:
          instance = await this.resolveScoped(definition, scope);
          break;
        case SERVICE_TYPES.FACTORY:
          instance = await this.resolveFactory(definition);
          break;
        default:
          throw new Error(`Unknown service type: ${definition.type}`);
      }
      
      // Emit resolution completed event
      this.emit('serviceResolved', { name: serviceName, instance, definition });
      
      return instance;
      
    } catch (error) {
      this.metrics.errors++;
      
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.DEPENDENCY_ERROR,
          `Service resolution failed: ${name}`,
          { name, scope, error }
        )
      );
      
      this.emit('serviceResolutionFailed', { name, error });
      throw error;
    }
  }

  /**
   * Resolve singleton service
   */
  async resolveSingleton(definition) {
    if (definition.instance) {
      return definition.instance;
    }
    
    if (definition.initPromise) {
      return await definition.initPromise;
    }
    
    definition.initPromise = this.createInstance(definition);
    definition.instance = await definition.initPromise;
    definition.initPromise = null;
    
    return definition.instance;
  }

  /**
   * Resolve transient service
   */
  async resolveTransient(definition) {
    return await this.createInstance(definition);
  }

  /**
   * Resolve scoped service
   */
  async resolveScoped(definition, scopeName = null) {
    const scope = scopeName ? this.getScope(scopeName) : this.currentScope;
    
    if (!scope) {
      throw new Error(`No scope available for scoped service '${definition.name}'`);
    }
    
    return scope.getInstance(definition.name);
  }

  /**
   * Resolve factory service
   */
  async resolveFactory(definition) {
    if (!definition.factory || typeof definition.factory !== 'function') {
      throw new Error(`Factory function not provided for service '${definition.name}'`);
    }
    
    const dependencies = await this.resolveDependencies(definition.dependencies);
    return await definition.factory(...dependencies, this);
  }

  /**
   * Create service instance
   */
  async createInstance(definition) {
    try {
      // Set state to initializing
      definition.setState(SERVICE_STATES.INITIALIZING);
      
      // Resolve dependencies
      const dependencies = await this.resolveDependencies(definition.dependencies);
      
      let instance;
      
      // Create instance
      if (typeof definition.implementation === 'function') {
        // Constructor function or class
        instance = new definition.implementation(...dependencies);
      } else if (definition.factory) {
        // Factory function
        instance = await definition.factory(...dependencies, this);
      } else {
        // Direct instance or value
        instance = definition.implementation;
      }
      
      // Run initializer if provided
      if (definition.initializer && typeof definition.initializer === 'function') {
        await definition.initializer(instance, ...dependencies, this);
      }
      
      // Run initialize method if exists
      if (instance && typeof instance.initialize === 'function') {
        await instance.initialize();
      }
      
      // Set state to initialized
      definition.setState(SERVICE_STATES.INITIALIZED);
      
      return instance;
      
    } catch (error) {
      definition.setState(SERVICE_STATES.ERROR, error);
      throw error;
    }
  }

  /**
   * Resolve service dependencies
   */
  async resolveDependencies(dependencies) {
    if (!dependencies || dependencies.length === 0) {
      return [];
    }
    
    const resolved = [];
    
    for (const dependency of dependencies) {
      const instance = await this.resolve(dependency);
      resolved.push(instance);
    }
    
    return resolved;
  }

  /**
   * Check if service exists
   */
  has(name) {
    const serviceName = this.aliases.get(name) || name;
    return this.services.has(serviceName);
  }

  /**
   * Get service definition
   */
  getDefinition(name) {
    const serviceName = this.aliases.get(name) || name;
    return this.services.get(serviceName);
  }

  /**
   * Get services by interface
   */
  getByInterface(interfaceName) {
    const serviceNames = this.interfaces.get(interfaceName) || new Set();
    return Array.from(serviceNames);
  }

  /**
   * Get services by tag
   */
  getByTag(tagName) {
    const serviceNames = this.tags.get(tagName) || new Set();
    return Array.from(serviceNames);
  }

  /**
   * Create new scope
   */
  createScope(name = null) {
    const scopeName = name || `scope_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    if (this.scopes.has(scopeName)) {
      throw new Error(`Scope '${scopeName}' already exists`);
    }
    
    const scope = new ServiceScope(scopeName, this);
    this.scopes.set(scopeName, scope);
    
    this.emit('scopeCreated', { name: scopeName, scope });
    
    return scope;
  }

  /**
   * Get scope by name
   */
  getScope(name) {
    return this.scopes.get(name);
  }

  /**
   * Set current scope
   */
  setScope(scope) {
    this.currentScope = scope instanceof ServiceScope ? scope : this.getScope(scope);
    return this;
  }

  /**
   * Execute function within scope
   */
  async withScope(scopeName, callback) {
    const scope = typeof scopeName === 'string' ? this.createScope(scopeName) : scopeName;
    const previousScope = this.currentScope;
    
    try {
      this.setScope(scope);
      return await callback(scope);
    } finally {
      this.currentScope = previousScope;
      if (typeof scopeName === 'string') {
        await scope.dispose();
        this.scopes.delete(scope.name);
      }
    }
  }

  /**
   * Start all services
   */
  async start() {
    if (this.isStarted || this.isStarting) {
      return;
    }
    
    this.isStarting = true;
    this.metrics.startTime = Date.now();
    
    try {
      this.emit('containerStarting');
      
      // Get services sorted by priority
      const services = Array.from(this.services.values())
        .filter(def => def.enabled && !def.lazy)
        .sort((a, b) => b.priority - a.priority);
      
      // Initialize services
      for (const definition of services) {
        try {
          await this.initialize(definition.name);
          await this.startService(definition.name);
        } catch (error) {
          console.error(`Failed to start service '${definition.name}':`, error);
          if (this.config.strictMode) {
            throw error;
          }
        }
      }
      
      this.isStarted = true;
      this.isStarting = false;
      
      this.emit('containerStarted');
      
    } catch (error) {
      this.isStarting = false;
      this.emit('containerStartFailed', error);
      throw error;
    }
  }

  /**
   * Stop all services
   */
  async stop() {
    if (!this.isStarted || this.isStopping) {
      return;
    }
    
    this.isStopping = true;
    
    try {
      this.emit('containerStopping');
      
      // Get started services in reverse priority order
      const services = Array.from(this.services.values())
        .filter(def => def.isState(SERVICE_STATES.STARTED))
        .sort((a, b) => a.priority - b.priority);
      
      // Stop services
      for (const definition of services) {
        try {
          await this.stopService(definition.name);
        } catch (error) {
          console.error(`Failed to stop service '${definition.name}':`, error);
        }
      }
      
      // Dispose all scopes
      for (const scope of this.scopes.values()) {
        await scope.dispose();
      }
      this.scopes.clear();
      
      this.isStarted = false;
      this.isStopping = false;
      
      this.emit('containerStopped');
      
    } catch (error) {
      this.isStopping = false;
      this.emit('containerStopFailed', error);
      throw error;
    }
  }

  /**
   * Initialize specific service
   */
  async initialize(name) {
    const definition = this.getDefinition(name);
    if (!definition) {
      throw new Error(`Service '${name}' not found`);
    }
    
    if (definition.isState(SERVICE_STATES.INITIALIZED, SERVICE_STATES.STARTED)) {
      return;
    }
    
    if (definition.type === SERVICE_TYPES.SINGLETON) {
      await this.resolveSingleton(definition);
    }
    
    this.emit('serviceInitialized', { name, definition });
  }

  /**
   * Start specific service
   */
  async startService(name) {
    const definition = this.getDefinition(name);
    if (!definition) {
      throw new Error(`Service '${name}' not found`);
    }
    
    if (definition.isState(SERVICE_STATES.STARTED)) {
      return;
    }
    
    definition.setState(SERVICE_STATES.STARTING);
    
    try {
      const instance = await this.resolve(name);
      
      if (instance && typeof instance.start === 'function') {
        await instance.start();
      }
      
      definition.setState(SERVICE_STATES.STARTED);
      this.emit('serviceStarted', { name, definition, instance });
      
    } catch (error) {
      definition.setState(SERVICE_STATES.ERROR, error);
      throw error;
    }
  }

  /**
   * Stop specific service
   */
  async stopService(name) {
    const definition = this.getDefinition(name);
    if (!definition) {
      throw new Error(`Service '${name}' not found`);
    }
    
    if (!definition.isState(SERVICE_STATES.STARTED)) {
      return;
    }
    
    definition.setState(SERVICE_STATES.STOPPING);
    
    try {
      const instance = definition.instance;
      
      if (instance && typeof instance.stop === 'function') {
        await instance.stop();
      }
      
      if (definition.destroyer && typeof definition.destroyer === 'function') {
        await definition.destroyer(instance);
      }
      
      definition.setState(SERVICE_STATES.STOPPED);
      this.emit('serviceStopped', { name, definition, instance });
      
    } catch (error) {
      definition.setState(SERVICE_STATES.ERROR, error);
      throw error;
    }
  }

  /**
   * Update service indexes
   */
  updateServiceIndexes(name, definition) {
    // Update interface index
    for (const interfaceName of definition.interfaces) {
      if (!this.interfaces.has(interfaceName)) {
        this.interfaces.set(interfaceName, new Set());
      }
      this.interfaces.get(interfaceName).add(name);
    }
    
    // Update tag index
    for (const tag of definition.tags) {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag).add(name);
    }
    
    // Update dependency graph
    if (this.config.enableDependencyGraph) {
      this.dependencyGraph.set(name, new Set(definition.dependencies));
      
      for (const dependency of definition.dependencies) {
        if (!this.dependentGraph.has(dependency)) {
          this.dependentGraph.set(dependency, new Set());
        }
        this.dependentGraph.get(dependency).add(name);
      }
    }
  }

  /**
   * Validate service dependencies
   */
  validateDependencies(serviceName, dependencies) {
    if (!this.config.enableCircularDependencyDetection) {
      return;
    }
    
    const visited = new Set();
    const stack = new Set();
    
    const detectCircular = (name, path = []) => {
      if (stack.has(name)) {
        const cycle = [...path, name];
        this.metrics.circularDependencies++;
        throw new Error(`Circular dependency detected: ${cycle.join(' -> ')}`);
      }
      
      if (visited.has(name)) {
        return;
      }
      
      visited.add(name);
      stack.add(name);
      
      const definition = this.getDefinition(name);
      if (definition) {
        for (const dep of definition.dependencies) {
          detectCircular(dep, [...path, name]);
        }
      }
      
      stack.delete(name);
    };
    
    for (const dependency of dependencies) {
      detectCircular(dependency, [serviceName]);
    }
  }

  /**
   * Get dependency graph
   */
  getDependencyGraph() {
    const graph = {};
    
    for (const [service, dependencies] of this.dependencyGraph.entries()) {
      graph[service] = {
        dependencies: Array.from(dependencies),
        dependents: Array.from(this.dependentGraph.get(service) || [])
      };
    }
    
    return graph;
  }

  /**
   * Get container statistics
   */
  getStats() {
    return {
      ...this.metrics,
      services: {
        ...this.metrics.services,
        byState: this.getServicesByState(),
        byType: this.getServicesByType()
      },
      scopes: this.scopes.size,
      aliases: this.aliases.size,
      interfaces: this.interfaces.size,
      tags: this.tags.size,
      uptime: this.metrics.startTime ? Date.now() - this.metrics.startTime : 0,
      isStarted: this.isStarted
    };
  }

  /**
   * Get services grouped by state
   */
  getServicesByState() {
    const byState = {};
    
    for (const state of Object.values(SERVICE_STATES)) {
      byState[state] = [];
    }
    
    for (const [name, definition] of this.services.entries()) {
      byState[definition.state].push(name);
    }
    
    return byState;
  }

  /**
   * Get services grouped by type
   */
  getServicesByType() {
    const byType = {};
    
    for (const type of Object.values(SERVICE_TYPES)) {
      byType[type] = [];
    }
    
    for (const [name, definition] of this.services.entries()) {
      byType[definition.type].push(name);
    }
    
    return byType;
  }

  /**
   * Get all service names
   */
  getServiceNames() {
    return Array.from(this.services.keys());
  }

  /**
   * Clear all services
   */
  clear() {
    this.services.clear();
    this.aliases.clear();
    this.interfaces.clear();
    this.tags.clear();
    this.dependencyGraph.clear();
    this.dependentGraph.clear();
    
    // Reset metrics
    this.metrics.services = {
      total: 0,
      singletons: 0,
      transients: 0,
      scoped: 0,
      factories: 0
    };
    
    this.emit('containerCleared');
  }

  /**
   * Dispose container and cleanup
   */
  async dispose() {
    if (this.isStarted) {
      await this.stop();
    }
    
    this.clear();
    this.removeAllListeners();
    
    this.emit('containerDisposed');
  }
}

// Create global container instance
const container = new ServiceContainer();

export default container;
export {
  ServiceContainer,
  ServiceDefinition,
  ServiceScope,
  SERVICE_STATES,
  SERVICE_TYPES,
  RESOLUTION_STRATEGIES
};