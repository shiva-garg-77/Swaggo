import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
    notificationid: { type: String, required: true, unique: true },
    recipientid: { type: String, required: true }, // ID of user receiving notification
    senderid: { type: String, required: true }, // ID of user who triggered the notification
    type: { 
        type: String, 
        required: true,
        enum: [
            'follow_request', 
            'follow_request_accepted', 
            'follow_back_suggestion',
            'new_follower',
            'mention', 
            'comment', 
            'like',
            'post_tag',
            'story_mention',
            'message'
        ]
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    contextType: { 
        type: String, 
        enum: ['post', 'comment', 'story', 'profile', 'follow_request', 'message', 'general']
    },
    contextId: { type: String }, // ID of related post, comment, story, etc.
    actionUrl: { type: String }, // URL to navigate when notification is clicked
    metadata: { type: mongoose.Schema.Types.Mixed }, // Additional data specific to notification type
    isRead: { type: Boolean, default: false },
    isActioned: { type: Boolean, default: false }, // For actionable notifications (follow requests, etc.)
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    expiresAt: { type: Date }, // For notifications that should auto-expire
}, {
    timestamps: true
});

// Indexes for efficient querying
// Removed duplicate index on createdAt since timestamps: true already creates it
NotificationSchema.index({ recipientid: 1, isRead: 1 });
NotificationSchema.index({ recipientid: 1, type: 1 });
NotificationSchema.index({ contextType: 1, contextId: 1 });
NotificationSchema.index({ expiresAt: 1 });

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);