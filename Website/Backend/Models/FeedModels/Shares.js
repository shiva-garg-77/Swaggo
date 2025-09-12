import mongoose from "mongoose";

const ShareSchema = new mongoose.Schema({
    shareid: { type: String, required: true, unique: true },
    profileid: { type: String, required: true },
    postid: { type: String, required: true },
    shareType: { 
        type: String, 
        enum: ['COPY_LINK', 'WHATSAPP', 'TWITTER', 'FACEBOOK', 'LINKEDIN', 'PINTEREST', 'TELEGRAM', 'NATIVE_SHARE'],
        required: true 
    },
    shareUrl: String,
    shareText: String,
    userAgent: String,
    ipAddress: String,
    referrer: String
}, {
    timestamps: true
});

// Indexes for better query performance
ShareSchema.index({ postid: 1 });
ShareSchema.index({ profileid: 1 });
ShareSchema.index({ shareType: 1 });
ShareSchema.index({ createdAt: -1 });
ShareSchema.index({ postid: 1, createdAt: -1 });

export default mongoose.models.Share || mongoose.model("Share", ShareSchema);
