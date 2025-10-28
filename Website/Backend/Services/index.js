/**
 * @fileoverview Services index - Re-exports all major services for easier imports
 * @module Services
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * This file provides a centralized export point for all major services in the application.
 * It simplifies imports by allowing consumers to import multiple services from a single point.
 * 
 * Usage:
 * ```javascript
 * // Instead of:
 * import ChatService from './Services/Chat/ChatService.js';
 * import MessageService from './Services/Messaging/MessageService.js';
 * 
 * // You can now do:
 * import { ChatService, MessageService } from './Services/index.js';
 * ```
 */

// Chat Services
export { default as ChatService } from './Chat/ChatService.js';
export { default as MessageService } from './Messaging/MessageService.js';

// User Services
export { default as UserService } from './User/UserService.js';
export { default as ProfileService } from './User/ProfileService.js';
export { default as AuthenticationService } from './Authentication/AuthenticationService.js';

// Media Services
export { default as MediaService } from './Media/MediaService.js';
export { default as FileService } from './Storage/FileService.js';

// Security Services
export { default as SecurityService } from './Security/SecurityService.js';
export { default as EncryptionService } from './Security/EncryptionService.js';

// Feature Services
export { default as FeatureFlagService } from './Features/FeatureFlagService.js';
export { default as NotificationService } from './Features/NotificationService.js';
export { default as PollService } from './Features/PollService.js';

// System Services
export { default as LoggingService } from './System/LoggingService.js';
export { default as MonitoringService } from './System/MonitoringService.js';
export { default as CacheService } from './System/CacheService.js';

// Export service registry for dependency injection
export { default as ServiceRegistry } from './System/ServiceRegistry.js';

// Export base service class
export { default as BaseService } from './BaseService.js';

console.log('✅ Services index loaded');