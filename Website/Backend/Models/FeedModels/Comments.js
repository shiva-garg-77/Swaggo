import mongoose from "mongoose";
const CommentSchema=new mongoose.Schema({
    postid:{type:String, required: true },
    commentid:{type:String, required: true },
    profileid:{type:String, required: true },
    usertoid:String,
    commenttoid:String,
    comment:{type:String, required: true },
    // Instagram-style flat threading fields
    isReply: {type: Boolean, default: false},
    replyToUserId: String, // The ID of the user being replied to
    replyToUsername: String, // The username of the user being replied to (for display)
    originalCommentId: String, // The original parent comment ID for grouping
    mentionedUsers: [{
        userId: String,
        username: String
    }] // Users mentioned in this comment via @username
}, {
    timestamps: true
})


export default mongoose.models.Comments || mongoose.model("Comments", CommentSchema)
