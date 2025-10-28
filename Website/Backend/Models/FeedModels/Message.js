import mongoose from "mongoose";
import XSSSanitizer from '../../Utils/XSSSanitizer.js';

/**
 * Message types supported by the application
 * @enum {string}
 */
const MESSAGE_TYPES = [
  'text', 
  'image', 
  'video', 
  'audio', 
  'file', 
  'document', 
  'voice', 
  'system', 
  'sticker', 
  'gif', 
  'location', 
  'contact', 
  'poll'
];

/**
 * Attachment types supported by the application
 * @enum {string}
 */
const ATTACHMENT_TYPES = [
  'image', 
  'video', 
  'audio', 
  'file'
];

/**
 * Message status types
 * @enum {string}
 */
const MESSAGE_STATUS_TYPES = [
  'sending', 
  'sent', 
  'delivered', 
  'read', 
  'failed'
];

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
    messageType: { 
        type: String, 
        enum: MESSAGE_TYPES, 
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
            enum: ATTACHMENT_TYPES
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
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: Date,
    messageStatus: {
        type: String,
        enum: MESSAGE_STATUS_TYPES,
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
    threadId: {
        type: String,
        ref: 'MessageThread'
    }, // Thread ID for this message
    forwardedFrom: {
        type: String,
        ref: 'Message'
    }, // For message forwarding
    
    // Encryption support for end-to-end encryption
    isEncrypted: {
        type: Boolean,
        default: false
    },
    encryptionKey: {
        type: String,
        default: null
    },
    encryptedContent: {
        type: String,
        default: null
    },
    
    // Markdown support
    hasMarkdown: {
        type: Boolean,
        default: false
    },
    parsedContent: {
        type: String,
        default: null
    },
    
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
        fileId: String, // Reference to File document
        url: String // File URL
    },
    
    fileData: {
        fileId: String, // Reference to File document
        name: String,
        size: Number, // in bytes
        mimeType: String,
        url: String // File URL
    },
    
    // Link preview data for URLs in messages
    linkPreviews: [{
        url: String,
        title: String,
        description: String,
        image: String,
        siteName: String
    }]
}, {
    timestamps: true
});

// Pre-save middleware to sanitize message content and prevent XSS attacks
MessageSchema.pre('save', function(next) {
  // Sanitize text content
  if (this.content && typeof this.content === 'string') {
    if (this.messageType === 'system') {
      this.content = XSSSanitizer.sanitizeSystemMessage(this.content);
    } else {
      this.content = XSSSanitizer.sanitizeMessageContent(this.content);
    }
  }
  
  // Sanitize media metadata
  if (this.stickerData && this.stickerData.name) {
    this.stickerData.name = XSSSanitizer.sanitizeMediaMetadata(this.stickerData.name);
  }
  
  if (this.gifData && this.gifData.title) {
    this.gifData.title = XSSSanitizer.sanitizeMediaMetadata(this.gifData.title);
  }
  
  if (this.fileData && this.fileData.name) {
    this.fileData.name = XSSSanitizer.sanitizeMediaMetadata(this.fileData.name);
  }
  
  // Sanitize mentions
  if (Array.isArray(this.mentions)) {
    this.mentions = this.mentions.map(mention => 
      typeof mention === 'string' ? XSSSanitizer.sanitizeText(mention) : mention
    );
  }
  
  next();
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
// Add indexes for better query performance
MessageSchema.index({ 'deliveredTo.profileid': 1 }); // For delivery tracking queries
MessageSchema.index({ chatid: 1, createdAt: -1, isDeleted: 1 }); // For chat message queries with deletion filter
MessageSchema.index({ senderid: 1, createdAt: -1 }); // For user message history

// 🔧 NEW: Additional indexes for critical queries
MessageSchema.index({ 'readBy.profileid': 1, isDeleted: 1 }); // For read status queries
MessageSchema.index({ 'reactions.profileid': 1 }); // For reaction queries
MessageSchema.index({ messageType: 1, createdAt: -1 }); // For message type filtering
MessageSchema.index({ createdAt: -1 }); // For general time-based queries
// 🔧 OPTIMIZATION #76: Add optimized compound indexes (removing duplicates)
MessageSchema.index({ 'chatid': 1, 'isDeleted': 1, 'createdAt': -1 }); // Optimized for chat message queries (covers isDeleted+createdAt and chatid+isDeleted)
MessageSchema.index({ 'senderid': 1, 'isDeleted': 1, 'createdAt': -1 }); // Optimized for user message queries (covers senderid+isDeleted)
MessageSchema.index({ 'replyTo': 1, 'isDeleted': 1 }); // Optimized for thread queries
MessageSchema.index({ 'readBy.profileid': 1, 'chatid': 1 }); // Optimized for read status queries by chat
MessageSchema.index({ 'reactions.profileid': 1, 'createdAt': -1 }); // Optimized for reaction queries
MessageSchema.index({ 'mentions': 1, 'isDeleted': 1 }); // Optimized for mention queries
MessageSchema.index({ 'messageType': 1, 'isDeleted': 1, 'createdAt': -1 }); // Optimized for message type filtering

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
    // Check if user already reacted with this emoji
    const existingReactionIndex = this.reactions.findIndex(
        reaction => reaction.profileid === profileId && reaction.emoji === emoji
    );
    
    if (existingReactionIndex > -1) {
        // Remove existing reaction (toggle off)
        this.reactions.splice(existingReactionIndex, 1);
    } else {
        // Add new reaction (allow multiple reactions per user)
        this.reactions.push({ profileid: profileId, emoji, createdAt: new Date() });
    }
    return this.save();
};

MessageSchema.methods.removeReaction = function(profileId, emoji) {
    // Remove specific reaction
    this.reactions = this.reactions.filter(
        reaction => !(reaction.profileid === profileId && reaction.emoji === emoji)
    );
    return this.save();
};

// Add a method to check if a message is a thread starter
MessageSchema.methods.isThreadStarter = function() {
    // A message is a thread starter if it has replies but no parent thread
    return this.threadReplies && this.threadReplies.length > 0 && !this.replyTo;
};

// Add a method to get thread replies count
MessageSchema.methods.getThreadRepliesCount = function() {
    return this.threadReplies ? this.threadReplies.length : 0;
};

// Add a static method to create a threaded reply
MessageSchema.statics.createThreadedReply = async function(parentMessageId, replyData) {
    // Find the parent message
    const parentMessage = await this.findById(parentMessageId);
    if (!parentMessage) {
        throw new Error('Parent message not found');
    }
    
    // Create the reply message
    const replyMessage = new this(replyData);
    await replyMessage.save();
    
    // Add reply to parent's threadReplies
    parentMessage.threadReplies.push(replyMessage._id);
    await parentMessage.save();
    
    // If parent doesn't have a threadId, create a new thread
    if (!parentMessage.threadId) {
        const MessageThread = require('./MessageThread');
        const thread = await MessageThread.createThread(parentMessage._id, parentMessage.chatid);
        parentMessage.threadId = thread.threadId;
        replyMessage.threadId = thread.threadId;
        await parentMessage.save();
        await replyMessage.save();
    } else {
        // Use existing threadId for the reply
        replyMessage.threadId = parentMessage.threadId;
        await replyMessage.save();
    }
    
    return replyMessage;
};



/**
 * Default limit for thread messages
 * @type {number}
 */
const DEFAULT_THREAD_MESSAGE_LIMIT = 50;

// Add a static method to get all messages in a thread
MessageSchema.statics.getThreadMessages = async function(threadId, limit = DEFAULT_THREAD_MESSAGE_LIMIT) {
    return await this.find({ threadId: threadId, isDeleted: false })
        .populate('senderid', 'username profilePic')
        .populate('replyTo')
        .populate('reactions.profileid', 'username')
        .sort({ createdAt: 1 }) // Chronological order for threads
        .limit(limit);
};

// Add a static method to get thread starter message with all replies
MessageSchema.statics.getThreadWithReplies = async function(messageId) {
    // Find the thread starter (could be the message itself or its parent)
    let threadStarter = await this.findById(messageId);
    
    // If this message is a reply, find its parent
    if (threadStarter.replyTo) {
        threadStarter = await this.findById(threadStarter.replyTo);
    }
    
    if (!threadStarter) {
        throw new Error('Thread not found');
    }
    
    // Get all replies in the thread
    const replies = await this.find({ 
        threadId: threadStarter.threadId, 
        _id: { $ne: threadStarter._id },
        isDeleted: false 
    })
    .populate('senderid', 'username profilePic')
    .populate('reactions.profileid', 'username')
    .sort({ createdAt: 1 });
    
    return {
        threadStarter,
        replies
    };
};

// Static Methods
MessageSchema.statics.findByClientMessageId = function(clientMessageId) {
    return this.findOne({ clientMessageId, isDeleted: false });
};

/**
 * Default limit for chat messages
 * @type {number}
 */
const DEFAULT_CHAT_MESSAGE_LIMIT = 50;

MessageSchema.statics.getChatMessages = function(chatId, limit = DEFAULT_CHAT_MESSAGE_LIMIT, before = null) {
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

// 🔧 MODEL RELATIONSHIPS #117: Add virtual populate fields for easier relationship access
// Virtual populate for sender profile
MessageSchema.virtual('sender', {
  ref: 'Profile',
  localField: 'senderid',
  foreignField: 'profileid',
  justOne: true
});

// Virtual populate for chat
MessageSchema.virtual('chat', {
  ref: 'Chat',
  localField: 'chatid',
  foreignField: 'chatid',
  justOne: true
});

// Virtual populate for replyTo message
MessageSchema.virtual('replyMessage', {
  ref: 'Message',
  localField: 'replyTo',
  foreignField: 'messageid',
  justOne: true
});

// Virtual populate for forwardedFrom message
MessageSchema.virtual('forwardedMessage', {
  ref: 'Message',
  localField: 'forwardedFrom',
  foreignField: 'messageid',
  justOne: true
});

// Virtual populate for thread replies
MessageSchema.virtual('threadRepliesMessages', {
  ref: 'Message',
  localField: 'threadReplies',
  foreignField: 'messageid'
});

// Virtual populate for mentions
MessageSchema.virtual('mentionedProfiles', {
  ref: 'Profile',
  localField: 'mentions',
  foreignField: 'profileid'
});

// Virtual populate for reactions
MessageSchema.virtual('reactionProfiles', {
  ref: 'Profile',
  localField: 'reactions.profileid',
  foreignField: 'profileid'
});

// Virtual populate for readBy profiles
MessageSchema.virtual('readByProfiles', {
  ref: 'Profile',
  localField: 'readBy.profileid',
  foreignField: 'profileid'
});

// Virtual populate for deliveredTo profiles
MessageSchema.virtual('deliveredToProfiles', {
  ref: 'Profile',
  localField: 'deliveredTo.profileid',
  foreignField: 'profileid'
});

// Virtual populate for pinnedBy profile
MessageSchema.virtual('pinnedByProfile', {
  ref: 'Profile',
  localField: 'pinnedBy',
  foreignField: 'profileid',
  justOne: true
});

// Virtual populate for deletedBy profile
MessageSchema.virtual('deletedByProfile', {
  ref: 'Profile',
  localField: 'deletedBy',
  foreignField: 'profileid',
  justOne: true
});

// Ensure virtual fields are serialized
MessageSchema.set('toJSON', { virtuals: true });
MessageSchema.set('toObject', { virtuals: true });


