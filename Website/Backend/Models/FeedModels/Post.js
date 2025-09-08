import mongoose from "mongoose";
const PostSchema = new mongoose.Schema({
    postid: { type: String, required: true },
    profileid: { type: String, required: true },
    postUrl: { type: String, required: true },
    title: String,
    Description: String,
    postType: { type: String, enum: ['IMAGE', 'VIDEO'], required: true },
    location: String,
    taggedPeople: [String],
    tags: [String],
    allowComments: { type: Boolean, default: true },
    hideLikeCount: { type: Boolean, default: false },
}, {
    timestamps: true
})


export default mongoose.model("Post", PostSchema)