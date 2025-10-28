import mongoose from "mongoose";
import XSSSanitizer from '../../Utils/XSSSanitizer.js';

const HighlightStorySchema = new mongoose.Schema({
    storyid: {
        type: String,
        required: true,
        ref: 'Story'
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
    originalStoryDate: {
        type: Date,
        required: true
    },
    addedToHighlightAt: {
        type: Date,
        default: Date.now
    }
});

const HighlightSchema = new mongoose.Schema({
    highlightid: {
        type: String,
        required: true,
        unique: true
    },
    profileid: {
        type: String,
        required: true,
        ref: 'Profile'
    },
    title: {
        type: String,
        required: true,
        maxlength: 50
    },
    coverImage: {
        type: String // Cover image URL for the highlight
    },
    stories: [HighlightStorySchema],
    isActive: {
        type: Boolean,
        default: true
    },
    viewCount: {
        type: Number,
        default: 0
    },
    // Optional: Category or theme for the highlight
    category: {
        type: String,
        maxlength: 30
    }
}, {
    timestamps: true
});

// Indexes for better performance
HighlightSchema.index({ profileid: 1 });
HighlightSchema.index({ isActive: 1 });
HighlightSchema.index({ createdAt: -1 });

// Method to add a story to highlight
HighlightSchema.methods.addStory = function(storyData) {
    // Check if story is already in this highlight
    const existingStory = this.stories.find(s => s.storyid === storyData.storyid);
    if (existingStory) {
        return false; // Story already exists
    }
    
    this.stories.push({
        storyid: storyData.storyid,
        mediaUrl: storyData.mediaUrl,
        mediaType: storyData.mediaType,
        caption: storyData.caption || '',
        originalStoryDate: storyData.createdAt || new Date(),
        addedToHighlightAt: new Date()
    });
    
    // Update cover image if this is the first story
    if (this.stories.length === 1) {
        this.coverImage = storyData.mediaUrl;
    }
    
    return true;
};

// Method to remove a story from highlight
HighlightSchema.methods.removeStory = function(storyId) {
    const initialLength = this.stories.length;
    this.stories = this.stories.filter(story => story.storyid !== storyId);
    
    // Update cover image if the removed story was the cover
    if (this.stories.length > 0 && this.coverImage === this.stories.find(s => s.storyid === storyId)?.mediaUrl) {
        this.coverImage = this.stories[0].mediaUrl;
    } else if (this.stories.length === 0) {
        this.coverImage = null;
    }
    
    return this.stories.length < initialLength;
};

// Virtual for story count
HighlightSchema.virtual('storyCount').get(function() {
    return this.stories ? this.stories.length : 0;
});

export default mongoose.models.Highlight || mongoose.model("Highlight", HighlightSchema);
