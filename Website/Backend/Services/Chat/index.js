/**
 * @fileoverview Chat Services index - Re-exports all chat-related services
 * @module ChatServices
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * This file provides a centralized export point for all chat-related services.
 */

export { default as ChatService } from './ChatService.js';
export { default as ChatRepository } from './ChatRepository.js';

console.log('✅ Chat services index loaded');