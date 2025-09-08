import mongoose from "mongoose";

const DraftSchema = new mongoose.Schema({
    draftid: { type: String, required: true, unique: true },
    profileid: { type: String, required: true },
    postUrl: String, // Media URL for images/videos
    postType: { type: String, enum: ['IMAGE', 'VIDEO', 'TEXT'], default: 'TEXT' },
    title: String,
    caption: String, // Using 'caption' instead of 'Description' to match frontend
    location: String,
    taggedPeople: [String],
    tags: [String],
    allowComments: { type: Boolean, default: true },
    hideLikeCount: { type: Boolean, default: false },
    autoPlay: { type: Boolean, default: false },
}, {
    timestamps: true
});

export default mongoose.model("Draft", DraftSchema);
