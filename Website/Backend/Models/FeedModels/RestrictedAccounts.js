import mongoose from "mongoose";

const RestrictedAccountSchema = new mongoose.Schema({
    restrictid: { type: String, required: true, unique: true },
    profileid: { type: String, required: true }, // User who restricted
    restrictedprofileid: { type: String, required: true }, // User who was restricted
}, {
    timestamps: true
});

// Prevent duplicate restrictions per pair
RestrictedAccountSchema.index({ profileid: 1, restrictedprofileid: 1 }, { unique: true });

export default mongoose.model("RestrictedAccount", RestrictedAccountSchema);
