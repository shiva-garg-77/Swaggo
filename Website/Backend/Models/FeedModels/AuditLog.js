import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'USER_LOGIN',
      'USER_LOGOUT',
      'USER_REGISTER',
      'PASSWORD_CHANGE',
      'PASSWORD_RESET',
      'TOKEN_REFRESH',
      'TOKEN_THEFT',
      'SESSION_STATUS_CHECK',
      'MESSAGE_SENT',
      'MESSAGE_EDITED',
      'MESSAGE_DELETED',
      'FILE_UPLOADED',
      'FILE_DOWNLOADED',
      'FILE_DELETED',
      'CHAT_CREATED',
      'CHAT_DELETED',
      'USER_ADDED_TO_CHAT',
      'USER_REMOVED_FROM_CHAT',
      'PERMISSION_CHANGED',
      'ROLE_ASSIGNED',
      'ROLE_REVOKED',
      'POLICY_VIOLATION',
      'SECURITY_ALERT',
      'SYSTEM_ERROR',
      'API_ACCESS',
      'DATA_EXPORT',
      'DATA_IMPORT',
      'BACKUP_CREATED',
      'BACKUP_RESTORED',
      'CONFIGURATION_CHANGE',
      'AUDIT_LOG_ACCESS',
      'COMPLIANCE_CHECK',
      'OTHER'
    ]
  },
  severity: {
    type: String,
    required: true,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  userId: {
    type: String, // profileid
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  resourceId: {
    type: String, // ID of the resource being accessed/modified
    index: true
  },
  resourceType: {
    type: String,
    enum: [
      'USER', 
      'MESSAGE', 
      'FILE', 
      'CHAT', 
      'DOCUMENT', 
      'POLL', 
      'SETTING', 
      'SYSTEM',
      'OTHER'
    ]
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE',
      'READ',
      'UPDATE',
      'DELETE',
      'LOGIN',
      'LOGOUT',
      'EXPORT',
      'IMPORT',
      'BACKUP',
      'RESTORE',
      'AUDIT',
      'OTHER'
    ]
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'PENDING'],
    default: 'SUCCESS'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  previousValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  sessionId: {
    type: String,
    index: true
  },
  requestId: {
    type: String,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  retentionPeriod: {
    type: Number, // Days to retain this log
    default: 90
  },
  complianceTags: [{
    type: String,
    enum: [
      'GDPR',
      'HIPAA',
      'SOX',
      'PCI_DSS',
      'ISO_27001',
      'FERPA',
      'GLBA',
      'OTHER'
    ]
  }],
  // For compliance verification
  signature: {
    type: String, // Digital signature for log integrity
    default: null
  },
  hash: {
    type: String, // Hash for log integrity
    default: null
  },
  previousHash: {
    type: String, // Hash of previous log entry for blockchain-like chain
    default: null
  }
});

// Indexes for performance and compliance queries
// Removed duplicate timestamp index since it's already defined with index: true
AuditLogSchema.index({ eventType: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ resourceId: 1, timestamp: -1 });
AuditLogSchema.index({ severity: 1, timestamp: -1 });
AuditLogSchema.index({ 'complianceTags': 1 });
AuditLogSchema.index({ sessionId: 1, timestamp: -1 });
AuditLogSchema.index({ ipAddress: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, resourceType: 1 });

// TTL index for automatic cleanup based on retention period
// Removed duplicate timestamp index since it's already defined with index: true
// The TTL index is already created with the timestamp field that has index: true

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

export default AuditLog;