import mongoose from "mongoose";
import XSSSanitizer from "../../Utils/XSSSanitizer.js";

const ProfileSchema = new mongoose.Schema(
  {
    profileid: { type: String, required: true },
    username: {
      type: String,
      required: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_.-]+$/,
        "Username can only contain letters, numbers, dots, hyphens, and underscores",
      ],
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"],
    },

    // User Profile Information
    name: {
      type: String,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    profilePic: {
      type: String,
      default:
        "https://www.tenforums.com/attachments/user-accounts-family-safety/322690d1615743307t-user-account-image-log-user.png",
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "Profile picture must be a valid URL",
      },
    },

    // Privacy and Verification
    isPrivate: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    // CRITICAL SECURITY FIELDS
    isActive: { type: Boolean, default: true, required: true },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "banned", "pending", "deactivated"],
      default: "active",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "moderator", "admin", "super_admin"],
      default: "user",
      required: true,
    },
    permissions: {
      canSendMessages: { type: Boolean, default: true },
      canCreateChats: { type: Boolean, default: true },
      canUploadFiles: { type: Boolean, default: true },
      canMakeVideoCalls: { type: Boolean, default: true },
      canMakeVoiceCalls: { type: Boolean, default: true },
      maxFileSize: { type: Number, default: 10 * 1024 * 1024 }, // 10MB
      maxChatsPerDay: { type: Number, default: 50 },
      maxMessagesPerMinute: { type: Number, default: 30 },
    },

    // Authentication and Security
    lastLoginAt: { type: Date },
    lastSocketConnection: { type: Date },
    socketConnections: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockedUntil: { type: Date },
    passwordChangedAt: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },

    // Security Tracking
    ipAddresses: [
      {
        ip: String,
        lastUsed: { type: Date, default: Date.now },
        userAgent: String,
        location: String,
      },
    ],

    // Activity Tracking
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },

    // Profile Stats
    stats: {
      totalMessages: { type: Number, default: 0 },
      totalCalls: { type: Number, default: 0 },
      totalChats: { type: Number, default: 0 },
      joinedAt: { type: Date, default: Date.now },
    },

    // Settings
    settings: {
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sound: { type: Boolean, default: true },
      },
      privacy: {
        showLastSeen: { type: Boolean, default: true },
        showOnlineStatus: { type: Boolean, default: true },
        allowDirectMessages: { type: Boolean, default: true },
        readReceipts: { type: Boolean, default: true },
      },
      theme: {
        mode: {
          type: String,
          enum: ["light", "dark", "system"],
          default: "system",
        },
        accentColor: { type: String, default: "#0066cc" },
      },
    },

    // 🔧 SOFT DELETE #115: Add isDeleted field for soft delete functionality
    /**
     * Whether the profile is deleted (soft delete)
     * @type {boolean}
     */
    isDeleted: {
      type: Boolean,
      default: false,
    },

    /**
     * Timestamp when the profile was deleted
     * @type {Date}
     */
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance and security
ProfileSchema.index({ email: 1 }, { unique: true });
ProfileSchema.index({ username: 1 }, { unique: true });
ProfileSchema.index({ profileid: 1 }, { unique: true });
ProfileSchema.index({ isActive: 1, accountStatus: 1 });
ProfileSchema.index({ lastActivity: -1 });
ProfileSchema.index({ "ipAddresses.ip": 1 });
ProfileSchema.index({ role: 1 });

// 🔧 NEW: Additional indexes for critical queries
ProfileSchema.index({ isOnline: 1, lastActivity: -1 }); // For online status queries
ProfileSchema.index({ "settings.privacy.showOnlineStatus": 1, isOnline: 1 }); // For privacy-aware online queries
ProfileSchema.index({ "permissions.canSendMessages": 1 }); // For permission-based queries
ProfileSchema.index({ "stats.totalMessages": -1 }); // For user activity ranking
ProfileSchema.index({ "settings.notifications.push": 1 }); // For notification queries
ProfileSchema.index({ lastLoginAt: -1 }); // For login activity queries
ProfileSchema.index({ accountStatus: 1, isActive: 1 }); // For account status queries

// 🔧 SOFT DELETE #115: Add indexes for soft delete queries
ProfileSchema.index({ isDeleted: 1 }); // For soft delete queries
ProfileSchema.index({ email: 1, isDeleted: 1 }); // For email queries with soft delete
ProfileSchema.index({ username: 1, isDeleted: 1 }); // For username queries with soft delete
ProfileSchema.index({ isActive: 1, isDeleted: 1 }); // For active status queries with soft delete

// Instance methods for security
ProfileSchema.methods.isAccountLocked = function () {
  return this.accountLockedUntil && this.accountLockedUntil > Date.now();
};

ProfileSchema.methods.lockAccount = function () {
  this.accountLockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  this.failedLoginAttempts = 0;
  return this.save();
};

ProfileSchema.methods.unlockAccount = function () {
  this.accountLockedUntil = undefined;
  this.failedLoginAttempts = 0;
  return this.save();
};

ProfileSchema.methods.incrementFailedAttempts = function () {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= 5) {
    this.lockAccount();
  }
  return this.save();
};

ProfileSchema.methods.resetFailedAttempts = function () {
  this.failedLoginAttempts = 0;
  this.accountLockedUntil = undefined;
  return this.save();
};

ProfileSchema.methods.hasPermission = function (permission) {
  if (this.role === "super_admin" || this.role === "admin") {
    return true;
  }
  return this.permissions && this.permissions[permission] === true;
};

ProfileSchema.methods.canPerformAction = function (action, limit) {
  if (!this.isActive || this.accountStatus !== "active") {
    return false;
  }

  if (this.isAccountLocked()) {
    return false;
  }

  // Check rate limits based on action
  return this.hasPermission(action);
};

ProfileSchema.methods.updateActivity = function () {
  this.lastActivity = new Date();
  this.lastSeen = new Date();
  return this.save();
};

ProfileSchema.methods.addIPAddress = function (ip, userAgent, location) {
  const existingIP = this.ipAddresses.find((addr) => addr.ip === ip);
  if (existingIP) {
    existingIP.lastUsed = new Date();
    existingIP.userAgent = userAgent;
    existingIP.location = location;
  } else {
    this.ipAddresses.push({
      ip,
      userAgent,
      location,
      lastUsed: new Date(),
    });

    // Keep only last 10 IP addresses
    if (this.ipAddresses.length > 10) {
      this.ipAddresses = this.ipAddresses.slice(-10);
    }
  }
  return this.save();
};

// Static methods
ProfileSchema.statics.findActive = function (query = {}) {
  return this.find({
    ...query,
    isActive: true,
    accountStatus: "active",
    isDeleted: false, // 🔧 SOFT DELETE #115: Exclude deleted profiles
  });
};

ProfileSchema.statics.findByEmailOrUsername = function (identifier) {
  return this.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
    isActive: true,
    isDeleted: false, // 🔧 SOFT DELETE #115: Exclude deleted profiles
  });
};

// 🔧 SOFT DELETE #115: Add method to soft delete a profile
ProfileSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isActive = false;
  this.accountStatus = "deactivated";
  return this.save();
};

// 🔧 SOFT DELETE #115: Add method to restore a soft deleted profile
ProfileSchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = null;
  this.isActive = true;
  this.accountStatus = "active";
  return this.save();
};

// 🔧 SOFT DELETE #115: Add static method to find deleted profiles
ProfileSchema.statics.findDeleted = function () {
  return this.find({ isDeleted: true });
};

// 🔧 SOFT DELETE #115: Add static method to find active (non-deleted) profiles
ProfileSchema.statics.findActiveAll = function () {
  return this.find({
    isActive: true,
    isDeleted: false,
  });
};

const Profile =
  mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);
export default Profile;

// 🔧 MODEL RELATIONSHIPS #117: Add virtual populate fields for easier relationship access
// Virtual populate for sent messages
ProfileSchema.virtual("sentMessages", {
  ref: "Message",
  localField: "profileid",
  foreignField: "senderid",
});

// Virtual populate for chats where user is participant
ProfileSchema.virtual("participantChats", {
  ref: "Chat",
  localField: "profileid",
  foreignField: "participants.profileid",
});

// Virtual populate for chats created by user
ProfileSchema.virtual("createdChats", {
  ref: "Chat",
  localField: "profileid",
  foreignField: "createdBy",
});

// Virtual populate for chats where user is admin
ProfileSchema.virtual("adminChats", {
  ref: "Chat",
  localField: "profileid",
  foreignField: "adminIds",
});

// Virtual populate for messages where user is mentioned
ProfileSchema.virtual("mentionedMessages", {
  ref: "Message",
  localField: "profileid",
  foreignField: "mentions",
});

// Virtual populate for messages where user has reacted
ProfileSchema.virtual("reactionMessages", {
  ref: "Message",
  localField: "profileid",
  foreignField: "reactions.profileid",
});

// Virtual populate for messages read by user
ProfileSchema.virtual("readMessages", {
  ref: "Message",
  localField: "profileid",
  foreignField: "readBy.profileid",
});

// Virtual populate for messages delivered to user
ProfileSchema.virtual("deliveredMessages", {
  ref: "Message",
  localField: "profileid",
  foreignField: "deliveredTo.profileid",
});

// Ensure virtual fields are serialized
ProfileSchema.set("toJSON", { virtuals: true });
ProfileSchema.set("toObject", { virtuals: true });
