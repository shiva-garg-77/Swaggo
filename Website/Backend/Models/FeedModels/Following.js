import mongoose from "mongoose";
const FollowingSchema = new mongoose.Schema(
  {
    followingid: { type: String }, // Unique ID for this following record
    profileid: { type: String, required: true }, // The user who is following
    followingid: { type: String, required: true }, // The user being followed
  },
  {
    timestamps: true,
  },
);

// 🔧 PERFORMANCE INDEXES (Issue #75)
// Compound unique index to prevent duplicate follows
// This ensures a user cannot follow the same person twice
FollowingSchema.index({ profileid: 1, followingid: 1 }, { unique: true });

// Index on profileid for finding all users that a profile is following
FollowingSchema.index({ profileid: 1 });

// Index on followingid for finding all users following a specific profile (reverse lookup)
FollowingSchema.index({ followingid: 1 });

// Index on createdAt for chronological sorting
FollowingSchema.index({ createdAt: -1 });

// Compound index for user's following list sorted by date (most recent follows first)
FollowingSchema.index({ profileid: 1, createdAt: -1 });

// Compound index for finding followers of a profile sorted by date
FollowingSchema.index({ followingid: 1, createdAt: -1 });

export default mongoose.models.Following ||
  mongoose.model("Following", FollowingSchema);
