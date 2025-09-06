import mongoose from "mongoose";
const LikedPostSchema=new mongoose.Schema({
    profileid:{type:String, required: true },
    postid:{type:String, required: true },
}, {
    timestamps: true
})


export default mongoose.model("LikedPost",LikedPostSchema)