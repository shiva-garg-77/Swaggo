import mongoose from "mongoose";

const CloseFriendsSchema = new mongoose.Schema({
    profileid: { type: String, required: true }, // User who has the close friend
    closefriendid: { type: String, required: true }, // User who is the close friend
    status: { 
        type: String, 
        enum: ['active', 'removed'], 
        default: 'active' 
    }
}, {
    timestamps: true
});

// Ensure a user can't add the same person as close friend multiple times
CloseFriendsSchema.index({ profileid: 1, closefriendid: 1 }, { unique: true });

export default mongoose.models.CloseFriends || mongoose.model("CloseFriends", CloseFriendsSchema);
