import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema({
    chatid: { type: String, required: true, unique: true },
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
    chatType: { 
        type: String, 
        enum: ['direct', 'group', 'broadcast', 'channel'], 
        default: 'direct' 
    },
    chatName: { 
        type: String,
        default: function() {
            return this.chatType === 'group' ? 'New Group' : null;
        }
    },
    chatAvatar: { 
        type: String,
        default: null
    },
    lastMessage: {
        type: String
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    mutedBy: [{ 
        type: String
    }], // Array of profile IDs who muted this chat
    createdBy: {
        type: String,
        required: true
    },
    adminIds: [{
        type: String
    }], // For group chats - array of profile IDs with admin privileges
    chatSettings: {
        onlyAdminsCanSend: { type: Boolean, default: false },
        onlyAdminsCanAddMembers: { type: Boolean, default: false },
        allowMemberInvites: { type: Boolean, default: true },
        messageHistoryVisible: { type: Boolean, default: true },
        autoDeleteMessages: { type: Number, default: 0 }, // 0 = never, time in ms
        maxMembers: { type: Number, default: 256 }
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedBy: [{
        type: String
    }],
    // Add unreadCount field for Issue #16
    unreadCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
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
        isActive: true 
    }).populate('participants.profileid', 'username profilePic');
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
        isActive: true
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
        isActive: true
    });
};

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
