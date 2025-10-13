import Chat from '../Models/FeedModels/Chat.js';
import Message from '../Models/FeedModels/Message.js';
import Profile from '../Models/FeedModels/Profile.js';
import { v4 as uuidv4 } from 'uuid';
import XSSSanitizer from '../Utils/XSSSanitizer.js';
import DataLoaderService from '../Services/DataLoaderService.js';
import MongoDBSanitizer from '../utils/MongoDBSanitizer.js';
// 🔧 FIX #20: Add input validation with Joi
import { validateArgs } from '../utils/ValidationUtils.js';
// 🛠️ Standardized error handling
import { asyncHandler, AppError, NotFoundError, AuthorizationError, ValidationError } from '../Helper/ErrorHandling.js';

// Import services
import chatService from '../Services/ChatService.js';
import messageService from '../Services/MessageService.js';

const ChatResolvers = {
    // Chat field resolvers
    Chat: {
        participants: asyncHandler(async (parent, args, context) => {
            // Use DataLoaderService for batching profile queries
            const dataLoaders = context.dataloaders || DataLoaderService.createContext();
            const participantIds = parent.participants.map(p => p.profileid);
            const profiles = await Promise.all(participantIds.map(id => dataLoaders.loadProfile(id)));
            return profiles.filter(profile => profile !== null);
        }, 'graphql'),
        lastMessage: asyncHandler(async (parent, args, context) => {
            if (!parent.lastMessage) return null;
            // Use DataLoaderService for batching message queries
            const dataLoaders = context.dataloaders || DataLoaderService.createContext();
            const message = await dataLoaders.loadMessage(parent.lastMessage);
            return message;
        }, 'graphql'),
        mutedBy: asyncHandler(async (parent, args, context) => {
            if (!parent.mutedBy || parent.mutedBy.length === 0) return [];
            // Use DataLoaderService for batching profile queries
            const dataLoaders = context.dataloaders || DataLoaderService.createContext();
            const profiles = await Promise.all(parent.mutedBy.map(id => dataLoaders.loadProfile(id)));
            return profiles.filter(profile => profile !== null);
        }, 'graphql'),
        adminIds: asyncHandler(async (parent, args, context) => {
            if (!parent.adminIds || parent.adminIds.length === 0) return [];
            // Use DataLoaderService for batching profile queries
            const dataLoaders = context.dataloaders || DataLoaderService.createContext();
            const profiles = await Promise.all(parent.adminIds.map(id => dataLoaders.loadProfile(id)));
            return profiles.filter(profile => profile !== null);
        }, 'graphql'),
        createdBy: asyncHandler(async (parent, args, context) => {
            // Use DataLoaderService for batching profile queries
            const dataLoaders = context.dataloaders || DataLoaderService.createContext();
            const profile = await dataLoaders.loadProfile(parent.createdBy);
            return profile;
        }, 'graphql'),
        messages: asyncHandler(async (parent, { limit = 50, offset = 0 }) => {
            const messages = await Message.find({ 
                chatid: parent.chatid,
                isDeleted: false
            })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(offset);
            return messages.reverse(); // Return in chronological order
        }, 'graphql')
    },

    // Message field resolvers
    Message: {
        chat: asyncHandler(async (parent, args, context) => {
            // Use DataLoaderService for batching chat queries
            const dataLoaders = context.dataloaders || DataLoaderService.createContext();
            const chat = await dataLoaders.loadChat(parent.chatid);
            return chat;
        }, 'graphql'),
        sender: asyncHandler(async (parent, args, context) => {
            // Use DataLoaderService for batching profile queries
            const dataLoaders = context.dataloaders || DataLoaderService.createContext();
            const profile = await dataLoaders.loadProfile(parent.senderid);
            return profile;
        }, 'graphql'),
        replyTo: asyncHandler(async (parent, args, context) => {
            if (!parent.replyTo) return null;
            // Use DataLoaderService for batching message queries
            const dataLoaders = context.dataloaders || DataLoaderService.createContext();
            const message = await dataLoaders.loadMessage(parent.replyTo);
            return message;
        }, 'graphql'),
        mentions: asyncHandler(async (parent, args, context) => {
            if (!parent.mentions || parent.mentions.length === 0) return [];
            // Use DataLoaderService for batching profile queries
            const dataLoaders = context.dataloaders || DataLoaderService.createContext();
            const profiles = await Promise.all(parent.mentions.map(id => dataLoaders.loadProfile(id)));
            return profiles.filter(profile => profile !== null);
        }, 'graphql'),
        deletedBy: asyncHandler(async (parent, args, context) => {
            if (!parent.deletedBy) return null;
            // Use DataLoaderService for batching profile queries
            const dataLoaders = context.dataloaders || DataLoaderService.createContext();
            const profile = await dataLoaders.loadProfile(parent.deletedBy);
            return profile;
        }, 'graphql')
    },

    // MessageReaction field resolvers
    MessageReaction: {
        profile: asyncHandler(async (parent, args, context) => {
            // Use DataLoaderService for batching profile queries
            const dataLoaders = context.dataloaders || DataLoaderService.createContext();
            const profile = await dataLoaders.loadProfile(parent.profileid);
            return profile;
        }, 'graphql')
    },

    // MessageReadStatus field resolvers
    MessageReadStatus: {
        profile: asyncHandler(async (parent, args, context) => {
            // Use DataLoaderService for batching profile queries
            const dataLoaders = context.dataloaders || DataLoaderService.createContext();
            const profile = await dataLoaders.loadProfile(parent.profileid);
            return profile;
        }, 'graphql')
    },

    Query: {
        // Chat queries
        getChats: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'getChats');
            
            if (!context.user || context.user.profileid !== validatedArgs.profileid) {
                throw new AuthorizationError('Cannot access other user\'s chats');
            }

            // Use chat service to get chats
            return await chatService.getChats(validatedArgs.profileid);
        }, 'graphql'),

        getChatById: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'getChatById');
            
            // Use chat service to get chat by ID
            return await chatService.getChatById(validatedArgs.chatid, context.user.profileid);
        }, 'graphql'),

        getChatByParticipants: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'getChatByParticipants');
            
            // Use chat service to get chat by participants
            return await chatService.getChatByParticipants(validatedArgs.participants, context.user.profileid);
        }, 'graphql'),

        // Message queries
        getMessagesByChat: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'getMessagesByChat');
            
            // Use chat service to get messages by chat
            return await chatService.getMessagesByChat(validatedArgs.chatid, context.user.profileid, {
                limit: validatedArgs.limit,
                cursor: validatedArgs.cursor
            });
        }, 'graphql'),

        getMessageById: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'getMessageById');
            
            // Use message service to get message by ID
            return await messageService.getMessageById(validatedArgs.messageid, context.user.profileid);
        }, 'graphql'),

        searchMessages: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'searchMessages');
            
            // Use message service to search messages
            return await messageService.searchMessages(validatedArgs.chatid, context.user.profileid, validatedArgs.query);
        }, 'graphql'),

        // Chat statistics
        getUnreadMessageCount: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'getUnreadMessageCount');
            
            if (!context.user || context.user.profileid !== validatedArgs.profileid) {
                throw new AuthorizationError('Unauthorized');
            }

            // Use chat service to get unread message count
            return await chatService.getUnreadMessageCount(validatedArgs.profileid);
        }, 'graphql'),

        getChatUnreadCount: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'getChatUnreadCount');
            
            if (!context.user || context.user.profileid !== validatedArgs.profileid) {
                throw new AuthorizationError('Unauthorized');
            }

            // Use chat service to get chat unread count
            return await chatService.getChatUnreadCount(validatedArgs.chatid, validatedArgs.profileid);
        }, 'graphql')
    },

    Mutation: {
        UpdateChat: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'UpdateChat');
            
            // Use chat service to update chat
            return await chatService.updateChat(validatedArgs.chatid, context.user.profileid, {
                chatName: validatedArgs.chatName,
                chatAvatar: validatedArgs.chatAvatar
            });
        }, 'graphql'),

        // Message mutations
        SendMessage: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'SendMessage');
            
            if (!context.user) {
                throw new AuthenticationError('Authentication required');
            }

            // Use message service to send message
            return await messageService.sendMessage(validatedArgs.chatid, context.user.profileid, {
                content: validatedArgs.content,
                messageType: validatedArgs.messageType,
                attachments: validatedArgs.attachments,
                replyTo: validatedArgs.replyTo,
                mentions: validatedArgs.mentions
            });
        }, 'graphql'),

        EditMessage: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'EditMessage');
            
            // Use message service to edit message
            return await messageService.editMessage(validatedArgs.messageid, context.user.profileid, validatedArgs.content);
        }, 'graphql'),

        DeleteMessage: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'DeleteMessage');
            
            // Use message service to delete message
            return await messageService.deleteMessage(validatedArgs.messageid, context.user.profileid);
        }, 'graphql'),

        ReactToMessage: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'ReactToMessage');
            
            // Use message service to react to message
            return await messageService.reactToMessage(validatedArgs.messageid, context.user.profileid, validatedArgs.emoji);
        }, 'graphql'),

        RemoveReaction: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'RemoveReaction');
            
            // Use message service to remove reaction
            return await messageService.removeReaction(validatedArgs.messageid, context.user.profileid, validatedArgs.emoji);
        }, 'graphql'),

        MarkMessageAsRead: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'MarkMessageAsRead');
            
            // Use message service to mark message as read
            return await messageService.markMessageAsRead(validatedArgs.messageid, context.user.profileid);
        }, 'graphql'),

        MarkChatAsRead: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'MarkChatAsRead');
            
            // Use chat service to mark chat as read
            const result = await chatService.markChatAsRead(validatedArgs.chatid, context.user.profileid);
            return result;
        }, 'graphql')
    }
};

export default ChatResolvers;








