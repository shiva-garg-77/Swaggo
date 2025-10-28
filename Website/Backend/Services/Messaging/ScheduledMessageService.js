import ScheduledMessage from "../../Models/FeedModels/ScheduledMessage.js";
import Message from "../../Models/FeedModels/Message.js";
import Chat from "../../Models/FeedModels/Chat.js";
import { getIO } from "../../Config/SocketConfig.js";
import logger from "../../utils/logger.js";

class ScheduledMessageService {
    constructor() {
        // Don't initialize io here, it will be set when start() is called
        this.running = false;
    }

    // Start the scheduler
    start() {
        if (this.running) {
            logger.info('ScheduledMessageService is already running');
            return;
        }
        
        // Initialize io when service starts
        this.io = getIO();
        this.running = true;
        logger.info('Starting ScheduledMessageService');
        this.processScheduledMessages();
    }

    // Stop the scheduler
    stop() {
        this.running = false;
        logger.info('Stopping ScheduledMessageService');
    }

    // Process scheduled messages
    async processScheduledMessages() {
        if (!this.running) return;
        
        try {
            const dueMessages = await ScheduledMessage.getDueMessages();
            
            for (const scheduledMessage of dueMessages) {
                try {
                    await this.sendScheduledMessage(scheduledMessage);
                } catch (error) {
                    logger.error('Error processing scheduled message:', {
                        messageId: scheduledMessage.scheduledMessageId,
                        error: error.message
                    });
                    
                    // Increment retry count
                    scheduledMessage.retryCount += 1;
                    
                    if (scheduledMessage.retryCount >= scheduledMessage.maxRetries) {
                        await scheduledMessage.markAsFailed(error.message);
                    } else {
                        await scheduledMessage.save();
                    }
                }
            }
        } catch (error) {
            logger.error('Error fetching due scheduled messages:', error);
        }
        
        // Schedule next check (every 30 seconds)
        if (this.running) {
            setTimeout(() => this.processScheduledMessages(), 30000);
        }
    }

    // Send a scheduled message
    async sendScheduledMessage(scheduledMessage) {
        try {
            // Create the actual message
            const messageData = {
                messageid: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                chatid: scheduledMessage.chatid,
                senderid: scheduledMessage.senderid,
                messageType: scheduledMessage.messageType,
                content: scheduledMessage.content,
                attachments: scheduledMessage.attachments,
                stickerData: scheduledMessage.stickerData,
                gifData: scheduledMessage.gifData,
                voiceData: scheduledMessage.voiceData,
                fileData: scheduledMessage.fileData,
                linkPreviews: scheduledMessage.linkPreviews,
                messageStatus: 'sent'
            };

            const message = new Message(messageData);
            await message.save();

            // Update scheduled message status
            await scheduledMessage.markAsSent();

            // Get the chat to notify participants
            const chat = await Chat.findById(scheduledMessage.chatid);
            if (!chat) {
                throw new Error('Chat not found');
            }

            // Notify all participants except sender
            const senderId = scheduledMessage.senderid;
            chat.participants.forEach(participant => {
                if (participant.profileid !== senderId) {
                    // Update unread count for participant
                    participant.unreadCount = (participant.unreadCount || 0) + 1;
                }
            });
            
            await chat.save();

            // Emit message to all participants via socket
            chat.participants.forEach(participant => {
                this.io.to(`user_${participant.profileid}`).emit('receive_message', {
                    message: messageData,
                    chatid: scheduledMessage.chatid
                });
            });

            logger.info('Scheduled message sent successfully', {
                messageId: message.messageid,
                scheduledMessageId: scheduledMessage.scheduledMessageId
            });

            return message;
        } catch (error) {
            logger.error('Error sending scheduled message:', {
                scheduledMessageId: scheduledMessage.scheduledMessageId,
                error: error.message
            });
            throw error;
        }
    }

    // Create a new scheduled message
    async createScheduledMessage(data) {
        try {
            const scheduledMessageId = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const scheduledMessageData = {
                scheduledMessageId,
                chatid: data.chatid,
                senderid: data.senderid,
                messageType: data.messageType || 'text',
                content: data.content,
                attachments: data.attachments || [],
                scheduledFor: new Date(data.scheduledFor),
                stickerData: data.stickerData,
                gifData: data.gifData,
                voiceData: data.voiceData,
                fileData: data.fileData,
                linkPreviews: data.linkPreviews
            };

            const scheduledMessage = new ScheduledMessage(scheduledMessageData);
            await scheduledMessage.save();

            logger.info('Scheduled message created', {
                scheduledMessageId: scheduledMessage.scheduledMessageId,
                scheduledFor: scheduledMessage.scheduledFor
            });

            return scheduledMessage;
        } catch (error) {
            logger.error('Error creating scheduled message:', error);
            throw error;
        }
    }

    // Get scheduled messages for a user
    async getScheduledMessagesByUser(userId) {
        try {
            return await ScheduledMessage.getByUser(userId);
        } catch (error) {
            logger.error('Error fetching scheduled messages for user:', {
                userId,
                error: error.message
            });
            throw error;
        }
    }

    // Get scheduled messages for a chat
    async getScheduledMessagesByChat(chatId) {
        try {
            return await ScheduledMessage.getByChat(chatId);
        } catch (error) {
            logger.error('Error fetching scheduled messages for chat:', {
                chatId,
                error: error.message
            });
            throw error;
        }
    }

    // Cancel a scheduled message
    async cancelScheduledMessage(scheduledMessageId) {
        try {
            const scheduledMessage = await ScheduledMessage.findOne({ scheduledMessageId });
            if (!scheduledMessage) {
                throw new Error('Scheduled message not found');
            }

            await scheduledMessage.cancel();
            
            logger.info('Scheduled message cancelled', { scheduledMessageId });
            
            return scheduledMessage;
        } catch (error) {
            logger.error('Error cancelling scheduled message:', {
                scheduledMessageId,
                error: error.message
            });
            throw error;
        }
    }
}

// Export singleton instance
export default new ScheduledMessageService();