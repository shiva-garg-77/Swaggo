/**
 * 🔷 SWAGGO BACKEND TYPE DEFINITIONS
 * 
 * Comprehensive TypeScript type definitions for the Swaggo backend application.
 * These types provide strong typing for better code safety and developer experience.
 */

import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { Document, ObjectId } from 'mongoose';

// ===== CORE TYPES =====

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ===== USER & AUTHENTICATION TYPES =====

export interface User extends Document {
  _id: ObjectId;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  bio?: string;
  isVerified: boolean;
  isActive: boolean;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  loginCount: number;
  failedLoginAttempts: number;
  lockoutUntil?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  preferences: UserPreferences;
  securitySettings: SecuritySettings;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showOnlineStatus: boolean;
  showLastSeen: boolean;
}

export interface SecuritySettings {
  passwordLastChanged: Date;
  sessionTimeout: number;
  ipWhitelist?: string[];
  deviceTrust: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface JwtPayloadExtended extends JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  sessionId: string;
  deviceId?: string;
  ipAddress: string;
  userAgent: string;
  permissions?: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
  deviceTrust?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  agreeToTerms: boolean;
}

// ===== SESSION & SECURITY TYPES =====

export interface Session extends Document {
  _id: ObjectId;
  userId: ObjectId;
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: DeviceInfo;
  location?: LocationInfo;
  isActive: boolean;
  lastActivity: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface DeviceInfo {
  type: 'mobile' | 'desktop' | 'tablet';
  os: string;
  browser: string;
  version: string;
  fingerprint?: string;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface SecurityAuditLog extends Document {
  _id: ObjectId;
  userId?: ObjectId;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  metadata: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  resolvedBy?: ObjectId;
  resolvedAt?: Date;
}

export enum SecurityEventType {
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGIN_BLOCKED = 'LOGIN_BLOCKED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_THEFT = 'TOKEN_THEFT',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED = 'TWO_FACTOR_DISABLED',
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ===== REQUEST & RESPONSE TYPES =====

export interface AuthenticatedRequest extends Request {
  user: User;
  session: Session;
  jwt: JwtPayloadExtended;
  ipAddress: string;
  userAgent: string;
  deviceInfo: DeviceInfo;
  requestId: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ErrorResponse extends ApiResponse {
  success: false;
  error: string;
  details?: string;
  validationErrors?: ValidationError[];
  stack?: string;
}

// ===== MIDDLEWARE TYPES =====

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export interface CacheOptions {
  ttl: number;
  key?: string;
  tags?: string[];
}

export interface SecurityHeaders {
  [key: string]: string;
}

// ===== DATABASE TYPES =====

export interface DatabaseConfig {
  uri: string;
  options: {
    maxPoolSize?: number;
    serverSelectionTimeoutMS?: number;
    socketTimeoutMS?: number;
    family?: number;
    bufferMaxEntries?: number;
    useNewUrlParser?: boolean;
    useUnifiedTopology?: boolean;
  };
}

export interface QueryOptions {
  select?: string | string[];
  populate?: string | object;
  sort?: string | object;
  limit?: number;
  skip?: number;
  lean?: boolean;
}

// ===== FILE UPLOAD TYPES =====

export interface FileUploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  uploadPath: string;
  allowedExtensions: string[];
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

// ===== MONITORING & ANALYTICS TYPES =====

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  activeConnections: number;
  requestsPerSecond: number;
  errorRate: number;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  services: ServiceHealth[];
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: Date;
  details?: Record<string, any>;
}

// ===== EMAIL & NOTIFICATIONS =====

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  template?: string;
  context?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// ===== EXTERNAL INTEGRATIONS =====

export interface ExternalServiceConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  headers?: Record<string, string>;
}

export interface WebhookPayload {
  event: string;
  timestamp: Date;
  data: Record<string, any>;
  signature: string;
}

// ===== CONFIGURATION TYPES =====

export interface ApplicationConfig {
  server: {
    port: number;
    host: string;
    environment: 'development' | 'staging' | 'production';
  };
  database: DatabaseConfig;
  jwt: {
    accessTokenSecret: string;
    refreshTokenSecret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    issuer: string;
    audience: string;
  };
  security: {
    bcryptRounds: number;
    passwordPepper: string;
    csrfSecret: string;
    cookieSecret: string;
    rateLimits: Record<string, RateLimitConfig>;
    cors: {
      origins: string[];
      methods: string[];
      allowedHeaders: string[];
    };
  };
  email: EmailConfig;
  upload: FileUploadConfig;
  monitoring: {
    enabled: boolean;
    endpoint?: string;
    apiKey?: string;
  };
}

// ===== UTILITY TYPES =====

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Partial<T> = { [P in keyof T]?: T[P] };
export type Required<T> = { [P in keyof T]-?: T[P] };

export interface Dictionary<T = any> {
  [key: string]: T;
}

export type AsyncFunction<T extends any[], R> = (...args: T) => Promise<R>;
export type SyncFunction<T extends any[], R> = (...args: T) => R;

// ===== ERROR TYPES =====

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public validationErrors: ValidationError[];

  constructor(message: string, validationErrors: ValidationError[]) {
    super(message, 400, true, validationErrors);
    this.validationErrors = validationErrors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true);
  }
}

// ===== TYPE GUARDS =====

export function isUser(obj: any): obj is User {
  return obj && typeof obj === 'object' && '_id' in obj && 'username' in obj && 'email' in obj;
}

export function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  return 'user' in req && 'session' in req && 'jwt' in req;
}

export function isApiResponse(obj: any): obj is ApiResponse {
  return obj && typeof obj === 'object' && 'success' in obj && 'message' in obj;
}

export function isErrorResponse(obj: any): obj is ErrorResponse {
  return isApiResponse(obj) && obj.success === false && 'error' in obj;
}

// ===== MODULE AUGMENTATION =====

declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: Session;
      jwt?: JwtPayloadExtended;
      requestId?: string;
      ipAddress?: string;
      userAgent?: string;
      deviceInfo?: DeviceInfo;
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'staging' | 'production';
      PORT: string;
      MONGODB_URI: string;
      ACCESS_TOKEN_SECRET: string;
      REFRESH_TOKEN_SECRET: string;
      CSRF_SECRET: string;
      PASSWORD_PEPPER: string;
      COOKIE_SECRET: string;
      REQUEST_SIGNING_KEY: string;
      REDIS_PASSWORD: string;
      SMTP_USER: string;
      SMTP_PASSWORD: string;
      VAPID_PUBLIC_KEY: string;
      VAPID_PRIVATE_KEY: string;
    }
  }
}

// Note: Types and interfaces cannot be exported as default values
// They are already exported individually above and can be imported as:
// import { User, ApiResponse, etc. } from './types'

// Export classes as default
export default {
  // Export error classes that can be instantiated
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
};
