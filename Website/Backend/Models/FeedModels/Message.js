import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    messageid: { type: String, required: true, unique: true },
    clientMessageId: { 
        type: String
    }, // For message deduplication and optimistic UI updates
    chatid: { 
        type: String, 
        required: true,
        ref: 'Chat'
    },
    senderid: { 
        type: String, 
        required: true,
        ref: 'Profile'
    },
    receiverId: { 
        type: String, 
        required: false,
        ref: 'Profile'
    },
    messageType: { 
        type: String, 
        enum: ['text', 'image', 'video', 'audio', 'file', 'document', 'voice', 'system', 'sticker', 'gif', 'location', 'contact', 'poll'], 
        default: 'text' 
    },
    content: {
        type: String,
        required: function() {
            return this.messageType === 'text' || this.messageType === 'system';
        }
    },
    attachments: [{
        type: {
            type: String,
            enum: ['image', 'video', 'audio', 'file']
        },
        url: String,
        filename: String,
        size: Number,
        mimetype: String
    }],
    replyTo: {
        type: String,
        ref: 'Message',
        default: null
    },
    mentions: [{ 
        type: String,
        ref: 'Profile'
    }], // Array of mentioned profile IDs
    reactions: [{
        profileid: {
            type: String,
            ref: 'Profile'
        },
        emoji: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    readBy: [{
        profileid: {
            type: String,
            ref: 'Profile'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    editHistory: [{
        content: String,
        editedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedBy: {
        type: String,
        ref: 'Profile'
    },
    deletedAt: Date,
    messageStatus: {
        type: String,
        enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
        default: 'sent'
    },
    deliveredTo: [{
        profileid: {
            type: String,
            ref: 'Profile'
        },
        deliveredAt: {
            type: Date,
            default: Date.now
        }
    }], // Track delivery to each participant
    isPinned: {
        type: Boolean,
        default: false
    },
    pinnedBy: {
        type: String,
        ref: 'Profile'
    },
    pinnedAt: Date,
    threadReplies: [{
        type: String,
        ref: 'Message'
    }], // For threading support
    forwardedFrom: {
        type: String,
        ref: 'Message'
    }, // For message forwarding
    
    // Media data fields for different message types
    stickerData: {
        id: String,
        name: String,
        preview: String,
        url: String,
        category: String
    },
    
    gifData: {
        id: String,
        title: String,
        url: String,
        thumbnail: String,
        category: String,
        dimensions: {
            width: Number,
            height: Number
        }
    },
    
    voiceData: {
        duration: Number, // in seconds
        size: Number, // in bytes
        mimeType: String,
        url: String, // Data URL or file URL
        audioData: {
            base64: String,
            stored: { type: Boolean, default: false },
            filePath: String
        }
    },
    
    fileData: {
        name: String,
        size: Number, // in bytes
        mimeType: String,
        url: String, // Data URL or file URL
        fileContent: {
            base64: String,
            stored: { type: Boolean, default: false },
            filePath: String
        }
    }
}, {
    timestamps: true
});

// Indexes for better performance
MessageSchema.index({ chatid: 1, createdAt: -1 }); // Primary query pattern
MessageSchema.index({ senderid: 1 });
MessageSchema.index({ clientMessageId: 1 }); // For deduplication
MessageSchema.index({ clientMessageId: 1, chatid: 1 }, { unique: true, sparse: true }); // Compound unique index for strict deduplication
MessageSchema.index({ replyTo: 1 }); // For threading
MessageSchema.index({ messageStatus: 1 }); // For status queries
MessageSchema.index({ isPinned: 1, chatid: 1 }); // For pinned messages
MessageSchema.index({ 'mentions': 1 }); // For mention queries

// Instance Methods
MessageSchema.methods.markAsRead = function(profileId) {
    const existingRead = this.readBy.find(r => r.profileid === profileId);
    if (!existingRead) {
        this.readBy.push({ profileid: profileId, readAt: new Date() });
        this.messageStatus = 'read';
    }
    return this.save();
};

MessageSchema.methods.markAsDelivered = function(profileId) {
    const existingDelivery = this.deliveredTo.find(d => d.profileid === profileId);
    if (!existingDelivery) {
        this.deliveredTo.push({ profileid: profileId, deliveredAt: new Date() });
        if (this.messageStatus === 'sent') {
            this.messageStatus = 'delivered';
        }
    }
    return this.save();
};

MessageSchema.methods.addReaction = function(profileId, emoji) {
    // Remove existing reaction from this user
    this.reactions = this.reactions.filter(r => r.profileid !== profileId);
    // Add new reaction
    this.reactions.push({ profileid: profileId, emoji, createdAt: new Date() });
    return this.save();
};

MessageSchema.methods.removeReaction = function(profileId) {
    this.reactions = this.reactions.filter(r => r.profileid !== profileId);
    return this.save();
};

// Static Methods
MessageSchema.statics.findByClientMessageId = function(clientMessageId) {
    return this.findOne({ clientMessageId, isDeleted: false });
};

MessageSchema.statics.getChatMessages = function(chatId, limit = 50, before = null) {
    const query = { chatid: chatId, isDeleted: false };
    if (before) {
        query.createdAt = { $lt: before };
    }
    return this.find(query)
        .populate('senderid', 'username profilePic')
        .populate('replyTo')
        .populate('reactions.profileid', 'username')
        .sort({ createdAt: -1 })
        .limit(limit);
};

MessageSchema.statics.getUnreadCount = function(chatId, profileId, lastReadAt) {
    return this.countDocuments({
        chatid: chatId,
        senderid: { $ne: profileId },
        createdAt: { $gt: lastReadAt },
        isDeleted: false
    });
};

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
