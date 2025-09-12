import mongoose from "mongoose";

const MentionsSchema = new mongoose.Schema({
    mentionid: { type: String, required: true, unique: true },
    mentionedprofileid: { type: String, required: true }, // User being mentioned
    mentionerprofileid: { type: String, required: true }, // User who mentioned
    contexttype: { 
        type: String, 
        enum: ['post', 'comment', 'story'], 
        required: true 
    },
    contextid: { type: String, required: true }, // ID of post, comment, or story
    isnotified: { type: Boolean, default: false }, // Whether the mentioned user was notified
    isread: { type: Boolean, default: false } // Whether the mentioned user has seen the mention
}, {
    timestamps: true
});

// Indexes for efficient querying
MentionsSchema.index({ mentionedprofileid: 1 });
MentionsSchema.index({ contexttype: 1, contextid: 1 });
MentionsSchema.index({ createdAt: -1 });

export default mongoose.models.Mentions || mongoose.model("Mentions", MentionsSchema);
