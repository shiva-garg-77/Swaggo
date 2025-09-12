import mongoose from "mongoose";

const BlockedAccountSchema = new mongoose.Schema({
    blockid: { type: String, required: true, unique: true },
    profileid: { type: String, required: true }, // User who blocked
    blockedprofileid: { type: String, required: true }, // User who was blocked
    reason: { type: String, default: null }, // Optional reason for blocking
}, {
    timestamps: true
});

// Create compound index to prevent duplicate blocks
BlockedAccountSchema.index({ profileid: 1, blockedprofileid: 1 }, { unique: true });

export default mongoose.models.BlockedAccount || mongoose.model("BlockedAccount", BlockedAccountSchema);
