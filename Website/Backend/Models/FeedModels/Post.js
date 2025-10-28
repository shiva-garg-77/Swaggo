import mongoose from "mongoose";
import XSSSanitizer from "../../Utils/XSSSanitizer.js";
const PostSchema = new mongoose.Schema(
  {
    postid: { type: String, required: true },
    profileid: { type: String, required: true },
    postUrl: { type: String, required: true },
    title: String,
    Description: String,
    caption: String,
    postType: {
      type: String,
      enum: ["IMAGE", "VIDEO", "TEXT", "image", "video", "text", "carousel"],
      required: true,
    },
    location: String,
    taggedPeople: [String],
    tags: [String],
    allowComments: { type: Boolean, default: true },
    hideLikeCount: { type: Boolean, default: false },
    autoPlay: { type: Boolean, default: false },
    isCloseFriendOnly: { type: Boolean, default: false },

    // Engagement metrics
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },

    // 🔧 SOFT DELETE #94: Add isDeleted field for soft delete functionality
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

// 🔧 PERFORMANCE INDEXES (Issue #72)
// Unique index on postid
PostSchema.index({ postid: 1 }, { unique: true });

// Index on profileid for user posts lookup
PostSchema.index({ profileid: 1 });

// Index on createdAt for chronological sorting (descending for newest first)
PostSchema.index({ createdAt: -1 });

// Index on tags for tag-based search
PostSchema.index({ tags: 1 });

// Compound index for user posts sorted by date (most common query)
PostSchema.index({ profileid: 1, createdAt: -1 });

// Index for trending posts (engagement-based queries)
PostSchema.index({ likeCount: -1, commentCount: -1, createdAt: -1 });

// Index for close friends only posts
PostSchema.index({ isCloseFriendOnly: 1 });

// Index for soft delete queries (Issue #94)
PostSchema.index({ isDeleted: 1 });
PostSchema.index({ profileid: 1, isDeleted: 1 });

// Text index for full-text search on title, Description, and caption
PostSchema.index({ title: "text", Description: "text", caption: "text" });

// Compound index for filtering active posts
PostSchema.index({ isDeleted: 1, createdAt: -1 });

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
