import mongoose from "mongoose";
const SavedPostSchema=new mongoose.Schema({
    profileid:{type:String, required: true },
    postid:{type:String, required: true },
}, {
    timestamps: true
})


export default mongoose.model("SavedPost",SavedPostSchema)