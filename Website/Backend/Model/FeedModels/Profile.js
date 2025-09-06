import mongoose from "mongoose";
const ProfileSchema=new mongoose.Schema({
    profileid:{type:String, required: true },
    username:{type:String, required: true },
    isPrivate:{type:Boolean, default:false},
    isVerified:{type:Boolean, default:false},
    name:String,
    profilePic:{type:String,default:'https://www.tenforums.com/attachments/user-accounts-family-safety/322690d1615743307t-user-account-image-log-user.png'},
    bio:String,
    note:String,
}, {
    timestamps: true
})


export default mongoose.model("Profile",ProfileSchema)