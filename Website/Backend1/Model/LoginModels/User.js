import mongoose from "mongoose";
const userSchema=new mongoose.Schema({
    email:{required:true,type:String},
    password:{required:true,type:String},
    username:{required:true,type:String},
    isVerify:{type:Boolean,default:false},
    date:{type:Date,default:Date.now()}
})


export default mongoose.model("User",userSchema)