import mongoose from "mongoose"

const MemorySchema = new mongoose.Schema({
    memoryid: {
        type: String,
        required: true,
        unique: true
    },
    profileid: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    coverImage: {
        type: String,
        default: null
    },
    stories: [{
        storyid: {
            type: String,
            required: true
        },
        mediaUrl: {
            type: String,
            required: true
        },
        mediaType: {
            type: String,
            enum: ['IMAGE', 'VIDEO'],
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
})

export default mongoose.model("Memory", MemorySchema)
