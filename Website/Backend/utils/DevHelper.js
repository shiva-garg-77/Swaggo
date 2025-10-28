/**
 * Development Helper - Makes development easier with relaxed security
 * This file contains utilities to bypass strict security measures during development
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export const isDevelopment = () => {
    return process.env.NODE_ENV !== 'production';
};

export const shouldBypassRateLimit = () => {
    return isDevelopment() && process.env.DEV_BYPASS_RATE_LIMITS === 'true';
};

export const shouldRelaxPassword = () => {
    return isDevelopment() && process.env.DEV_RELAXED_PASSWORD === 'true';
};

// Development middleware to bypass rate limiting
export const devBypassMiddleware = (req, res, next) => {
    if (shouldBypassRateLimit()) {
        // Add bypass flag to request
        req.devBypass = true;
    }
    next();
};

// Create a development user quickly
export const createDevUser = {
    email: 'dev@swaggo.local',
    username: 'devuser',
    password: 'dev123', // Simple password for development
    dateOfBirth: '1990-01-01'
};

// Development login credentials
export const devCredentials = {
    username: 'devuser',
    password: 'dev123'
};

console.log('🔧 Development Helper Loaded');
console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`⚡ Rate limit bypass: ${shouldBypassRateLimit() ? 'ENABLED' : 'DISABLED'}`);
console.log(`🔒 Relaxed passwords: ${shouldRelaxPassword() ? 'ENABLED' : 'DISABLED'}`);