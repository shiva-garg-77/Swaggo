import mongoose from "mongoose";

const ScheduledMessageSchema = new mongoose.Schema({
    scheduledMessageId: { 
        type: String, 
        required: true, 
        unique: true 
    },
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
    scheduledFor: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'cancelled'],
        default: 'pending'
    },
    retryCount: {
        type: Number,
        default: 0
    },
    maxRetries: {
        type: Number,
        default: 3
    },
    failureReason: {
        type: String
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

// Indexes for better performance
ScheduledMessageSchema.index({ chatid: 1 });
ScheduledMessageSchema.index({ senderid: 1 });
ScheduledMessageSchema.index({ status: 1 });

// Static method to get pending messages that are due
ScheduledMessageSchema.statics.getDueMessages = function() {
    return this.find({
        scheduledFor: { $lte: new Date() },
        status: 'pending'
    }).populate('chatid').populate('senderid');
};

// Static method to get scheduled messages for a user
ScheduledMessageSchema.statics.getByUser = function(userId) {
    return this.find({ senderid: userId })
        .sort({ scheduledFor: 1 });
};

// Static method to get scheduled messages for a chat
ScheduledMessageSchema.statics.getByChat = function(chatId) {
    return this.find({ chatid: chatId })
        .sort({ scheduledFor: 1 });
};

// Instance method to mark as sent
ScheduledMessageSchema.methods.markAsSent = function() {
    this.status = 'sent';
    return this.save();
};

// Instance method to mark as failed
ScheduledMessageSchema.methods.markAsFailed = function(reason) {
    this.status = 'failed';
    this.failureReason = reason;
    return this.save();
};

// Instance method to cancel
ScheduledMessageSchema.methods.cancel = function() {
    this.status = 'cancelled';
    return this.save();
};

export default mongoose.models.ScheduledMessage || mongoose.model("ScheduledMessage", ScheduledMessageSchema);