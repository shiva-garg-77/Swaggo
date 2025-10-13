import Chat from '../../Models/FeedModels/Chat.js';
import Message from '../../Models/FeedModels/Message.js';
import Profile from '../../Models/FeedModels/Profile.js';
import { v4 as uuidv4 } from 'uuid';
import XSSSanitizer from '../../Utils/XSSSanitizer.js';
import DataLoaderService from '../../Services/DataLoaderService.js';
import MongoDBSanitizer from '../../utils/MongoDBSanitizer.js';
// 🔧 FIX #20: Add input validation with Joi
import { validateArgs } from '../../utils/ValidationUtils.js';
// 🛠️ Standardized error handling
import { asyncHandler, AppError, NotFoundError, AuthorizationError, ValidationError } from '../../Helper/ErrorHandling.js';

// Import services
import chatService from '../../Services/ChatService.js';
import messageService from '../../Services/MessageService.js';

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
        // Chat queries (from core schema)
        chats: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'chats');
            
            if (!context.user) {
                throw new AuthorizationError('Authentication required');
            }

            // Use chat service to get chats
            return await chatService.getChats(validatedArgs.profileid || context.user.profileid);
        }, 'graphql'),

        chat: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'chat');
            
            // Use chat service to get chat by ID
            return await chatService.getChatById(validatedArgs.id, context.user.profileid);
        }, 'graphql'),

        chatByParticipants: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'chatByParticipants');
            
            // Use chat service to get chat by participants
            return await chatService.getChatByParticipants(validatedArgs.participants, context.user.profileid);
        }, 'graphql'),

        // Message queries (from core schema)
        messages: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'messages');
            
            // Use chat service to get messages by chat
            return await chatService.getMessagesByChat(validatedArgs.chatid, context.user.profileid, {
                limit: validatedArgs.limit,
                cursor: validatedArgs.cursor
            });
        }, 'graphql'),

        message: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'message');
            
            // Use message service to get message by ID
            return await messageService.getMessageById(validatedArgs.id, context.user.profileid);
        }, 'graphql'),

        // Chat queries (from chat schema)
        getUserChats: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'getUserChats');
            
            if (!context.user || context.user.profileid !== validatedArgs.profileid) {
                throw new AuthorizationError('Cannot access other user\'s chats');
            }

            // Use chat service to get chats
            return await chatService.getChats(validatedArgs.profileid);
        }, 'graphql'),

        searchChats: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'searchChats');
            
            if (!context.user || context.user.profileid !== validatedArgs.profileid) {
                throw new AuthorizationError('Cannot access other user\'s chats');
            }

            // Use chat service to search chats
            return await chatService.searchChats(validatedArgs.profileid, validatedArgs.query);
        }, 'graphql'),

        getChatParticipants: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'getChatParticipants');
            
            // Use chat service to get chat participants
            return await chatService.getChatParticipants(validatedArgs.chatid);
        }, 'graphql'),

        getChatAdmins: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'getChatAdmins');
            
            // Use chat service to get chat admins
            return await chatService.getChatAdmins(validatedArgs.chatid);
        }, 'graphql'),

        // Message queries
        getMessagesByChatWithPagination: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'getMessagesByChatWithPagination');
            
            // Use chat service to get messages by chat
            return await chatService.getMessagesByChat(validatedArgs.chatid, context.user.profileid, {
                limit: validatedArgs.limit,
                cursor: validatedArgs.cursor
            });
        }, 'graphql'),

        searchMessagesInChat: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'searchMessagesInChat');
            
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
        }, 'graphql'),

        // Call log queries
        getCallHistoryByUser: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'getCallHistoryByUser');
            
            if (!context.user || context.user.profileid !== validatedArgs.profileid) {
                throw new AuthorizationError('Cannot access other user\'s call history');
            }

            // Use chat service to get call history
            return await chatService.getCallHistoryByUser(validatedArgs.profileid, {
                limit: validatedArgs.limit,
                offset: validatedArgs.offset
            });
        }, 'graphql'),

        getCallHistoryByChat: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'getCallHistoryByChat');
            
            // Use chat service to get call history by chat
            return await chatService.getCallHistoryByChat(validatedArgs.chatid, {
                limit: validatedArgs.limit,
                offset: validatedArgs.offset
            });
        }, 'graphql'),

        // Scheduled message queries
        getScheduledMessagesByChat: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'getScheduledMessagesByChat');
            
            // Use scheduled message service to get messages by chat
            return await ScheduledMessageService.getScheduledMessagesByChat(validatedArgs.chatId, {
                limit: validatedArgs.limit,
                offset: validatedArgs.offset
            });
        }, 'graphql'),

        getScheduledMessagesByUser: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'getScheduledMessagesByUser');
            
            if (!context.user || context.user.profileid !== validatedArgs.profileid) {
                throw new AuthorizationError('Cannot access other user\'s scheduled messages');
            }

            // Use scheduled message service to get messages by user
            return await ScheduledMessageService.getScheduledMessagesByUser(validatedArgs.profileid, {
                limit: validatedArgs.limit,
                offset: validatedArgs.offset
            });
        }, 'graphql')
    },

    Mutation: {
        // Chat mutations (from core schema)
        createChat: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'createChat');
            
            if (!context.user) {
                throw new AuthenticationError('Authentication required');
            }

            // Use chat service to create chat
            return await chatService.createChat({
                ...validatedArgs.input,
                creatorProfileId: context.user.profileid
            });
        }, 'graphql'),

        updateChat: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'updateChat');
            
            // Use chat service to update chat
            return await chatService.updateChat(validatedArgs.id, context.user.profileid, validatedArgs.input);
        }, 'graphql'),

        deleteChat: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'deleteChat');
            
            // Use chat service to delete chat
            return await chatService.deleteChat(validatedArgs.id, context.user.profileid);
        }, 'graphql'),

        // Message mutations (from core schema)
        sendMessage: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'sendMessage');
            
            if (!context.user) {
                throw new AuthenticationError('Authentication required');
            }

            // Use message service to send message
            return await messageService.sendMessage(validatedArgs.input.chatid, context.user.profileid, {
                content: validatedArgs.input.content,
                messageType: validatedArgs.input.messageType,
                attachments: validatedArgs.input.attachments,
                replyTo: validatedArgs.input.replyTo,
                mentions: validatedArgs.input.mentions
            });
        }, 'graphql'),

        editMessage: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'editMessage');
            
            // Use message service to edit message
            return await messageService.editMessage(validatedArgs.id, context.user.profileid, validatedArgs.content);
        }, 'graphql'),

        deleteMessage: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'deleteMessage');
            
            // Use message service to delete message
            return await messageService.deleteMessage(validatedArgs.id, context.user.profileid);
        }, 'graphql'),

        // Chat mutations (from chat schema)
        createGroupChat: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'createGroupChat');
            
            if (!context.user) {
                throw new AuthenticationError('Authentication required');
            }

            // Use chat service to create group chat
            return await chatService.createGroupChat({
                ...validatedArgs.input,
                creatorProfileId: context.user.profileid
            });
        }, 'graphql'),

        updateChatSettings: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'updateChatSettings');
            
            // Use chat service to update chat settings
            return await chatService.updateChatSettings(validatedArgs.chatid, context.user.profileid, validatedArgs.input);
        }, 'graphql'),

        deleteChatWithMessages: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'deleteChatWithMessages');
            
            // Use chat service to delete chat with messages
            return await chatService.deleteChatWithMessages(validatedArgs.chatid, context.user.profileid);
        }, 'graphql'),

        addParticipantToChat: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'addParticipantToChat');
            
            // Use chat service to add participant to chat
            return await chatService.addParticipantToChat(validatedArgs.chatid, context.user.profileid, validatedArgs.profileid);
        }, 'graphql'),

        removeParticipantFromChat: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'removeParticipantFromChat');
            
            // Use chat service to remove participant from chat
            return await chatService.removeParticipantFromChat(validatedArgs.chatid, context.user.profileid, validatedArgs.profileid);
        }, 'graphql'),

        makeAdmin: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'makeAdmin');
            
            // Use chat service to make admin
            return await chatService.makeAdmin(validatedArgs.chatid, context.user.profileid, validatedArgs.profileid);
        }, 'graphql'),

        removeAdmin: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'removeAdmin');
            
            // Use chat service to remove admin
            return await chatService.removeAdmin(validatedArgs.chatid, context.user.profileid, validatedArgs.profileid);
        }, 'graphql'),

        muteChat: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'muteChat');
            
            // Use chat service to mute chat
            return await chatService.muteChat(validatedArgs.chatid, context.user.profileid);
        }, 'graphql'),

        unmuteChat: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'unmuteChat');
            
            // Use chat service to unmute chat
            return await chatService.unmuteChat(validatedArgs.chatid, context.user.profileid);
        }, 'graphql'),

        // Message mutations
        sendMessageWithAttachments: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'sendMessageWithAttachments');
            
            if (!context.user) {
                throw new AuthenticationError('Authentication required');
            }

            // Use message service to send message with attachments
            return await messageService.sendMessageWithAttachments({
                ...validatedArgs.input,
                senderid: context.user.profileid
            });
        }, 'graphql'),

        editMessageWithHistory: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'editMessageWithHistory');
            
            // Use message service to edit message with history
            return await messageService.editMessageWithHistory(validatedArgs.messageid, context.user.profileid, validatedArgs.content);
        }, 'graphql'),

        deleteMessageForEveryone: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'deleteMessageForEveryone');
            
            // Use message service to delete message for everyone
            return await messageService.deleteMessageForEveryone(validatedArgs.messageid, context.user.profileid);
        }, 'graphql'),

        deleteMessageForMe: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'deleteMessageForMe');
            
            // Use message service to delete message for me
            return await messageService.deleteMessageForMe(validatedArgs.messageid, context.user.profileid);
        }, 'graphql'),

        reactToMessage: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'reactToMessage');
            
            // Use message service to react to message
            return await messageService.reactToMessage(validatedArgs.messageid, context.user.profileid, validatedArgs.emoji);
        }, 'graphql'),

        removeReaction: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'removeReaction');
            
            // Use message service to remove reaction
            return await messageService.removeReaction(validatedArgs.messageid, context.user.profileid, validatedArgs.emoji);
        }, 'graphql'),

        markMessageAsRead: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'markMessageAsRead');
            
            // Use message service to mark message as read
            return await messageService.markMessageAsRead(validatedArgs.messageid, context.user.profileid);
        }, 'graphql'),

        markChatAsRead: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'markChatAsRead');
            
            // Use chat service to mark chat as read
            const result = await chatService.markChatAsRead(validatedArgs.chatid, context.user.profileid);
            return result;
        }, 'graphql'),

        // Call log mutations
        updateCallLog: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'updateCallLog');
            
            // Use chat service to update call log
            return await chatService.updateCallLog(validatedArgs.callId, context.user.profileid, validatedArgs.input);
        }, 'graphql'),

        deleteCallLog: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'deleteCallLog');
            
            // Use chat service to delete call log
            return await chatService.deleteCallLog(validatedArgs.callId, context.user.profileid);
        }, 'graphql'),

        // Scheduled message mutations
        createScheduledMessageWithMedia: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'createScheduledMessageWithMedia');
            
            if (!context.user) {
                throw new AuthenticationError('Authentication required');
            }

            // Use scheduled message service to create scheduled message with media
            return await ScheduledMessageService.createScheduledMessageWithMedia({
                ...validatedArgs.input,
                senderid: context.user.profileid
            });
        }, 'graphql'),

        updateScheduledMessage: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'updateScheduledMessage');
            
            // Use scheduled message service to update scheduled message
            return await ScheduledMessageService.updateScheduledMessage(validatedArgs.scheduledMessageId, context.user.profileid, validatedArgs.input);
        }, 'graphql'),

        cancelScheduledMessageWithNotification: asyncHandler(async (parent, args, context) => {
            // 🔧 FIX #20: Add input validation
            const validatedArgs = validateArgs(args, 'cancelScheduledMessageWithNotification');
            
            // Use scheduled message service to cancel scheduled message with notification
            return await ScheduledMessageService.cancelScheduledMessageWithNotification(validatedArgs.scheduledMessageId, context.user.profileid);
        }, 'graphql')
    }
};

export default ChatResolvers;
