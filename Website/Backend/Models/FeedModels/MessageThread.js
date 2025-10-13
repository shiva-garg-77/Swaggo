import mongoose from "mongoose";

const MessageThreadSchema = new mongoose.Schema({
    threadId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    messageId: { 
        type: String, 
        required: true,
        ref: 'Message'
    },
    chatId: { 
        type: String, 
        required: true,
        ref: 'Chat'
    },
    replies: [{
        type: String,
        ref: 'Message'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better performance
MessageThreadSchema.index({ messageId: 1 });
MessageThreadSchema.index({ chatId: 1 });
MessageThreadSchema.index({ createdAt: -1 });

// Static method to create a thread
MessageThreadSchema.statics.createThread = async function(messageId, chatId) {
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return await this.create({
        threadId,
        messageId,
        chatId
    });
};

// Static method to add reply to thread
MessageThreadSchema.statics.addReply = async function(threadId, replyMessageId) {
    return await this.findOneAndUpdate(
        { threadId },
        { 
            $push: { replies: replyMessageId },
            $set: { updatedAt: new Date() }
        },
        { new: true }
    );
};

// Static method to get thread with all replies
MessageThreadSchema.statics.getThreadWithReplies = async function(threadId) {
    return await this.findOne({ threadId })
        .populate('messageId')
        .populate('replies');
};

// Static method to get thread by message ID
MessageThreadSchema.statics.getByMessageId = async function(messageId) {
    return await this.findOne({ messageId: messageId });
};

// Static method to add multiple replies to thread
MessageThreadSchema.statics.addReplies = async function(threadId, replyMessageIds) {
    return await this.findOneAndUpdate(
        { threadId },
        { 
            $push: { replies: { $each: replyMessageIds } },
            $set: { updatedAt: new Date() }
        },
        { new: true }
    );
};

// Static method to remove reply from thread
MessageThreadSchema.statics.removeReply = async function(threadId, replyMessageId) {
    return await this.findOneAndUpdate(
        { threadId },
        { 
            $pull: { replies: replyMessageId },
            $set: { updatedAt: new Date() }
        },
        { new: true }
    );
};

// Static method to get thread statistics
MessageThreadSchema.statics.getThreadStats = async function(threadId) {
    const thread = await this.findOne({ threadId });
    if (!thread) return null;
    
    return {
        threadId: thread.threadId,
        messageId: thread.messageId,
        chatId: thread.chatId,
        replyCount: thread.replies.length,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt
    };
};

export default mongoose.models.MessageThread || mongoose.model("MessageThread", MessageThreadSchema);