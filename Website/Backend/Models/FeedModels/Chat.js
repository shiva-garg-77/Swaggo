import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema({
    chatid: { type: String, required: true, unique: true },
    participants: [{ 
        type: String, 
        required: true,
        ref: 'Profile'
    }], // Array of profile IDs
    chatType: { 
        type: String, 
        enum: ['direct', 'group'], 
        default: 'direct' 
    },
    chatName: { 
        type: String,
        default: function() {
            return this.chatType === 'group' ? 'New Group' : null;
        }
    },
    chatAvatar: { 
        type: String,
        default: null
    },
    lastMessage: {
        type: String,
        ref: 'Message'
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    mutedBy: [{ 
        type: String,
        ref: 'Profile'
    }], // Array of profile IDs who muted this chat
    adminIds: [{ 
        type: String,
        ref: 'Profile'
    }], // For group chats
    createdBy: {
        type: String,
        ref: 'Profile',
        required: true
    }
}, {
    timestamps: true
});

// Index for faster lookups
ChatSchema.index({ participants: 1 });
ChatSchema.index({ lastMessageAt: -1 });
// chatid index is automatically created due to unique: true

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
