import mongoose from "mongoose";

const passwordSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    token: { type: String, required: true }
});

export default mongoose.model("ResetPassword", passwordSchema);
