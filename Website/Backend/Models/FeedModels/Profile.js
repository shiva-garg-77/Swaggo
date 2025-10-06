import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
    profileid: { type: String, required: true },
    username: { 
        type: String, 
        required: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, hyphens, and underscores']
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
    },
    
    // User Profile Information
    name: {
        type: String,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    profilePic: {
        type: String,
        default: 'https://www.tenforums.com/attachments/user-accounts-family-safety/322690d1615743307t-user-account-image-log-user.png',
        validate: {
            validator: function(v) {
                return !v || /^https?:\/\/.+/.test(v);
            },
            message: 'Profile picture must be a valid URL'
        }
    },
    
    // Privacy and Verification
    isPrivate: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    
    // CRITICAL SECURITY FIELDS
    isActive: { type: Boolean, default: true, required: true },
    accountStatus: {
        type: String,
        enum: ['active', 'suspended', 'banned', 'pending', 'deactivated'],
        default: 'active',
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'moderator', 'admin', 'super_admin'],
        default: 'user',
        required: true
    },
    permissions: {
        canSendMessages: { type: Boolean, default: true },
        canCreateChats: { type: Boolean, default: true },
        canUploadFiles: { type: Boolean, default: true },
        canMakeVideoCalls: { type: Boolean, default: true },
        canMakeVoiceCalls: { type: Boolean, default: true },
        maxFileSize: { type: Number, default: 10 * 1024 * 1024 }, // 10MB
        maxChatsPerDay: { type: Number, default: 50 },
        maxMessagesPerMinute: { type: Number, default: 30 }
    },
    
    // Authentication and Security
    lastLoginAt: { type: Date },
    lastSocketConnection: { type: Date },
    socketConnections: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockedUntil: { type: Date },
    passwordChangedAt: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    
    // Security Tracking
    ipAddresses: [{
        ip: String,
        lastUsed: { type: Date, default: Date.now },
        userAgent: String,
        location: String
    }],
    
    // Activity Tracking
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    
    // Profile Stats
    stats: {
        totalMessages: { type: Number, default: 0 },
        totalCalls: { type: Number, default: 0 },
        totalChats: { type: Number, default: 0 },
        joinedAt: { type: Date, default: Date.now }
    },
    
    // Settings
    settings: {
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            sound: { type: Boolean, default: true }
        },
        privacy: {
            showLastSeen: { type: Boolean, default: true },
            showOnlineStatus: { type: Boolean, default: true },
            allowDirectMessages: { type: Boolean, default: true },
            readReceipts: { type: Boolean, default: true }
        },
        theme: {
            mode: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
            accentColor: { type: String, default: '#0066cc' }
        }
    }
}, {
    timestamps: true
});

// Indexes for performance and security
ProfileSchema.index({ email: 1 }, { unique: true });
ProfileSchema.index({ username: 1 }, { unique: true });
ProfileSchema.index({ profileid: 1 }, { unique: true });
ProfileSchema.index({ isActive: 1, accountStatus: 1 });
ProfileSchema.index({ lastActivity: -1 });
ProfileSchema.index({ 'ipAddresses.ip': 1 });
ProfileSchema.index({ role: 1 });

// Instance methods for security
ProfileSchema.methods.isAccountLocked = function() {
    return this.accountLockedUntil && this.accountLockedUntil > Date.now();
};

ProfileSchema.methods.lockAccount = function() {
    this.accountLockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    this.failedLoginAttempts = 0;
    return this.save();
};

ProfileSchema.methods.unlockAccount = function() {
    this.accountLockedUntil = undefined;
    this.failedLoginAttempts = 0;
    return this.save();
};

ProfileSchema.methods.incrementFailedAttempts = function() {
    this.failedLoginAttempts += 1;
    if (this.failedLoginAttempts >= 5) {
        this.lockAccount();
    }
    return this.save();
};

ProfileSchema.methods.resetFailedAttempts = function() {
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = undefined;
    return this.save();
};

ProfileSchema.methods.hasPermission = function(permission) {
    if (this.role === 'super_admin' || this.role === 'admin') {
        return true;
    }
    return this.permissions && this.permissions[permission] === true;
};

ProfileSchema.methods.canPerformAction = function(action, limit) {
    if (!this.isActive || this.accountStatus !== 'active') {
        return false;
    }
    
    if (this.isAccountLocked()) {
        return false;
    }
    
    // Check rate limits based on action
    return this.hasPermission(action);
};

ProfileSchema.methods.updateActivity = function() {
    this.lastActivity = new Date();
    this.lastSeen = new Date();
    return this.save();
};

ProfileSchema.methods.addIPAddress = function(ip, userAgent, location) {
    const existingIP = this.ipAddresses.find(addr => addr.ip === ip);
    if (existingIP) {
        existingIP.lastUsed = new Date();
        existingIP.userAgent = userAgent;
        existingIP.location = location;
    } else {
        this.ipAddresses.push({
            ip,
            userAgent,
            location,
            lastUsed: new Date()
        });
        
        // Keep only last 10 IP addresses
        if (this.ipAddresses.length > 10) {
            this.ipAddresses = this.ipAddresses.slice(-10);
        }
    }
    return this.save();
};

// Static methods
ProfileSchema.statics.findActive = function(query = {}) {
    return this.find({
        ...query,
        isActive: true,
        accountStatus: 'active'
    });
};

ProfileSchema.statics.findByEmailOrUsername = function(identifier) {
    return this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { username: identifier }
        ],
        isActive: true
    });
};

const Profile = mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);
export default Profile;
