import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const StoriesSchema = new mongoose.Schema({
    storyid: { 
        type: String, 
        required: true, 
        default: uuidv4 
    },
    profileid: { 
        type: String, 
        required: true 
    },
    mediaUrl: { 
        type: String, 
        required: true 
    },
    mediaType: { 
        type: String, 
        required: true,
        enum: ['image', 'video']
    },
    caption: {
        type: String,
        maxlength: 500
    },
    viewers: [{
        profileid: String,
        viewedAt: { type: Date, default: Date.now }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
        }
    }
}, {
    timestamps: true
});

// Auto-delete expired stories
StoriesSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Stories || mongoose.model("Stories", StoriesSchema);
