import mongoose from "mongoose";

const UserSettingsSchema = new mongoose.Schema({
    profileid: { type: String, required: true, unique: true },
    // Mention & Tag Settings
    allowMentions: { type: Boolean, default: true },
    mentionNotifications: { type: Boolean, default: true },
    tagNotifications: { type: Boolean, default: true },
    showTaggedPosts: { type: Boolean, default: true },
    // Privacy Settings
    isPrivate: { type: Boolean, default: false },
    allowMessages: { 
        type: String, 
        enum: ['everyone', 'followers', 'close_friends', 'no_one'], 
        default: 'everyone' 
    },
    showActivity: { type: Boolean, default: true },
    // Other preferences
    twoFactor: { type: Boolean, default: false },
    notificationsEnabled: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false }
}, {
    timestamps: true
});

export default mongoose.models.UserSettings || mongoose.model("UserSettings", UserSettingsSchema);
