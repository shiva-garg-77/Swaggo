import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    Refreshtoken: { type: String, required: true }
})

export default mongoose.model("RefreshToken", RefreshTokenSchema);