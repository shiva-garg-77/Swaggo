import mongoose from "mongoose";
const FollowerSchema=new mongoose.Schema({
    profileid:{type:String, required: true }, // is id ko
    followerid:{type:String, required: true }, // ye ids follow kar rahe hain
}, {
    timestamps: true
})


export default mongoose.model("Follower",FollowerSchema)