import Chat from '../Models/FeedModels/Chat.js';
import Message from '../Models/FeedModels/Message.js';
import Profile from '../Models/FeedModels/Profile.js';
import { v4 as uuidv4 } from 'uuid';

const ChatResolvers = {
    // Chat field resolvers
    Chat: {
        participants: async (parent) => {
            try {
                const participantIds = parent.participants.map(p => p.profileid);
                const profiles = await Profile.find({ profileid: { $in: participantIds } });
                return profiles;
            } catch (error) {
                console.error('Error fetching chat participants:', error);
                return [];
            }
        },
        lastMessage: async (parent) => {
            if (!parent.lastMessage) return null;
            try {
                const message = await Message.findOne({ messageid: parent.lastMessage });
                return message;
            } catch (error) {
                console.error('Error fetching last message:', error);
                return null;
            }
        },
        mutedBy: async (parent) => {
            if (!parent.mutedBy || parent.mutedBy.length === 0) return [];
            try {
                const profiles = await Profile.find({ profileid: { $in: parent.mutedBy } });
                return profiles;
            } catch (error) {
                console.error('Error fetching muted by profiles:', error);
                return [];
            }
        },
        adminIds: async (parent) => {
            if (!parent.adminIds || parent.adminIds.length === 0) return [];
            try {
                const profiles = await Profile.find({ profileid: { $in: parent.adminIds } });
                return profiles;
            } catch (error) {
                console.error('Error fetching admin profiles:', error);
                return [];
            }
        },
        createdBy: async (parent) => {
            try {
                const profile = await Profile.findOne({ profileid: parent.createdBy });
                return profile;
            } catch (error) {
                console.error('Error fetching created by profile:', error);
                return null;
            }
        },
        messages: async (parent, { limit = 50, offset = 0 }) => {
            try {
                const messages = await Message.find({ 
                    chatid: parent.chatid,
                    isDeleted: false
                })
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset);
                return messages.reverse(); // Return in chronological order
            } catch (error) {
                console.error('Error fetching chat messages:', error);
                return [];
            }
        }
    },

    // Message field resolvers
    Message: {
        chat: async (parent) => {
            try {
                const chat = await Chat.findOne({ chatid: parent.chatid });
                return chat;
            } catch (error) {
                console.error('Error fetching message chat:', error);
                return null;
            }
        },
        sender: async (parent) => {
            try {
                const profile = await Profile.findOne({ profileid: parent.senderid });
                return profile;
            } catch (error) {
                console.error('Error fetching message sender:', error);
                return null;
            }
        },
        replyTo: async (parent) => {
            if (!parent.replyTo) return null;
            try {
                const message = await Message.findOne({ messageid: parent.replyTo });
                return message;
            } catch (error) {
                console.error('Error fetching reply to message:', error);
                return null;
            }
        },
        mentions: async (parent) => {
            if (!parent.mentions || parent.mentions.length === 0) return [];
            try {
                const profiles = await Profile.find({ profileid: { $in: parent.mentions } });
                return profiles;
            } catch (error) {
                console.error('Error fetching mentioned profiles:', error);
                return [];
            }
        },
        deletedBy: async (parent) => {
            if (!parent.deletedBy) return null;
            try {
                const profile = await Profile.findOne({ profileid: parent.deletedBy });
                return profile;
            } catch (error) {
                console.error('Error fetching deleted by profile:', error);
                return null;
            }
        }
    },

    // MessageReaction field resolvers
    MessageReaction: {
        profile: async (parent) => {
            try {
                const profile = await Profile.findOne({ profileid: parent.profileid });
                return profile;
            } catch (error) {
                console.error('Error fetching reaction profile:', error);
                return null;
            }
        }
    },

    // MessageReadStatus field resolvers
    MessageReadStatus: {
        profile: async (parent) => {
            try {
                const profile = await Profile.findOne({ profileid: parent.profileid });
                return profile;
            } catch (error) {
                console.error('Error fetching read status profile:', error);
                return null;
            }
        }
    },

    Query: {
        // Chat queries
        getChats: async (parent, { profileid }, context) => {
            try {
                if (!context.user || context.user.profileid !== profileid) {
                    throw new Error('Unauthorized: Cannot access other user\'s chats');
                }

                const chats = await Chat.find({
                    'participants.profileid': profileid,
                    isActive: true
                }).sort({ lastMessageAt: -1 });

                return chats;
            } catch (error) {
                console.error('Error fetching chats:', error);
                throw new Error('Failed to fetch chats');
            }
        },

        getChatById: async (parent, { chatid }, context) => {
            try {
                const chat = await Chat.findOne({ chatid, isActive: true });
                
                if (!chat) {
                    throw new Error('Chat not found');
                }

                // Check if user is a participant
                if (!chat.isParticipant(context.user.profileid)) {
                    throw new Error('Unauthorized: Not a participant in this chat');
                }

                return chat;
            } catch (error) {
                console.error('Error fetching chat by ID:', error);
                throw new Error('Failed to fetch chat');
            }
        },

        getChatByParticipants: async (parent, { participants }, context) => {
            try {
                // Check if current user is in participants
                if (!participants.includes(context.user.profileid)) {
                    throw new Error('Unauthorized: User not in participants list');
                }

                // For direct chats, find existing chat
                if (participants.length === 2) {
                    const chat = await Chat.findOne({
                        'participants.profileid': { $all: participants, $size: 2 },
                        chatType: 'direct',
                        isActive: true
                    });
                    return chat;
                }

                // For group chats, find exact match
                const chat = await Chat.findOne({
                    'participants.profileid': { $all: participants, $size: participants.length },
                    chatType: 'group',
                    isActive: true
                });

                return chat;
            } catch (error) {
                console.error('Error fetching chat by participants:', error);
                throw new Error('Failed to fetch chat');
            }
        },

        // Message queries
        getMessagesByChat: async (parent, { chatid, limit = 50, offset = 0 }, context) => {
            try {
                // Check if user has access to this chat
                const chat = await Chat.findOne({ chatid, isActive: true });
                if (!chat || !chat.isParticipant(context.user.profileid)) {
                    throw new Error('Unauthorized: Cannot access this chat');
                }

                const messages = await Message.find({
                    chatid,
                    isDeleted: false
                })
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset);

                return messages.reverse(); // Return in chronological order
            } catch (error) {
                console.error('Error fetching messages:', error);
                throw new Error('Failed to fetch messages');
            }
        },

        getMessageById: async (parent, { messageid }, context) => {
            try {
                const message = await Message.findOne({ messageid, isDeleted: false });
                
                if (!message) {
                    throw new Error('Message not found');
                }

                // Check if user has access to this chat
                const chat = await Chat.findOne({ chatid: message.chatid });
                if (!chat || !chat.isParticipant(context.user.profileid)) {
                    throw new Error('Unauthorized: Cannot access this message');
                }

                return message;
            } catch (error) {
                console.error('Error fetching message by ID:', error);
                throw new Error('Failed to fetch message');
            }
        },

        searchMessages: async (parent, { chatid, query }, context) => {
            try {
                // Check if user has access to this chat
                const chat = await Chat.findOne({ chatid, isActive: true });
                if (!chat || !chat.isParticipant(context.user.profileid)) {
                    throw new Error('Unauthorized: Cannot search this chat');
                }

                const messages = await Message.find({
                    chatid,
                    content: { $regex: query, $options: 'i' },
                    messageType: 'text',
                    isDeleted: false
                }).sort({ createdAt: -1 }).limit(20);

                return messages;
            } catch (error) {
                console.error('Error searching messages:', error);
                throw new Error('Failed to search messages');
            }
        },

        // Chat statistics
        getUnreadMessageCount: async (parent, { profileid }, context) => {
            try {
                if (!context.user || context.user.profileid !== profileid) {
                    throw new Error('Unauthorized');
                }

                // Get all chats user participates in
                const chats = await Chat.find({
                    'participants.profileid': profileid,
                    isActive: true
                });

                let unreadCount = 0;
                for (const chat of chats) {
                    const count = await Message.countDocuments({
                        chatid: chat.chatid,
                        senderid: { $ne: profileid },
                        'readBy.profileid': { $ne: profileid },
                        isDeleted: false
                    });
                    unreadCount += count;
                }

                return unreadCount;
            } catch (error) {
                console.error('Error getting unread message count:', error);
                return 0;
            }
        },

        getChatUnreadCount: async (parent, { chatid, profileid }, context) => {
            try {
                if (!context.user || context.user.profileid !== profileid) {
                    throw new Error('Unauthorized');
                }

                // Check if user has access to this chat
                const chat = await Chat.findOne({ chatid, isActive: true });
                if (!chat || !chat.isParticipant(profileid)) {
                    throw new Error('Unauthorized: Cannot access this chat');
                }

                const count = await Message.countDocuments({
                    chatid,
                    senderid: { $ne: profileid },
                    'readBy.profileid': { $ne: profileid },
                    isDeleted: false
                });

                return count;
            } catch (error) {
                console.error('Error getting chat unread count:', error);
                return 0;
            }
        }
    },

    Mutation: {
        // ⚠️ DUPLICATE RESOLVER - COMMENTED OUT
        // This CreateChat resolver is a duplicate of the one in Resolver.js
        // The Resolver.js version is the active one and includes smart userid->profileid conversion
        // Keep this commented out to avoid conflicts
        
        /* CreateChat: async (parent, { participants, chatType, chatName, chatAvatar }, context) => {
            try {
                console.log('🚀 CHAT CREATE: Starting chat creation:......................................', { participants, chatType, chatName, chatAvatar });
                if (!context.user) {
                    throw new Error('Authentication required');
                }

                // Ensure current user is in participants
                if (!participants.includes(context.user.profileid)) {
                    participants.push(context.user.profileid);
                }

                // Validate participants exist
                const validParticipants = await Profile.find({
                    profileid: { $in: participants }
                });

                if (validParticipants.length !== participants.length) {
                    throw new Error('Some participants do not exist');
                }

                // For direct chats, check if chat already exists
                if (chatType === 'direct' && participants.length === 2) {
                    const existingChat = await Chat.findOne({
                        'participants.profileid': { $all: participants, $size: 2 },
                        chatType: 'direct',
                        isActive: true
                    });

                    if (existingChat) {
                        return existingChat;
                    }
                }

                // Create new chat
                const formattedParticipants = participants.map(profileid => ({
                    profileid,
                    role: profileid === context.user.profileid ? 'owner' : 'member',
                    joinedAt: new Date(),
                    permissions: profileid === context.user.profileid ? {
                        canSendMessages: true,
                        canAddMembers: true,
                        canRemoveMembers: true,
                        canEditChat: true,
                        canDeleteMessages: true,
                        canPinMessages: true
                    } : {
                        canSendMessages: true,
                        canAddMembers: false,
                        canRemoveMembers: false,
                        canEditChat: false,
                        canDeleteMessages: false,
                        canPinMessages: false
                    }
                }));
                
                const newChat = new Chat({
                    chatid: uuidv4(),
                    participants: formattedParticipants,
                    chatType,
                    chatName: chatType === 'group' ? chatName || 'New Group' : null,
                    chatAvatar,
                    createdBy: context.user.profileid
                });

                await newChat.save();
                return newChat;
            } catch (error) {
                console.error('Error creating chat:..............', error);
                throw new Error('Failed to create chat');
            }
        }, */

        UpdateChat: async (parent, { chatid, chatName, chatAvatar }, context) => {
            try {
                const chat = await Chat.findOne({ chatid, isActive: true });
                
                if (!chat) {
                    throw new Error('Chat not found');
                }

                // Check if user is admin (for group chats) or participant (for direct chats)
                if (chat.chatType === 'group' && !chat.adminIds.includes(context.user.profileid)) {
                    throw new Error('Unauthorized: Only admins can update group chat');
                }

                if (!chat.isParticipant(context.user.profileid)) {
                    throw new Error('Unauthorized: Not a participant in this chat');
                }

                // Update chat
                if (chatName !== undefined) chat.chatName = chatName;
                if (chatAvatar !== undefined) chat.chatAvatar = chatAvatar;

                await chat.save();
                return chat;
            } catch (error) {
                console.error('Error updating chat:', error);
                throw new Error('Failed to update chat');
            }
        },

        // Message mutations
        SendMessage: async (parent, { chatid, messageType, content, attachments, replyTo, mentions }, context) => {
            try {
                if (!context.user) {
                    throw new Error('Authentication required');
                }

                // Check if user has access to this chat
                const chat = await Chat.findOne({ chatid, isActive: true });
                if (!chat || !chat.isParticipant(context.user.profileid)) {
                    throw new Error('Unauthorized: Cannot send message to this chat');
                }

                // Create new message
                const newMessage = new Message({
                    messageid: uuidv4(),
                    chatid,
                    senderid: context.user.profileid,
                    messageType,
                    content,
                    attachments: attachments || [],
                    replyTo,
                    mentions: mentions || [],
                    messageStatus: 'sent'
                });

                await newMessage.save();

                // Update chat's last message
                chat.lastMessage = newMessage.messageid;
                chat.lastMessageAt = new Date();
                await chat.save();

                return newMessage;
            } catch (error) {
                console.error('Error sending message:', error);
                throw new Error('Failed to send message');
            }
        },

        EditMessage: async (parent, { messageid, content }, context) => {
            try {
                const message = await Message.findOne({ messageid, isDeleted: false });
                
                if (!message) {
                    throw new Error('Message not found');
                }

                if (message.senderid !== context.user.profileid) {
                    throw new Error('Unauthorized: Can only edit your own messages');
                }

                // Store edit history
                message.editHistory.push({
                    content: message.content,
                    editedAt: new Date()
                });

                message.content = content;
                message.isEdited = true;

                await message.save();
                return message;
            } catch (error) {
                console.error('Error editing message:', error);
                throw new Error('Failed to edit message');
            }
        },

        DeleteMessage: async (parent, { messageid }, context) => {
            try {
                const message = await Message.findOne({ messageid, isDeleted: false });
                
                if (!message) {
                    throw new Error('Message not found');
                }

                if (message.senderid !== context.user.profileid) {
                    throw new Error('Unauthorized: Can only delete your own messages');
                }

                message.isDeleted = true;
                message.deletedBy = context.user.profileid;
                message.deletedAt = new Date();

                await message.save();
                return message;
            } catch (error) {
                console.error('Error deleting message:', error);
                throw new Error('Failed to delete message');
            }
        },

        ReactToMessage: async (parent, { messageid, emoji }, context) => {
            try {
                const message = await Message.findOne({ messageid, isDeleted: false });
                
                if (!message) {
                    throw new Error('Message not found');
                }

                // Check if user has access to this chat
                const chat = await Chat.findOne({ chatid: message.chatid });
                if (!chat || !chat.participants.includes(context.user.profileid)) {
                    throw new Error('Unauthorized: Cannot react to this message');
                }

                // Remove existing reaction from this user
                message.reactions = message.reactions.filter(
                    reaction => reaction.profileid !== context.user.profileid
                );

                // Add new reaction
                message.reactions.push({
                    profileid: context.user.profileid,
                    emoji,
                    createdAt: new Date()
                });

                await message.save();
                return message;
            } catch (error) {
                console.error('Error reacting to message:', error);
                throw new Error('Failed to react to message');
            }
        },

        RemoveReaction: async (parent, { messageid, emoji }, context) => {
            try {
                const message = await Message.findOne({ messageid, isDeleted: false });
                
                if (!message) {
                    throw new Error('Message not found');
                }

                // Remove reaction
                message.reactions = message.reactions.filter(
                    reaction => !(reaction.profileid === context.user.profileid && reaction.emoji === emoji)
                );

                await message.save();
                return message;
            } catch (error) {
                console.error('Error removing reaction:', error);
                throw new Error('Failed to remove reaction');
            }
        },

        MarkMessageAsRead: async (parent, { messageid }, context) => {
            try {
                const message = await Message.findOne({ messageid, isDeleted: false });
                
                if (!message) {
                    throw new Error('Message not found');
                }

                // Check if user has access to this chat
                const chat = await Chat.findOne({ chatid: message.chatid });
                if (!chat || !chat.participants.includes(context.user.profileid)) {
                    throw new Error('Unauthorized: Cannot mark this message as read');
                }

                // Check if already marked as read
                const existingRead = message.readBy.find(
                    read => read.profileid === context.user.profileid
                );

                if (!existingRead) {
                    message.readBy.push({
                        profileid: context.user.profileid,
                        readAt: new Date()
                    });
                    await message.save();
                }

                return message;
            } catch (error) {
                console.error('Error marking message as read:', error);
                throw new Error('Failed to mark message as read');
            }
        },

        MarkChatAsRead: async (parent, { chatid }, context) => {
            try {
                // Check if user has access to this chat
                const chat = await Chat.findOne({ chatid, isActive: true });
                if (!chat || !chat.participants.includes(context.user.profileid)) {
                    throw new Error('Unauthorized: Cannot access this chat');
                }

                // Find unread messages
                const unreadMessages = await Message.find({
                    chatid,
                    senderid: { $ne: context.user.profileid },
                    'readBy.profileid': { $ne: context.user.profileid },
                    isDeleted: false
                });

                // Mark all as read
                const bulkOps = unreadMessages.map(message => ({
                    updateOne: {
                        filter: { _id: message._id },
                        update: {
                            $push: {
                                readBy: {
                                    profileid: context.user.profileid,
                                    readAt: new Date()
                                }
                            }
                        }
                    }
                }));

                if (bulkOps.length > 0) {
                    await Message.bulkWrite(bulkOps);
                }

                return unreadMessages;
            } catch (error) {
                console.error('Error marking chat as read:', error);
                throw new Error('Failed to mark chat as read');
            }
        }
    }
};

export default ChatResolvers;
