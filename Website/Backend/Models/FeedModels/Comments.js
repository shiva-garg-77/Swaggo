import mongoose from "mongoose";
import XSSSanitizer from "../../Utils/XSSSanitizer.js";
const CommentSchema = new mongoose.Schema(
  {
    postid: { type: String, required: true },
    commentid: { type: String, required: true },
    profileid: { type: String, required: true },
    usertoid: String,
    commenttoid: String,
    comment: { type: String, required: true },
    // Instagram-style flat threading fields
    isReply: { type: Boolean, default: false },
    replyToUserId: String, // The ID of the user being replied to
    replyToUsername: String, // The username of the user being replied to (for display)
    originalCommentId: String, // The original parent comment ID for grouping
    mentionedUsers: [
      {
        userId: String,
        username: String,
      },
    ], // Users mentioned in this comment via @username
  },
  {
    timestamps: true,
  },
);

// 🔧 PERFORMANCE INDEXES (Issue #73)
// Unique index on commentid
CommentSchema.index({ commentid: 1 }, { unique: true });

// Index on postid for finding all comments on a post
CommentSchema.index({ postid: 1 });

// Index on commenttoid for finding replies to a comment
CommentSchema.index({ commenttoid: 1 });

// Index on profileid for finding all comments by a user
CommentSchema.index({ profileid: 1 });

// Compound index for post comments sorted by date (most common query)
CommentSchema.index({ postid: 1, createdAt: -1 });

// Compound index for user comments sorted by date
CommentSchema.index({ profileid: 1, createdAt: -1 });

// Compound index for replies to a comment sorted by date
CommentSchema.index({ commenttoid: 1, createdAt: -1 });

// Index on createdAt for chronological sorting
CommentSchema.index({ createdAt: -1 });

// Index for reply structure
CommentSchema.index({ isReply: 1 });

// Index for finding replies by original comment
CommentSchema.index({ originalCommentId: 1 });

// Compound index for non-reply comments on a post (top-level comments)
CommentSchema.index({ postid: 1, isReply: 1, createdAt: -1 });

// Text index for searching comments
CommentSchema.index({ comment: "text" });

export default mongoose.models.Comments ||
  mongoose.model("Comments", CommentSchema);
