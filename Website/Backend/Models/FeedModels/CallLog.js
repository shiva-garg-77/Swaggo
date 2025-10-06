import mongoose from "mongoose";

const CallLogSchema = new mongoose.Schema({
    callId: { 
        type: String, 
        required: true, 
        unique: true,
        index: true
    },
    chatid: { 
        type: String, 
        required: true,
        ref: 'Chat',
        index: true
    },
    callerId: { 
        type: String, 
        required: true,
        ref: 'Profile'
    },
    receiverId: {
        type: String,
        ref: 'Profile'
    },
    participants: [{ 
        type: String, 
        ref: 'Profile' 
    }], // For group calls
    callType: { 
        type: String, 
        enum: ['voice', 'video'], 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['initiated', 'ringing', 'answered', 'missed', 'declined', 'completed', 'failed', 'no_answer', 'busy'],
        default: 'initiated',
        index: true
    },
    duration: { 
        type: Number, 
        default: 0 // in seconds
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    answeredAt: Date,
    endedAt: Date,
    endedBy: { 
        type: String, 
        ref: 'Profile' 
    },
    endReason: {
        type: String,
        enum: ['normal', 'timeout', 'network_error', 'user_busy', 'declined', 'failed'],
        default: 'normal'
    },
    // Call quality metrics
    quality: {
        overall: {
            type: String,
            enum: ['excellent', 'good', 'fair', 'poor', 'unknown'],
            default: 'unknown'
        },
        audio: {
            type: String,
            enum: ['excellent', 'good', 'fair', 'poor', 'unknown'],
            default: 'unknown'
        },
        video: {
            type: String,
            enum: ['excellent', 'good', 'fair', 'poor', 'unknown'],
            default: 'unknown'
        },
        connection: {
            type: String,
            enum: ['stable', 'unstable', 'poor'],
            default: 'stable'
        }
    },
    // Technical details
    techDetails: {
        iceConnectionState: String,
        connectionState: String,
        signalingState: String,
        bandwidth: {
            upload: Number,
            download: Number
        },
        codec: {
            audio: String,
            video: String
        },
        resolution: {
            width: Number,
            height: Number
        },
        frameRate: Number,
        jitter: Number, // network jitter
        packetLoss: Number, // packet loss percentage
        latency: Number // round-trip time in ms
    },
    // Recording info (future feature)
    isRecorded: {
        type: Boolean,
        default: false
    },
    recordingUrl: String,
    recordingDuration: Number,
    // Screen sharing info
    hadScreenShare: {
        type: Boolean,
        default: false
    },
    screenShareDuration: Number,
    screenSharedBy: [String], // profileIds
    // Participants who joined/left during call
    participantEvents: [{
        profileid: String,
        action: {
            type: String,
            enum: ['joined', 'left', 'muted', 'unmuted', 'video_on', 'video_off', 'screen_share_start', 'screen_share_stop']
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    // Call retry attempts (for failed calls)
    retryAttempts: {
        type: Number,
        default: 0
    },
    lastRetryAt: Date,
    // Offline call attempt (when receiver is offline)
    isOfflineAttempt: {
        type: Boolean,
        default: false
    },
    offlineNotificationSent: {
        type: Boolean,
        default: false
    },
    // Call statistics
    stats: {
        audioPacketsSent: Number,
        audioPacketsReceived: Number,
        videoPacketsSent: Number,
        videoPacketsReceived: Number,
        bytesReceived: Number,
        bytesSent: Number,
        audioLevel: Number, // average audio level during call
        connectionTime: Number, // time to establish connection in ms
    },
    // Device and browser info
    deviceInfo: {
        caller: {
            userAgent: String,
            browser: String,
            browserVersion: String,
            os: String,
            deviceType: String // mobile, desktop, tablet
        },
        receiver: {
            userAgent: String,
            browser: String,
            browserVersion: String,
            os: String,
            deviceType: String
        }
    },
    // Notification status
    notificationStatus: {
        sent: {
            type: Boolean,
            default: false
        },
        delivered: {
            type: Boolean,
            default: false
        },
        read: {
            type: Boolean,
            default: false
        },
        sentAt: Date,
        deliveredAt: Date,
        readAt: Date
    }
}, {
    timestamps: true
});

// Indexes for better performance
CallLogSchema.index({ chatid: 1, createdAt: -1 });
CallLogSchema.index({ callerId: 1, createdAt: -1 });
CallLogSchema.index({ receiverId: 1, createdAt: -1 });
CallLogSchema.index({ status: 1, createdAt: -1 });
CallLogSchema.index({ participants: 1, createdAt: -1 });

// Virtual for formatted duration
CallLogSchema.virtual('formattedDuration').get(function() {
    if (!this.duration) return '00:00';
    
    const minutes = Math.floor(this.duration / 60);
    const seconds = this.duration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for call outcome
CallLogSchema.virtual('outcome').get(function() {
    switch(this.status) {
        case 'completed':
            return 'successful';
        case 'missed':
        case 'no_answer':
            return 'missed';
        case 'declined':
            return 'declined';
        case 'failed':
            return 'failed';
        default:
            return 'ongoing';
    }
});

// Method to calculate actual call duration
CallLogSchema.methods.calculateDuration = function() {
    if (this.answeredAt && this.endedAt) {
        this.duration = Math.floor((this.endedAt - this.answeredAt) / 1000);
    }
    return this.duration;
};

// Method to update call status
CallLogSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
    this.status = newStatus;
    
    const now = new Date();
    
    switch(newStatus) {
        case 'answered':
            this.answeredAt = now;
            break;
        case 'completed':
        case 'missed':
        case 'declined':
        case 'failed':
            if (!this.endedAt) {
                this.endedAt = now;
                this.calculateDuration();
            }
            break;
    }
    
    // Apply any additional data
    Object.assign(this, additionalData);
    
    return this.save();
};

// Static method to get call statistics for a user
CallLogSchema.statics.getUserCallStats = async function(profileId, timeRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);
    
    const stats = await this.aggregate([
        {
            $match: {
                $or: [
                    { callerId: profileId },
                    { receiverId: profileId },
                    { participants: profileId }
                ],
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                totalCalls: { $sum: 1 },
                voiceCalls: {
                    $sum: { $cond: [{ $eq: ['$callType', 'voice'] }, 1, 0] }
                },
                videoCalls: {
                    $sum: { $cond: [{ $eq: ['$callType', 'video'] }, 1, 0] }
                },
                completedCalls: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                missedCalls: {
                    $sum: { $cond: [{ $in: ['$status', ['missed', 'no_answer']] }, 1, 0] }
                },
                totalDuration: { $sum: '$duration' },
                averageDuration: { $avg: '$duration' }
            }
        }
    ]);
    
    return stats[0] || {
        totalCalls: 0,
        voiceCalls: 0,
        videoCalls: 0,
        completedCalls: 0,
        missedCalls: 0,
        totalDuration: 0,
        averageDuration: 0
    };
};

// Static method to get recent calls for a user
CallLogSchema.statics.getRecentCalls = async function(profileId, limit = 50) {
    return await this.find({
        $or: [
            { callerId: profileId },
            { receiverId: profileId },
            { participants: profileId }
        ]
    })
    .populate('callerId', 'username profilePic')
    .populate('receiverId', 'username profilePic')
    .populate('participants', 'username profilePic')
    .populate('chatid', 'chatName chatType chatAvatar')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Pre-save middleware to set default values
CallLogSchema.pre('save', function(next) {
    if (this.isNew) {
        // Set receiverId for direct calls
        if (!this.receiverId && this.participants && this.participants.length === 2) {
            this.receiverId = this.participants.find(p => p !== this.callerId);
        }
        
        // Set default participants if not set
        if (!this.participants || this.participants.length === 0) {
            this.participants = [this.callerId];
            if (this.receiverId) {
                this.participants.push(this.receiverId);
            }
        }
    }
    
    next();
});

export default mongoose.models.CallLog || mongoose.model("CallLog", CallLogSchema);