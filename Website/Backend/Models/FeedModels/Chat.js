/**
 * @fileoverview Mongoose model for chat conversations
 * @module Chat
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * This model represents chat conversations in the Swaggo application.
 * It supports different chat types (direct, group, broadcast, channel)
 * and includes participant management, permissions, and settings.
 * 
 * Key features:
 * - Participant roles and permissions
 * - Chat settings and configurations
 * - Message tracking and unread counts
 * - Archive and mute functionality
 * - Performance optimized with multiple indexes
 */

import mongoose from "mongoose";
import XSSSanitizer from '../../Utils/XSSSanitizer.js';

/**
 * @typedef {Object} ParticipantPermission
 * @property {boolean} canSendMessages - Whether participant can send messages
 * @property {boolean} canAddMembers - Whether participant can add members
 * @property {boolean} canRemoveMembers - Whether participant can remove members
 * @property {boolean} canEditChat - Whether participant can edit chat settings
 * @property {boolean} canDeleteMessages - Whether participant can delete messages
 * @property {boolean} canPinMessages - Whether participant can pin messages
 */

/**
 * @typedef {Object} Participant
 * @property {string} profileid - Profile ID of the participant
 * @property {string} role - Role of the participant (owner, admin, moderator, member, guest)
 * @property {Date} joinedAt - When the participant joined the chat
 * @property {ParticipantPermission} permissions - Permissions for this participant
 * @property {number} unreadCount - Unread message count for this participant
 * @property {Date} lastReadAt - When the participant last read messages
 */

/**
 * @typedef {Object} ChatSetting
 * @property {boolean} onlyAdminsCanSend - Whether only admins can send messages
 * @property {boolean} onlyAdminsCanAddMembers - Whether only admins can add members
 * @property {boolean} allowMemberInvites - Whether members can invite others
 * @property {boolean} messageHistoryVisible - Whether message history is visible
 * @property {number} autoDeleteMessages - Auto-delete messages after time (0 = never)
 * @property {number} maxMembers - Maximum number of members allowed
 */

const ChatSchema = new mongoose.Schema({
    /**
     * Unique identifier for the chat
     * @type {string}
     */
    chatid: { type: String, required: true, unique: true },
    
    /**
     * List of participants in the chat
     * @type {Participant[]}
     */
    participants: [{
        profileid: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ['owner', 'admin', 'moderator', 'member', 'guest'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        permissions: {
            canSendMessages: { type: Boolean, default: true },
            canAddMembers: { type: Boolean, default: false },
            canRemoveMembers: { type: Boolean, default: false },
            canEditChat: { type: Boolean, default: false },
            canDeleteMessages: { type: Boolean, default: false },
            canPinMessages: { type: Boolean, default: false }
        },
        // 🔧 FIX: Per-participant unread count (Issue #16)
        unreadCount: {
            type: Number,
            default: 0
        },
        lastReadAt: {
            type: Date,
            default: null
        }
    }],
    
    /**
     * Type of chat
     * @type {string}
     * @default 'direct'
     */
    chatType: { 
        type: String, 
        enum: ['direct', 'group', 'broadcast', 'channel'], 
        default: 'direct' 
    },
    
    /**
     * Name of the chat (for group chats)
     * @type {string}
     */
    chatName: { 
        type: String,
        default: function() {
            return this.chatType === 'group' ? 'New Group' : null;
        }
    },
    
    /**
     * Avatar URL for the chat
     * @type {string}
     */
    chatAvatar: { 
        type: String,
        default:' https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png'
    },
    
    /**
     * ID of the last message in the chat
     * @type {string}
     */
    lastMessage: {
        type: String
    },
    
    /**
     * Timestamp of the last message
     * @type {Date}
     */
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    
    /**
     * Whether the chat is active
     * @type {boolean}
     */
    isActive: {
        type: Boolean,
        default: true
    },
    
    /**
     * List of profile IDs who have muted this chat
     * @type {string[]}
     */
    mutedBy: [{ 
        type: String
    }],
    
    /**
     * Profile ID of the chat creator
     * @type {string}
     */
    createdBy: {
        type: String,
        required: true
    },
    
    /**
     * List of profile IDs with admin privileges
     * @type {string[]}
     */
    adminIds: [{
        type: String
    }],
    
    /**
     * Chat settings and configurations
     * @type {ChatSetting}
     */
    chatSettings: {
        onlyAdminsCanSend: { type: Boolean, default: false },
        onlyAdminsCanAddMembers: { type: Boolean, default: false },
        allowMemberInvites: { type: Boolean, default: true },
        messageHistoryVisible: { type: Boolean, default: true },
        autoDeleteMessages: { type: Number, default: 0 }, // 0 = never, time in ms
        maxMembers: { type: Number, default: 256 }
    },
    
    /**
     * Whether the chat is archived
     * @type {boolean}
     */
    isArchived: {
        type: Boolean,
        default: false
    },
    
    /**
     * List of profile IDs who archived this chat
     * @type {string[]}
     */
    archivedBy: [{
        type: String
    }],
    
    // Add unreadCount field for Issue #16
    /**
     * Total unread message count for the chat
     * @type {number}
     */
    unreadCount: {
        type: Number,
        default: 0
    },
    
    // 🔧 SOFT DELETE #115: Add isDeleted field for soft delete functionality
    /**
     * Whether the chat is deleted (soft delete)
     * @type {boolean}
     */
    isDeleted: {
        type: Boolean,
        default: false
    },
    
    /**
     * Timestamp when the chat was deleted
     * @type {Date}
     */
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Pre-save middleware to sanitize chat content and prevent XSS attacks
ChatSchema.pre('save', function(next) {
  // Sanitize chat name
  if (this.chatName && typeof this.chatName === 'string') {
    this.chatName = XSSSanitizer.sanitizeChatName(this.chatName);
  }
  
  // Sanitize chat avatar URL
  if (this.chatAvatar && typeof this.chatAvatar === 'string') {
    this.chatAvatar = XSSSanitizer.sanitizeURL(this.chatAvatar);
  }
  
  next();
});

// Indexes for better performance
ChatSchema.index({ 'participants.profileid': 1 });
ChatSchema.index({ lastMessageAt: -1 });
ChatSchema.index({ chatType: 1 });
ChatSchema.index({ isActive: 1 });
ChatSchema.index({ isArchived: 1 });
// Add index for better query performance on participants
ChatSchema.index({ 'participants.profileid': 1, isActive: 1 });
// chatid index is automatically created due to unique: true

// 🔧 NEW: Additional indexes for critical queries
ChatSchema.index({ createdBy: 1, createdAt: -1 }); // For user-created chats
ChatSchema.index({ 'participants.profileid': 1, lastMessageAt: -1 }); // For participant chat lists
ChatSchema.index({ chatType: 1, isActive: 1 }); // For chat type filtering
ChatSchema.index({ 'adminIds': 1 }); // For admin queries
ChatSchema.index({ 'mutedBy': 1 }); // For muted chat queries
ChatSchema.index({ unreadCount: -1 }); // For unread count sorting
ChatSchema.index({ 'participants.profileid': 1, 'participants.unreadCount': -1 }); // For participant unread counts

// 🔧 OPTIMIZATION #76: Add indexes on foreign keys
ChatSchema.index({ 'participants.profileid': 1, 'chatType': 1, 'isActive': 1 }); // Optimized for participant queries
ChatSchema.index({ 'createdBy': 1, 'isActive': 1 }); // For user-created active chats
ChatSchema.index({ 'lastMessageAt': -1, 'isActive': 1 }); // For active chat sorting

// 🔧 SOFT DELETE #115: Add indexes for soft delete queries
ChatSchema.index({ isDeleted: 1 }); // For soft delete queries
ChatSchema.index({ 'participants.profileid': 1, isDeleted: 1 }); // For participant queries with soft delete
ChatSchema.index({ createdBy: 1, isDeleted: 1 }); // For user-created chats with soft delete

// Instance Methods for Authorization
ChatSchema.methods.getParticipant = function(profileId) {
    return this.participants.find(p => p.profileid === profileId);
};

ChatSchema.methods.isParticipant = function(profileId) {
    return this.participants.some(p => p.profileid === profileId);
};

ChatSchema.methods.hasRole = function(profileId, role) {
    const participant = this.getParticipant(profileId);
    return participant && participant.role === role;
};

ChatSchema.methods.hasPermission = function(profileId, permission) {
    const participant = this.getParticipant(profileId);
    if (!participant) return false;
    
    // Owner and admin have all permissions
    if (participant.role === 'owner' || participant.role === 'admin') {
        return true;
    }
    
    // Check specific permission
    return participant.permissions && participant.permissions[permission] === true;
};

ChatSchema.methods.canSendMessage = function(profileId) {
    if (!this.isActive || !this.isParticipant(profileId)) return false;
    
    // Check if only admins can send
    if (this.chatSettings?.onlyAdminsCanSend) {
        return this.hasRole(profileId, 'owner') || this.hasRole(profileId, 'admin');
    }
    
    return this.hasPermission(profileId, 'canSendMessages');
};

ChatSchema.methods.canAddMembers = function(profileId) {
    if (!this.isParticipant(profileId)) return false;
    
    // Check chat settings
    if (this.chatSettings?.onlyAdminsCanAddMembers) {
        return this.hasRole(profileId, 'owner') || this.hasRole(profileId, 'admin');
    }
    
    return this.hasPermission(profileId, 'canAddMembers');
};

ChatSchema.methods.canRemoveMembers = function(profileId) {
    return this.hasPermission(profileId, 'canRemoveMembers');
};

ChatSchema.methods.canEditChat = function(profileId) {
    return this.hasPermission(profileId, 'canEditChat');
};

ChatSchema.methods.canDeleteMessages = function(profileId) {
    return this.hasPermission(profileId, 'canDeleteMessages');
};

ChatSchema.methods.canPinMessages = function(profileId) {
    return this.hasPermission(profileId, 'canPinMessages');
};

// Normalize participants to handle both string and object formats (for legacy compatibility)
ChatSchema.methods.normalizeParticipants = function() {
    // If participants are already objects, return as-is
    if (this.participants.length > 0 && typeof this.participants[0] === 'object' && this.participants[0].profileid) {
        return this.participants;
    }
    
    // If participants are strings, convert to objects
    if (this.participants.length > 0 && typeof this.participants[0] === 'string') {
        return this.participants.map(profileid => ({
            profileid,
            role: 'member',
            joinedAt: this.createdAt || new Date(),
            permissions: this.getDefaultPermissions('member')
        }));
    }
    
    return this.participants;
};

// Get participant IDs as strings for easier filtering
ChatSchema.methods.getParticipantIds = function() {
    return this.normalizeParticipants().map(p => 
        typeof p === 'string' ? p : p.profileid
    );
};

ChatSchema.methods.addParticipant = function(profileId, role = 'member', addedBy) {
    if (this.isParticipant(profileId)) {
        throw new Error('User is already a participant');
    }
    
    if (!this.canAddMembers(addedBy)) {
        throw new Error('Insufficient permissions to add members');
    }
    
    const permissions = this.getDefaultPermissions(role);
    
    this.participants.push({
        profileid: profileId,
        role,
        joinedAt: new Date(),
        permissions
    });
    
    return this.save();
};

ChatSchema.methods.removeParticipant = function(profileId, removedBy) {
    if (!this.canRemoveMembers(removedBy)) {
        throw new Error('Insufficient permissions to remove members');
    }
    
    this.participants = this.participants.filter(p => p.profileid !== profileId);
    return this.save();
};

ChatSchema.methods.updateParticipantRole = function(profileId, newRole, updatedBy) {
    if (!this.hasRole(updatedBy, 'owner') && !this.hasRole(updatedBy, 'admin')) {
        throw new Error('Insufficient permissions to update roles');
    }
    
    const participant = this.getParticipant(profileId);
    if (!participant) {
        throw new Error('User is not a participant');
    }
    
    participant.role = newRole;
    participant.permissions = this.getDefaultPermissions(newRole);
    
    return this.save();
};

ChatSchema.methods.getDefaultPermissions = function(role) {
    const permissionSets = {
        owner: {
            canSendMessages: true,
            canAddMembers: true,
            canRemoveMembers: true,
            canEditChat: true,
            canDeleteMessages: true,
            canPinMessages: true
        },
        admin: {
            canSendMessages: true,
            canAddMembers: true,
            canRemoveMembers: true,
            canEditChat: true,
            canDeleteMessages: true,
            canPinMessages: true
        },
        moderator: {
            canSendMessages: true,
            canAddMembers: false,
            canRemoveMembers: true,
            canEditChat: false,
            canDeleteMessages: true,
            canPinMessages: true
        },
        member: {
            canSendMessages: true,
            canAddMembers: false,
            canRemoveMembers: false,
            canEditChat: false,
            canDeleteMessages: false,
            canPinMessages: false
        },
        guest: {
            canSendMessages: true,
            canAddMembers: false,
            canRemoveMembers: false,
            canEditChat: false,
            canDeleteMessages: false,
            canPinMessages: false
        }
    };
    
    return permissionSets[role] || permissionSets.member;
};

// Static Methods
ChatSchema.statics.findByParticipant = function(profileId) {
    return this.find({ 
        'participants.profileid': profileId, 
        isActive: true,
        isDeleted: false  // 🔧 SOFT DELETE #115: Exclude deleted chats
    }).populate('participants.profileid', 'username profilePic');
};

// 🔧 SOFT DELETE #115: Add method to soft delete a chat
ChatSchema.methods.softDelete = function(deletedByProfileId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    // Remove the chat from participants' muted and archived lists
    this.mutedBy = this.mutedBy.filter(id => id !== deletedByProfileId);
    this.archivedBy = this.archivedBy.filter(id => id !== deletedByProfileId);
    return this.save();
};

// 🔧 SOFT DELETE #115: Add method to restore a soft deleted chat
ChatSchema.methods.restore = function() {
    this.isDeleted = false;
    this.deletedAt = null;
    return this.save();
};

// 🔧 SOFT DELETE #115: Add static method to find deleted chats
ChatSchema.statics.findDeleted = function() {
    return this.find({ isDeleted: true });
};

// 🔧 SOFT DELETE #115: Add static method to find active (non-deleted) chats
ChatSchema.statics.findActive = function() {
    return this.find({ 
        isActive: true,
        isDeleted: false
    });
};

// Data migration method to convert string participants to objects
ChatSchema.statics.migrateStringParticipants = async function() {
    console.log('🔄 Starting migration of string participants to objects...');
    
    try {
        const chatsWithStringParticipants = await this.find({
            participants: { $type: 'string' }
        });
        
        console.log(`🔍 Found ${chatsWithStringParticipants.length} chats with string participants`);
        
        let migratedCount = 0;
        
        for (const chat of chatsWithStringParticipants) {
            try {
                // Convert string participants to object format
                const objectParticipants = chat.participants.map(profileid => {
                    if (typeof profileid === 'string') {
                        return {
                            profileid,
                            role: profileid === chat.createdBy ? 'owner' : 'member',
                            joinedAt: chat.createdAt || new Date(),
                            permissions: this.prototype.getDefaultPermissions(
                                profileid === chat.createdBy ? 'owner' : 'member'
                            )
                        };
                    }
                    return profileid; // Already an object
                });
                
                // Update the chat with object participants
                await this.updateOne(
                    { _id: chat._id },
                    { participants: objectParticipants }
                );
                
                migratedCount++;
                console.log(`✅ Migrated chat ${chat.chatid} (${migratedCount}/${chatsWithStringParticipants.length})`);
                
            } catch (chatError) {
                console.error(`❌ Error migrating chat ${chat.chatid}:`, chatError);
            }
        }
        
        console.log(`✅ Migration completed: ${migratedCount}/${chatsWithStringParticipants.length} chats migrated`);
        return { success: true, migratedCount, totalFound: chatsWithStringParticipants.length };
        
    } catch (error) {
        console.error('❌ Error during participant migration:', error);
        return { success: false, error: error.message };
    }
};

ChatSchema.statics.createDirectChat = function(profileId1, profileId2) {
    const chatid = `direct_${[profileId1, profileId2].sort().join('_')}`;
    
    return this.create({
        chatid,
        participants: [
            { 
                profileid: profileId1, 
                role: 'member',
                permissions: this.prototype.getDefaultPermissions('member')
            },
            { 
                profileid: profileId2, 
                role: 'member',
                permissions: this.prototype.getDefaultPermissions('member')
            }
        ],
        chatType: 'direct',
        createdBy: profileId1,
        isActive: true,
        isDeleted: false  // 🔧 SOFT DELETE #115: Initialize as not deleted
    });
};

ChatSchema.statics.createGroupChat = function(name, creatorId, initialMembers = []) {
    const chatid = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const participants = [
        {
            profileid: creatorId,
            role: 'owner',
            permissions: this.prototype.getDefaultPermissions('owner')
        }
    ];
    
    // Add initial members
    initialMembers.forEach(memberId => {
        if (memberId !== creatorId) {
            participants.push({
                profileid: memberId,
                role: 'member',
                permissions: this.prototype.getDefaultPermissions('member')
            });
        }
    });
    
    return this.create({
        chatid,
        chatName: name,
        participants,
        chatType: 'group',
        createdBy: creatorId,
        isActive: true,
        isDeleted: false  // 🔧 SOFT DELETE #115: Initialize as not deleted
    });
};

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);

// 🔧 MODEL RELATIONSHIPS #117: Add virtual populate fields for easier relationship access
// Virtual populate for participants profiles
ChatSchema.virtual('participantProfiles', {
  ref: 'Profile',
  localField: 'participants.profileid',
  foreignField: 'profileid'
});

// Virtual populate for creator profile
ChatSchema.virtual('creatorProfile', {
  ref: 'Profile',
  localField: 'createdBy',
  foreignField: 'profileid',
  justOne: true
});

// Virtual populate for admin profiles
ChatSchema.virtual('adminProfiles', {
  ref: 'Profile',
  localField: 'adminIds',
  foreignField: 'profileid'
});

// Virtual populate for muted profiles
ChatSchema.virtual('mutedProfiles', {
  ref: 'Profile',
  localField: 'mutedBy',
  foreignField: 'profileid'
});

// Virtual populate for archived profiles
ChatSchema.virtual('archivedProfiles', {
  ref: 'Profile',
  localField: 'archivedBy',
  foreignField: 'profileid'
});

// Virtual populate for last message
ChatSchema.virtual('lastMessageDoc', {
  ref: 'Message',
  localField: 'lastMessage',
  foreignField: 'messageid',
  justOne: true
});

// Ensure virtual fields are serialized
ChatSchema.set('toJSON', { virtuals: true });
ChatSchema.set('toObject', { virtuals: true });


