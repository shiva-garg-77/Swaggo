import mongoose from "mongoose";

const StoryViewerSchema = new mongoose.Schema({
    profileid: {
        type: String,
        required: true,
        ref: 'Profile'
    },
    viewedAt: {
        type: Date,
        default: Date.now
    }
});

const StorySchema = new mongoose.Schema({
    storyid: { 
        type: String, 
        required: true, 
        unique: true 
    },
    profileid: { 
        type: String, 
        required: true,
        ref: 'Profile'
    },
    mediaUrl: { 
        type: String, 
        required: true 
    },
    mediaType: { 
        type: String, 
        enum: ['image', 'video'], 
        required: true 
    },
    caption: {
        type: String,
        maxlength: 500
    },
    viewers: [StoryViewerSchema],
    viewersCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: function() {
            // Stories expire after 24 hours
            return new Date(Date.now() + 24 * 60 * 60 * 1000);
        }
    }
}, {
    timestamps: true
});

// Indexes for better performance
StorySchema.index({ profileid: 1 });
// storyid index is automatically created due to unique: true
StorySchema.index({ isActive: 1, expiresAt: 1 });
StorySchema.index({ createdAt: -1 });

// TTL index to automatically delete expired stories
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual to check if story is viewed by a specific user
StorySchema.methods.isViewedByUser = function(profileid) {
    return this.viewers.some(viewer => viewer.profileid === profileid);
};

// Method to add viewer
StorySchema.methods.addViewer = function(profileid) {
    if (!this.isViewedByUser(profileid)) {
        this.viewers.push({ profileid });
        this.viewersCount = this.viewers.length;
    }
};

export default mongoose.models.Story || mongoose.model("Story", StorySchema);
