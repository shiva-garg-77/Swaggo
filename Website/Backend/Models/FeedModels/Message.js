import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    messageid: { type: String, required: true, unique: true },
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
        enum: ['text', 'image', 'video', 'audio', 'file', 'system'], 
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
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    }
}, {
    timestamps: true
});

// Indexes for better performance
MessageSchema.index({ chatid: 1, createdAt: -1 });
MessageSchema.index({ senderid: 1 });
// messageid index is automatically created due to unique: true
MessageSchema.index({ replyTo: 1 });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
