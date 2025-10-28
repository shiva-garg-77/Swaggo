import mongoose from "mongoose";
const FollowerSchema = new mongoose.Schema(
  {
    followerid: { type: String }, // Unique ID for this follower record
    profileid: { type: String, required: true }, // The user being followed
    followerid: { type: String, required: true }, // The user who is following
  },
  {
    timestamps: true,
  },
);

// 🔧 PERFORMANCE INDEXES (Issue #75)
// Compound unique index to prevent duplicate follower records
// This ensures a user cannot be recorded as following the same person twice
FollowerSchema.index({ profileid: 1, followerid: 1 }, { unique: true });

// Index on profileid for finding all followers of a specific profile
FollowerSchema.index({ profileid: 1 });

// Index on followerid for finding all profiles that a user is following (reverse lookup)
FollowerSchema.index({ followerid: 1 });

// Index on createdAt for chronological sorting
FollowerSchema.index({ createdAt: -1 });

// Compound index for profile's followers sorted by date (most recent followers first)
FollowerSchema.index({ profileid: 1, createdAt: -1 });

// Compound index for user's following list sorted by date
FollowerSchema.index({ followerid: 1, createdAt: -1 });

export default mongoose.models.Follower ||
  mongoose.model("Follower", FollowerSchema);
