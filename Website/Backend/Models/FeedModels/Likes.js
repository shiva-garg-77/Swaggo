import mongoose from "mongoose";
const LikeSchema = new mongoose.Schema({
    profileid: { type: String, required: true },
    postid: { type: String, required: true },
    commentid: String,
}, {
    timestamps: true
})


export default mongoose.model("Like", LikeSchema)