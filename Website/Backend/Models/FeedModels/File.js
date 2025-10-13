import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
    fileid: {
        type: String,
        required: true,
        unique: true
    },
    filename: {
        type: String,
        required: true
    },
    originalname: {
        type: String,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: String, // profileid
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    allowedUsers: [{
        type: String // profileids that can access this file
    }],
    fileType: {
        type: String,
        enum: ['image', 'video', 'audio', 'document'],
        required: true
    },
    scanResult: {
        type: String,
        enum: ['pending', 'clean', 'infected', 'error'],
        default: 'pending'
    },
    metadata: {
        width: Number,
        height: Number,
        duration: Number,
        hash: String, // File hash for duplicate detection
        exifStripped: {
            type: Boolean,
            default: false
        }
    },
    accessCount: {
        type: Number,
        default: 0
    },
    lastAccessedAt: {
        type: Date,
        default: null
    },
    expiresAt: {
        type: Date,
        default: null
    },
    tags: [String],
    isArchived: {
        type: Boolean,
        default: false
    },
    cloudProvider: {
        type: String,
        enum: ['local', 'google', 'dropbox', 'onedrive'],
        default: 'local'
    },
    cloudFileId: {
        type: String
    },
    compressionApplied: {
        type: Boolean,
        default: false
    },
    originalSize: Number,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for performance
FileSchema.index({ uploadedBy: 1, createdAt: -1 });
FileSchema.index({ filename: 1 });
FileSchema.index({ mimetype: 1 });
FileSchema.index({ fileType: 1 });
FileSchema.index({ isPublic: 1 });
FileSchema.index({ expiresAt: 1 });
FileSchema.index({ scanResult: 1 });
FileSchema.index({ 'metadata.hash': 1 });
FileSchema.index({ cloudProvider: 1 });
FileSchema.index({ cloudFileId: 1 });

// Compound indexes
FileSchema.index({ uploadedBy: 1, isPublic: 1 });
FileSchema.index({ uploadedBy: 1, fileType: 1 });
FileSchema.index({ uploadedBy: 1, cloudProvider: 1 });

// Update timestamp on save
FileSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Virtual for file URL
FileSchema.virtual('url').get(function() {
    return `/uploads/${this.filename}`;
});

// Method to check if user can access this file
FileSchema.methods.canUserAccess = function(userId) {
    // File owner can always access
    if (this.uploadedBy === userId) {
        return true;
    }
    
    // Public files can be accessed by anyone
    if (this.isPublic) {
        return true;
    }
    
    // Check if user is in allowed users list
    return this.allowedUsers.includes(userId);
};

// Method to increment access count
FileSchema.methods.incrementAccess = function() {
    this.accessCount += 1;
    this.lastAccessedAt = new Date();
    return this.save();
};

// Static method to get user's files
FileSchema.statics.getUserFiles = function(userId, options = {}) {
    const query = { uploadedBy: userId, isArchived: false };
    
    if (options.fileType) {
        query.fileType = options.fileType;
    }
    
    if (options.mimetype) {
        query.mimetype = new RegExp(options.mimetype, 'i');
    }
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 50)
        .skip(options.offset || 0);
};

// Static method to clean up expired files
FileSchema.statics.cleanupExpired = function() {
    return this.find({
        expiresAt: { $lte: new Date() },
        isArchived: false
    });
};

const File = mongoose.model('File', FileSchema);

export default File;