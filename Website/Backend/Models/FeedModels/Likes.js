import mongoose from "mongoose";
const LikeSchema = new mongoose.Schema(
  {
    likeid: { type: String },
    profileid: { type: String, required: true },
    postid: { type: String, required: true },
    commentid: String,
  },
  {
    timestamps: true,
  },
);

// 🔧 PERFORMANCE INDEXES (Issue #74)
// Compound index on postid and profileid for efficient like lookups and duplicate prevention
// This is the most important index as it prevents duplicate likes and speeds up "is this post liked by this user" queries
LikeSchema.index({ postid: 1, profileid: 1 }, { unique: true, sparse: true });

// Compound index on commentid and profileid for comment likes (sparse because commentid is optional)
LikeSchema.index(
  { commentid: 1, profileid: 1 },
  { unique: true, sparse: true },
);

// Index on profileid for finding all likes by a user
LikeSchema.index({ profileid: 1 });

// Index on postid for finding all likes on a post
LikeSchema.index({ postid: 1 });

// Index on commentid for finding all likes on a comment
LikeSchema.index({ commentid: 1 });

// Index on createdAt for chronological sorting
LikeSchema.index({ createdAt: -1 });

// Compound index for user likes sorted by date
LikeSchema.index({ profileid: 1, createdAt: -1 });

// Compound index for post likes sorted by date
LikeSchema.index({ postid: 1, createdAt: -1 });

export default mongoose.models.Like || mongoose.model("Like", LikeSchema);
