import SocketController from '../../../Controllers/SocketController.js';
import Chat from '../../../Models/FeedModels/Chat.js';
import Message from '../../../Models/FeedModels/Message.js';
import Profile from '../../../Models/FeedModels/Profile.js';

// Mock Socket.IO
const mockIo = {
  on: jest.fn(),
  emit: jest.fn(),
  to: jest.fn().mockReturnThis(),
  sockets: {
    adapter: {
      rooms: new Map(),
      sids: new Map()
    },
    sockets: new Map()
  }
};

// Mock socket
const mockSocket = {
  id: 'test-socket-id',
  user: {
    profileid: 'test-user',
    username: 'testuser'
  },
  join: jest.fn(),
  leave: jest.fn(),
  emit: jest.fn(),
  on: jest.fn(),
  to: jest.fn().mockReturnThis(),
  connected: true
};

describe('SocketController', () => {
  let socketController;

  beforeEach(() => {
    socketController = new SocketController(mockIo);
    jest.clearAllMocks();
  });

  describe('Message Handling', () => {
    it('should handle send_message event', async () => {
      const mockData = {
        chatid: 'test-chat',
        clientMessageId: 'client-msg-1',
        messageType: 'text',
        content: 'Test message'
      };

      const mockCallback = jest.fn();

      // Mock database calls
      Chat.findOne = jest.fn().mockResolvedValue({
        chatid: 'test-chat',
        participants: [{ profileid: 'test-user' }, { profileid: 'other-user' }],
        isParticipant: jest.fn().mockReturnValue(true),
        canSendMessage: jest.fn().mockReturnValue(true)
      });

      Message.findOneAndUpdate = jest.fn().mockResolvedValue({
        messageid: 'server-msg-1',
        createdAt: new Date()
      });

      await socketController.handleSendMessage(mockSocket, mockData, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        success: true,
        clientMessageId: 'client-msg-1',
        messageid: 'server-msg-1',
        timestamp: expect.any(String),
        duplicate: false
      });
    });

    it('should handle typing_start event', () => {
      const chatid = 'test-chat';
      socketController.handleTypingStart(mockSocket, chatid);
      
      expect(mockSocket.to).toHaveBeenCalledWith(chatid);
      expect(mockSocket.emit).toHaveBeenCalledWith('user_typing', {
        profileid: 'test-user',
        username: 'testuser',
        isTyping: true
      });
    });

    it('should handle typing_stop event', () => {
      const chatid = 'test-chat';
      socketController.handleTypingStop(mockSocket, chatid);
      
      expect(mockSocket.to).toHaveBeenCalledWith(chatid);
      expect(mockSocket.emit).toHaveBeenCalledWith('user_typing', {
        profileid: 'test-user',
        username: 'testuser',
        isTyping: false
      });
    });

    it('should handle message reactions', async () => {
      const mockData = {
        messageid: 'test-message',
        emoji: '👍',
        chatid: 'test-chat'
      };

      // Mock database calls
      Message.findOne = jest.fn().mockResolvedValue({
        messageid: 'test-message',
        reactions: [],
        save: jest.fn().mockResolvedValue(true)
      });

      await socketController.handleReactToMessage(mockSocket, mockData);

      expect(mockSocket.to).toHaveBeenCalledWith('test-chat');
      expect(mockSocket.emit).toHaveBeenCalledWith('message_reaction', {
        messageid: 'test-message',
        chatid: 'test-chat',
        action: 'added',
        reaction: {
          profileid: 'test-user',
          username: 'testuser',
          emoji: '👍',
          createdAt: expect.any(String)
        },
        allReactions: []
      });
    });

    it('should handle message editing', async () => {
      const mockData = {
        messageid: 'test-message',
        content: 'Edited content',
        chatid: 'test-chat'
      };

      // Mock database calls
      Message.findOne = jest.fn().mockResolvedValue({
        messageid: 'test-message',
        content: 'Original content',
        editHistory: [],
        isEdited: false,
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true)
      });

      await socketController.handleEditMessage(mockSocket, mockData);

      expect(mockSocket.to).toHaveBeenCalledWith('test-chat');
      expect(mockSocket.emit).toHaveBeenCalledWith('message_edited', {
        messageid: 'test-message',
        chatid: 'test-chat',
        content: 'Edited content',
        isEdited: true,
        editHistory: [],
        updatedAt: expect.any(String)
      });
    });

    it('should handle message deletion', async () => {
      const mockData = {
        messageid: 'test-message',
        chatid: 'test-chat',
        deleteForEveryone: true
      };

      // Mock database calls
      Message.findOne = jest.fn().mockResolvedValue({
        messageid: 'test-message',
        senderid: 'test-user',
        isDeleted: false,
        deletedBy: null,
        deletedAt: null,
        save: jest.fn().mockResolvedValue(true)
      });

      await socketController.handleDeleteMessage(mockSocket, mockData);

      expect(mockSocket.to).toHaveBeenCalledWith('test-chat');
      expect(mockSocket.emit).toHaveBeenCalledWith('message_deleted', {
        messageid: 'test-message',
        chatid: 'test-chat',
        isDeleted: true,
        deletedBy: 'test-user',
        deletedAt: expect.any(String),
        deleteForEveryone: true
      });
    });
  });

  describe('Chat Room Management', () => {
    it('should handle join_chat event', async () => {
      const chatid = 'test-chat';

      // Mock database calls
      Chat.findOne = jest.fn().mockResolvedValue({
        chatid: 'test-chat',
        participants: [{ profileid: 'test-user' }],
        isParticipant: jest.fn().mockReturnValue(true),
        getParticipant: jest.fn().mockReturnValue({ profileid: 'test-user', role: 'member' })
      });

      await socketController.handleJoinChat(mockSocket, chatid);

      expect(mockSocket.join).toHaveBeenCalledWith(chatid);
      expect(mockSocket.emit).toHaveBeenCalledWith('chat_joined', {
        chatid: 'test-chat',
        role: 'member',
        permissions: {},
        chatInfo: {
          chatName: undefined,
          chatType: undefined,
          participantCount: undefined,
          settings: undefined
        },
        verified: true,
        timestamp: expect.any(String)
      });
    });

    it('should handle leave_chat event', () => {
      const chatid = 'test-chat';
      socketController.handleLeaveChat(mockSocket, chatid);

      expect(mockSocket.leave).toHaveBeenCalledWith(chatid);
      expect(mockSocket.to).toHaveBeenCalledWith(chatid);
      expect(mockSocket.emit).toHaveBeenCalledWith('user_left', {
        profileid: 'test-user',
        username: 'testuser'
      });
    });
  });

  describe('Call Handling', () => {
    it('should handle initiate_call event', async () => {
      const mockData = {
        chatid: 'test-chat',
        callType: 'voice',
        receiverId: 'receiver-user'
      };

      const mockCallback = jest.fn();

      // Mock database calls
      Chat.findOne = jest.fn().mockResolvedValue({
        chatid: 'test-chat',
        participants: [{ profileid: 'test-user' }, { profileid: 'receiver-user' }],
        isParticipant: jest.fn().mockReturnValue(true)
      });

      await socketController.handleInitiateCall(mockSocket, mockData, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        success: true,
        callId: expect.any(String),
        status: 'ringing',
        message: 'Call initiated successfully'
      });
    });

    it('should handle answer_call event', async () => {
      const mockData = {
        callId: 'test-call'
      };

      // Mock active call
      socketController.activeCalls.set('test-call', {
        callId: 'test-call',
        callerId: 'caller-user',
        receiverId: 'test-user',
        callerSocket: 'caller-socket',
        status: 'ringing'
      });

      // Mock database calls
      const mockCallLog = {
        callId: 'test-call',
        updateStatus: jest.fn().mockResolvedValue(true)
      };
      jest.mock('../../../Models/FeedModels/CallLog.js', () => ({
        findOne: jest.fn().mockResolvedValue(mockCallLog)
      }));

      await socketController.handleAnswerCall(mockSocket, mockData);

      expect(mockSocket.to).toHaveBeenCalledWith('caller-socket');
      expect(mockSocket.emit).toHaveBeenCalledWith('call_answer', {
        callId: 'test-call',
        accepted: true,
        answerer: {
          profileid: 'test-user',
          username: 'testuser'
        }
      });
    });

    it('should handle end_call event', async () => {
      const mockData = {
        callId: 'test-call',
        reason: 'normal'
      };

      // Mock active call
      socketController.activeCalls.set('test-call', {
        callId: 'test-call',
        callerId: 'caller-user',
        receiverId: 'receiver-user',
        callerSocket: 'caller-socket',
        receiverSocket: 'receiver-socket',
        answeredAt: new Date(),
        status: 'answered'
      });

      // Mock database calls
      const mockCallLog = {
        callId: 'test-call',
        updateStatus: jest.fn().mockResolvedValue(true)
      };
      jest.mock('../../../Models/FeedModels/CallLog.js', () => ({
        findOne: jest.fn().mockResolvedValue(mockCallLog)
      }));

      await socketController.handleEndCall(mockSocket, mockData);

      expect(mockSocket.to).toHaveBeenCalledWith('receiver-socket');
      expect(mockSocket.emit).toHaveBeenCalledWith('end_call', {
        callId: 'test-call',
        reason: 'normal'
      });
    });
  });
});
