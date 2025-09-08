import mongoose from "mongoose";
const CommentSchema=new mongoose.Schema({
    postid:{type:String, required: true },
    commentid:{type:String, required: true },
    profileid:{type:String, required: true },
    usertoid:String,
    commenttoid:String,
    comment:{type:String, required: true }
}, {
    timestamps: true
})


export default mongoose.model("Comments",CommentSchema)