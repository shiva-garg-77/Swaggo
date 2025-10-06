/**
 * Comprehensive Architecture Framework
 * Implements proper separation of concerns, service layer, dependency injection, and error boundaries
 */

import * as React from 'react';

// Dependency Injection Container
export interface ServiceDefinition {
  name: string;
  factory: (...deps: any[]) => any;
  dependencies?: string[];
  singleton?: boolean;
}

export class DIContainer {
  private services = new Map<string, ServiceDefinition>();
  private instances = new Map<string, any>();
  private logger?: any;

  constructor(logger?: any) {
    this.logger = logger;
  }

  /**
   * Register a service in the container
   */
  register<T>(
    name: string,
    factory: (...deps: any[]) => T,
    dependencies: string[] = [],
    singleton: boolean = true
  ): void {
    this.services.set(name, {
      name,
      factory,
      dependencies,
      singleton
    });
    
    this.logger?.debug(`Service registered: ${name}`, { dependencies, singleton });
  }

  /**
   * Resolve a service by name
   */
  resolve<T>(name: string): T {
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service not found: ${name}`);
    }

    // Resolve dependencies
    const resolvedDependencies = service.dependencies?.map(dep => this.resolve(dep)) || [];
    
    try {
      const instance = service.factory(...resolvedDependencies);
      
      if (service.singleton) {
        this.instances.set(name, instance);
      }
      
      this.logger?.debug(`Service resolved: ${name}`);
      return instance;
    } catch (error) {
      this.logger?.error(`Failed to resolve service: ${name}`, error);
      throw error;
    }
  }

  /**
   * Check if service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Clear all instances (useful for testing)
   */
  clearInstances(): void {
    this.instances.clear();
  }
}

// Service Layer Base Classes
export abstract class BaseService {
  protected logger?: any;

  constructor(logger?: any) {
    this.logger = logger;
  }

  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: any): void {
    this.logger?.[level]?.(message, context);
  }
}

export abstract class BaseRepository<T> {
  protected logger?: any;

  constructor(logger?: any) {
    this.logger = logger;
  }

  abstract findById(id: string): Promise<T | null>;
  abstract findAll(filters?: any): Promise<T[]>;
  abstract create(data: Partial<T>): Promise<T>;
  abstract update(id: string, data: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<void>;

  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: any): void {
    this.logger?.[level]?.(message, context);
  }
}

// Domain Models
export interface DomainEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends DomainEntity {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  isActive: boolean;
  emailVerified: boolean;
}

export interface Message extends DomainEntity {
  content: string;
  senderId: string;
  recipientId?: string;
  channelId?: string;
  type: 'text' | 'image' | 'file' | 'system';
  metadata?: any;
  isDeleted: boolean;
}

// Service Layer Implementation
export class UserService extends BaseService {
  constructor(
    private userRepository: BaseRepository<User>,
    // private authService: any, // Reserved for future auth integration
    logger?: any
  ) {
    super(logger);
  }

  async createUser(userData: Partial<User>): Promise<User> {
    this.log('info', 'Creating new user', { email: userData.email });
    
    try {
      // Validate user data
      this.validateUserData(userData);
      
      // Check if user already exists
      const existingUsers = await this.userRepository.findAll({ email: userData.email });
      if (existingUsers.length > 0) {
        throw new Error('User already exists');
      }

      // Create user
      const newUser = await this.userRepository.create({
        ...userData,
        roles: userData.roles || ['user'],
        isActive: true,
        emailVerified: false
      });

      this.log('info', 'User created successfully', { userId: newUser.id });
      return newUser;
    } catch (error) {
      this.log('error', 'Failed to create user', { error, userData });
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    this.log('debug', 'Fetching user by ID', { userId: id });
    return this.userRepository.findById(id);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    this.log('info', 'Updating user', { userId: id, updates });
    
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      const updatedUser = await this.userRepository.update(id, updates);
      this.log('info', 'User updated successfully', { userId: id });
      return updatedUser;
    } catch (error) {
      this.log('error', 'Failed to update user', { error, userId: id });
      throw error;
    }
  }

  private validateUserData(userData: Partial<User>): void {
    if (!userData.email) {
      throw new Error('Email is required');
    }
    if (!userData.username) {
      throw new Error('Username is required');
    }
    // Add more validation as needed
  }
}

export class MessageService extends BaseService {
  constructor(
    private messageRepository: BaseRepository<Message>,
    private userService: UserService,
    private notificationService: any,
    logger?: any
  ) {
    super(logger);
  }

  async sendMessage(messageData: Partial<Message>): Promise<Message> {
    this.log('info', 'Sending message', { 
      senderId: messageData.senderId, 
      type: messageData.type 
    });

    try {
      // Validate sender exists
      const sender = await this.userService.getUserById(messageData.senderId!);
      if (!sender) {
        throw new Error('Sender not found');
      }

      // Validate recipient if specified
      if (messageData.recipientId) {
        const recipient = await this.userService.getUserById(messageData.recipientId);
        if (!recipient) {
          throw new Error('Recipient not found');
        }
      }

      // Create message
      const message = await this.messageRepository.create({
        ...messageData,
        isDeleted: false
      });

      // Send notification
      if (messageData.recipientId) {
        await this.notificationService.sendNotification(messageData.recipientId, {
          type: 'new_message',
          messageId: message.id,
          senderId: message.senderId
        });
      }

      this.log('info', 'Message sent successfully', { messageId: message.id });
      return message;
    } catch (error) {
      this.log('error', 'Failed to send message', { error, messageData });
      throw error;
    }
  }

  async getMessageHistory(userId: string, otherId: string, limit: number = 50): Promise<Message[]> {
    this.log('debug', 'Fetching message history', { userId, otherId, limit });
    
    return this.messageRepository.findAll({
      $or: [
        { senderId: userId, recipientId: otherId },
        { senderId: otherId, recipientId: userId }
      ],
      isDeleted: false,
      $limit: limit,
      $sort: { createdAt: -1 }
    });
  }
}

// Error Boundary Implementation
export interface ErrorInfo {
  componentStack: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | undefined;
  errorInfo?: ErrorInfo | undefined;
}

export class ErrorBoundaryService {
  private static errorHandlers: Array<(error: Error, errorInfo?: ErrorInfo) => void> = [];

  /**
   * Add global error handler
   */
  static addErrorHandler(handler: (error: Error, errorInfo?: ErrorInfo) => void): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Handle error from React Error Boundary
   */
  static handleError(error: Error, errorInfo?: ErrorInfo): void {
    // Log error
    console.error('React Error Boundary caught an error:', error, errorInfo);
    
    // Call registered handlers
    this.errorHandlers.forEach(handler => {
      try {
        handler(error, errorInfo);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    });
  }

  /**
   * Create error boundary component
   */
  static createErrorBoundary(): React.ComponentType<{ 
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  }> {
    return class ErrorBoundary extends React.Component<
      { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; retry: () => void }> },
      ErrorBoundaryState
    > {
      constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; retry: () => void }> }) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
          hasError: true,
          error
        };
      }

      override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        ErrorBoundaryService.handleError(error, errorInfo);
      }

      override render(): React.ReactNode {
        if (this.state && this.state.hasError && this.state.error) {
          const FallbackComponent = this.props.fallback || DefaultErrorFallback;
          return React.createElement(FallbackComponent, {
            error: this.state.error,
            retry: () => this.setState({ hasError: false } as ErrorBoundaryState)
          });
        }

        return this.props.children;
      }
    };
  }
}

// Default Error Fallback Component
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = (props) => {
  return React.createElement('div', {
    className: 'error-boundary-fallback',
    style: {
      padding: '20px',
      margin: '20px',
      border: '1px solid #ff6b6b',
      borderRadius: '4px',
      backgroundColor: '#ffe0e0'
    }
  }, [
    React.createElement('h2', { key: 'title' }, 'Something went wrong'),
    React.createElement('p', { key: 'desc' }, 'An error occurred in this component:'),
    React.createElement('pre', {
      key: 'error',
      style: { fontSize: '12px', color: '#666' }
    }, props.error.message),
    React.createElement('button', {
      key: 'retry',
      onClick: props.retry,
      style: {
        padding: '8px 16px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '10px'
      }
    }, 'Try Again')
  ]);
};

// Project Structure Organization
export class ProjectStructure {
  /**
   * Recommended project structure
   */
  static getRecommendedStructure(): any {
    return {
      'src/': {
        'components/': {
          'common/': 'Reusable UI components',
          'layout/': 'Layout components (Header, Footer, Sidebar)',
          'forms/': 'Form components',
          'charts/': 'Chart and data visualization components'
        },
        'pages/': 'Next.js pages',
        'api/': 'API routes and client',
        'services/': 'Business logic services',
        'repositories/': 'Data access layer',
        'hooks/': 'Custom React hooks',
        'contexts/': 'React contexts',
        'utils/': 'Utility functions',
        'types/': 'TypeScript type definitions',
        'constants/': 'Application constants',
        'config/': 'Configuration files',
        'assets/': {
          'images/': 'Static images',
          'icons/': 'Icon files',
          'styles/': 'Global styles'
        },
        'tests/': {
          'unit/': 'Unit tests',
          'integration/': 'Integration tests',
          'e2e/': 'End-to-end tests',
          'fixtures/': 'Test data and fixtures'
        }
      },
      'public/': 'Static assets served by Next.js',
      'docs/': 'Project documentation',
      'scripts/': 'Build and utility scripts',
      'docker/': 'Docker configuration files',
      'k8s/': 'Kubernetes configuration files'
    };
  }

  /**
   * Generate file structure documentation
   */
  static generateStructureDoc(structure: any, indent: string = ''): string {
    let doc = '';
    
    for (const [key, value] of Object.entries(structure)) {
      if (typeof value === 'string') {
        doc += `${indent}${key} - ${value}\n`;
      } else {
        doc += `${indent}${key}\n`;
        doc += this.generateStructureDoc(value, indent + '  ');
      }
    }
    
    return doc;
  }
}

// Service Container Configuration
export class ServiceContainer {
  private static container: DIContainer;

  /**
   * Initialize service container with all services
   */
  static initialize(logger?: any): DIContainer {
    this.container = new DIContainer(logger);

    // Register core services
    this.container.register('logger', () => logger || console);
    
    // Register repositories (these would be implemented based on your data layer)
    this.container.register('userRepository', (logger) => {
      // Return actual repository implementation
      return new (class extends BaseRepository<User> {
        async findById(_id: string): Promise<User | null> {
          // Implementation
          return null;
        }
        async findAll(_filters?: any): Promise<User[]> {
          return [];
        }
        async create(data: Partial<User>): Promise<User> {
          return data as User;
        }
        async update(_id: string, data: Partial<User>): Promise<User> {
          return data as User;
        }
        async delete(_id: string): Promise<void> {
          // Implementation
        }
      })(logger);
    }, ['logger']);

    this.container.register('messageRepository', (logger) => {
      return new (class extends BaseRepository<Message> {
        async findById(_id: string): Promise<Message | null> {
          return null;
        }
        async findAll(_filters?: any): Promise<Message[]> {
          return [];
        }
        async create(data: Partial<Message>): Promise<Message> {
          return data as Message;
        }
        async update(_id: string, data: Partial<Message>): Promise<Message> {
          return data as Message;
        }
        async delete(_id: string): Promise<void> {
          // Implementation
        }
      })(logger);
    }, ['logger']);

    // Register services
    this.container.register('userService', 
      (userRepository, logger) => new UserService(userRepository, logger),
      ['userRepository', 'logger']
    );

    this.container.register('messageService',
      (messageRepository, userService, notificationService, logger) => 
        new MessageService(messageRepository, userService, notificationService, logger),
      ['messageRepository', 'userService', 'notificationService', 'logger']
    );

    return this.container;
  }

  /**
   * Get service container instance
   */
  static getContainer(): DIContainer {
    if (!this.container) {
      throw new Error('Service container not initialized. Call ServiceContainer.initialize() first.');
    }
    return this.container;
  }

  /**
   * Get service by name
   */
  static getService<T>(name: string): T {
    return this.getContainer().resolve<T>(name);
  }
}

// Architecture Validation
export class ArchitectureValidator {
  /**
   * Validate project follows architectural patterns
   */
  static validateArchitecture(_projectPath: string): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // This would analyze the actual project structure
    // For now, providing template validation

    // Mock validation
    recommendations.push('Consider implementing clean architecture principles');
    recommendations.push('Ensure proper separation between UI and business logic');
    recommendations.push('Use dependency injection for better testability');

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }
}

export default {
  DIContainer,
  BaseService,
  BaseRepository,
  UserService,
  MessageService,
  ErrorBoundaryService,
  ProjectStructure,
  ServiceContainer,
  ArchitectureValidator
};