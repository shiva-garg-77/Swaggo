import mongoose from "mongoose";
const FollowingSchema=new mongoose.Schema({
    profileid:{type:String, required: true }, //ye id
    followingid:{type:String, required: true }, // in ids ko follow kar rahi hain
}, {
    timestamps: true
})


export default mongoose.models.Following || mongoose.model("Following", FollowingSchema)
