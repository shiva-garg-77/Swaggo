import mongoose from "mongoose";
const TagPostSchema = new mongoose.Schema({
    profileid: { type: String, required: true },
    postid: { type: String, required: true },
    tag: {
        type: [String],
        required: true,
        default: []
    }
}, {
    timestamps: true
})


export default mongoose.model("TagPost", TagPostSchema)