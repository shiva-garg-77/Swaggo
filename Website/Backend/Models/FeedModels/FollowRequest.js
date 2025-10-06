import mongoose from "mongoose";

const FollowRequestSchema = new mongoose.Schema({
    requestid: { type: String, required: true, unique: true },
    requesterid: { type: String, required: true }, // ID of user sending the request
    requestedid: { type: String, required: true }, // ID of user being requested to follow
    status: { 
        type: String, 
        required: true,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    message: { type: String }, // Optional message with the request
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Compound index to prevent duplicate requests
FollowRequestSchema.index({ requesterid: 1, requestedid: 1 }, { unique: true });

// Index for efficient querying
FollowRequestSchema.index({ requestedid: 1, status: 1 });
FollowRequestSchema.index({ requesterid: 1, status: 1 });

export default mongoose.models.FollowRequest || mongoose.model("FollowRequest", FollowRequestSchema);
