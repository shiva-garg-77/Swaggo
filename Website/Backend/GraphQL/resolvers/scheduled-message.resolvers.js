import ScheduledMessage from "../../Models/FeedModels/ScheduledMessage.js";
import ScheduledMessageService from "../../Services/Messaging/ScheduledMessageService.js";
// 🔐 ENHANCED GRAPHQL SECURITY: Import enhanced GraphQL security service
import enhancedGraphQLSecurityService from '../services/EnhancedGraphQLSecurityService.js';

// Custom error classes
class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class UserInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserInputError';
  }
}

const ScheduledMessageResolvers = {
  Query: {
    // Get scheduled messages for a chat
    getScheduledMessagesByChat: async (_, { chatId, limit, offset }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in to view scheduled messages');
      }

      try {
        return await ScheduledMessageService.getScheduledMessagesByChat(chatId, { limit, offset });
      } catch (error) {
        throw new Error(`Failed to fetch scheduled messages: ${error.message}`);
      }
    },

    // Get scheduled messages for current user
    getScheduledMessagesByUser: async (_, { profileid, limit, offset }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in to view scheduled messages');
      }

      try {
        // Check if user is requesting their own messages
        if (profileid !== user.profileid) {
          throw new AuthenticationError('You do not have permission to view these scheduled messages');
        }
        
        return await ScheduledMessageService.getScheduledMessagesByUser(profileid, { limit, offset });
      } catch (error) {
        throw new Error(`Failed to fetch scheduled messages: ${error.message}`);
      }
    }
  },

  Mutation: {
    // Create a new scheduled message
    createScheduledMessage: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in to schedule messages');
      }

      try {
        const scheduledMessageData = {
          ...input,
          senderid: user.profileid
        };

        const scheduledMessage = await ScheduledMessageService.createScheduledMessage(scheduledMessageData);
        return scheduledMessage;
      } catch (error) {
        throw new Error(`Failed to create scheduled message: ${error.message}`);
      }
    },

    // Cancel a scheduled message
    cancelScheduledMessage: async (_, { scheduledMessageId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in to cancel scheduled messages');
      }

      try {
        const scheduledMessage = await ScheduledMessage.findOne({ scheduledMessageId });
        if (!scheduledMessage) {
          throw new UserInputError('Scheduled message not found');
        }

        // Check if user has permission to cancel this message
        if (scheduledMessage.senderid !== user.profileid) {
          throw new AuthenticationError('You do not have permission to cancel this scheduled message');
        }

        const cancelledMessage = await ScheduledMessageService.cancelScheduledMessage(scheduledMessageId);
        return cancelledMessage;
      } catch (error) {
        throw new Error(`Failed to cancel scheduled message: ${error.message}`);
      }
    },

    // Update a scheduled message
    updateScheduledMessage: async (_, { scheduledMessageId, input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in to update scheduled messages');
      }

      try {
        const scheduledMessage = await ScheduledMessage.findOne({ scheduledMessageId });
        if (!scheduledMessage) {
          throw new UserInputError('Scheduled message not found');
        }

        // Check if user has permission to update this message
        if (scheduledMessage.senderid !== user.profileid) {
          throw new AuthenticationError('You do not have permission to update this scheduled message');
        }

        // Update the scheduled message
        Object.assign(scheduledMessage, input);
        await scheduledMessage.save();

        return scheduledMessage;
      } catch (error) {
        throw new Error(`Failed to update scheduled message: ${error.message}`);
      }
    }
  },

  ScheduledMessage: {
    // Resolve chat reference
    chat: async (scheduledMessage) => {
      try {
        // Assuming there's a Chat model that can be imported
        const Chat = (await import("../../Models/FeedModels/Chat.js")).default;
        return await Chat.findById(scheduledMessage.chatid);
      } catch (error) {
        return null;
      }
    },

    // Resolve sender reference
    sender: async (scheduledMessage) => {
      try {
        // Assuming there's a Profile model that can be imported
        const Profile = (await import("../../Models/FeedModels/Profile.js")).default;
        return await Profile.findById(scheduledMessage.senderid);
      } catch (error) {
        return null;
      }
    }
  }
};

export default ScheduledMessageResolvers;