/**
 * Upload Configuration
 * Provides configuration for file upload services
 */

const uploadConfig = {
  // File size limits
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxImageSize: 10 * 1024 * 1024, // 10MB
  
  // Directory paths
  uploadDirectory: '/uploads',
  tempDirectory: '/tmp/uploads',
  
  // Allowed file types
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'audio/webm',
    'audio/ogg',
    'audio/mpeg',
    'application/pdf',
    'text/plain'
  ],
  
  // Cleanup settings
  cleanupInterval: 3600000, // 1 hour
  defaultFileExpiry: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export default uploadConfig;