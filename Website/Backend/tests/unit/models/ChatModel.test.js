import mongoose from 'mongoose';
import Chat from '../../../Models/FeedModels/Chat.js';
import Profile from '../../../Models/FeedModels/Profile.js';

describe('Chat Model', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/swaggo_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    await Chat.deleteMany({});
    await Profile.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Chat Creation', () => {
    it('should create a direct chat with correct participants', async () => {
      // Create test profiles
      const profile1 = await Profile.create({
        profileid: 'user1',
        username: 'testuser1',
        email: 'test1@example.com'
      });

      const profile2 = await Profile.create({
        profileid: 'user2',
        username: 'testuser2',
        email: 'test2@example.com'
      });

      // Create direct chat
      const chat = await Chat.createDirectChat('user1', 'user2');

      expect(chat).toBeDefined();
      expect(chat.chatType).toBe('direct');
      expect(chat.participants).toHaveLength(2);
      expect(chat.participants[0].profileid).toBe('user1');
      expect(chat.participants[1].profileid).toBe('user2');
    });

    it('should create a group chat with correct participants', async () => {
      // Create test profiles
      const creator = await Profile.create({
        profileid: 'creator',
        username: 'creator',
        email: 'creator@example.com'
      });

      const member1 = await Profile.create({
        profileid: 'member1',
        username: 'member1',
        email: 'member1@example.com'
      });

      const member2 = await Profile.create({
        profileid: 'member2',
        username: 'member2',
        email: 'member2@example.com'
      });

      // Create group chat
      const chat = await Chat.createGroupChat('Test Group', 'creator', ['member1', 'member2']);

      expect(chat).toBeDefined();
      expect(chat.chatType).toBe('group');
      expect(chat.chatName).toBe('Test Group');
      expect(chat.participants).toHaveLength(3);
      expect(chat.participants[0].profileid).toBe('creator');
      expect(chat.participants[0].role).toBe('owner');
      expect(chat.participants[1].profileid).toBe('member1');
      expect(chat.participants[2].profileid).toBe('member2');
    });
  });

  describe('Participant Management', () => {
    let chat;
    let profile1, profile2, profile3;

    beforeEach(async () => {
      // Create test profiles
      profile1 = await Profile.create({
        profileid: 'user1',
        username: 'testuser1',
        email: 'test1@example.com'
      });

      profile2 = await Profile.create({
        profileid: 'user2',
        username: 'testuser2',
        email: 'test2@example.com'
      });

      profile3 = await Profile.create({
        profileid: 'user3',
        username: 'testuser3',
        email: 'test3@example.com'
      });

      // Create chat
      chat = await Chat.create({
        chatid: 'test-chat',
        participants: [
          {
            profileid: 'user1',
            role: 'member',
            permissions: {
              canSendMessages: true,
              canAddMembers: false,
              canRemoveMembers: false,
              canEditChat: false,
              canDeleteMessages: false,
              canPinMessages: false
            }
          },
          {
            profileid: 'user2',
            role: 'member',
            permissions: {
              canSendMessages: true,
              canAddMembers: false,
              canRemoveMembers: false,
              canEditChat: false,
              canDeleteMessages: false,
              canPinMessages: false
            }
          }
        ],
        chatType: 'direct',
        createdBy: 'user1'
      });
    });

    it('should correctly identify participants', () => {
      expect(chat.isParticipant('user1')).toBe(true);
      expect(chat.isParticipant('user2')).toBe(true);
      expect(chat.isParticipant('user3')).toBe(false);
    });

    it('should correctly get participant details', () => {
      const participant = chat.getParticipant('user1');
      expect(participant).toBeDefined();
      expect(participant.profileid).toBe('user1');
      expect(participant.role).toBe('member');
    });

    it('should add new participant', async () => {
      await chat.addParticipant('user3', 'member', 'user1');
      expect(chat.isParticipant('user3')).toBe(true);
      expect(chat.participants).toHaveLength(3);
    });

    it('should remove participant', async () => {
      await chat.removeParticipant('user2', 'user1');
      expect(chat.isParticipant('user2')).toBe(false);
      expect(chat.participants).toHaveLength(1);
    });
  });

  describe('Permission Management', () => {
    let chat;

    beforeEach(async () => {
      chat = await Chat.create({
        chatid: 'permission-test-chat',
        participants: [
          {
            profileid: 'owner',
            role: 'owner',
            permissions: {
              canSendMessages: true,
              canAddMembers: true,
              canRemoveMembers: true,
              canEditChat: true,
              canDeleteMessages: true,
              canPinMessages: true
            }
          },
          {
            profileid: 'member',
            role: 'member',
            permissions: {
              canSendMessages: true,
              canAddMembers: false,
              canRemoveMembers: false,
              canEditChat: false,
              canDeleteMessages: false,
              canPinMessages: false
            }
          }
        ],
        chatType: 'group',
        createdBy: 'owner'
      });
    });

    it('should correctly check permissions for owner', () => {
      expect(chat.canSendMessage('owner')).toBe(true);
      expect(chat.canAddMembers('owner')).toBe(true);
      expect(chat.canRemoveMembers('owner')).toBe(true);
      expect(chat.canEditChat('owner')).toBe(true);
      expect(chat.canDeleteMessages('owner')).toBe(true);
      expect(chat.canPinMessages('owner')).toBe(true);
    });

    it('should correctly check permissions for member', () => {
      expect(chat.canSendMessage('member')).toBe(true);
      expect(chat.canAddMembers('member')).toBe(false);
      expect(chat.canRemoveMembers('member')).toBe(false);
      expect(chat.canEditChat('member')).toBe(false);
      expect(chat.canDeleteMessages('member')).toBe(false);
      expect(chat.canPinMessages('member')).toBe(false);
    });
  });
});