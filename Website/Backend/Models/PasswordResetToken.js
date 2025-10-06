import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const passwordResetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // 1 hour expiry
  },
  used: {
    type: Boolean,
    default: false
  },
  ipAddress: String,
  userAgent: String
});

// Index for cleanup and performance
passwordResetTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });
passwordResetTokenSchema.index({ tokenHash: 1 });
passwordResetTokenSchema.index({ email: 1 });

// Generate secure reset token
passwordResetTokenSchema.statics.generateResetToken = function() {
  // Generate cryptographically secure random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  return { resetToken, tokenHash };
};

// Create password reset token
passwordResetTokenSchema.statics.createResetToken = async function(user, ipAddress, userAgent) {
  try {
    // Invalidate any existing reset tokens for this user
    await this.updateMany(
      { userId: user._id, used: false },
      { used: true }
    );

    const { resetToken, tokenHash } = this.generateResetToken();

    // Create new reset token
    const resetTokenDoc = new this({
      userId: user._id,
      email: user.email,
      tokenHash,
      ipAddress,
      userAgent
    });

    await resetTokenDoc.save();

    return { resetToken, tokenDoc: resetTokenDoc };
  } catch (error) {
    throw new Error('Failed to create password reset token');
  }
};

// Verify reset token
passwordResetTokenSchema.statics.verifyResetToken = async function(token) {
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const tokenDoc = await this.findOne({
      tokenHash,
      used: false
    }).populate('userId', 'email username');

    if (!tokenDoc) {
      throw new Error('Invalid or expired reset token');
    }

    // Check if token is expired (additional check beyond TTL)
    const tokenAge = Date.now() - tokenDoc.createdAt.getTime();
    if (tokenAge > 3600000) { // 1 hour in milliseconds
      await tokenDoc.updateOne({ used: true });
      throw new Error('Reset token has expired');
    }

    return tokenDoc;
  } catch (error) {
    throw error;
  }
};

// Mark token as used
passwordResetTokenSchema.methods.markAsUsed = async function() {
  this.used = true;
  await this.save();
};

// Get reset statistics
passwordResetTokenSchema.statics.getResetStats = async function(userId, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const stats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: since }
      }
    },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        usedTokens: { $sum: { $cond: ['$used', 1, 0] } },
        unusedTokens: { $sum: { $cond: ['$used', 0, 1] } }
      }
    }
  ]);

  return stats[0] || {
    totalRequests: 0,
    usedTokens: 0,
    unusedTokens: 0
  };
};

// Check rate limiting for password reset requests
passwordResetTokenSchema.statics.checkRateLimit = async function(email, maxAttempts = 3, windowHours = 1) {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  
  const attemptCount = await this.countDocuments({
    email: email.toLowerCase(),
    createdAt: { $gte: since }
  });

  if (attemptCount >= maxAttempts) {
    const nextAllowedTime = new Date(since.getTime() + windowHours * 60 * 60 * 1000);
    throw new Error(`Too many password reset requests. Try again after ${nextAllowedTime.toLocaleTimeString()}`);
  }

  return true;
};

export default mongoose.model('PasswordResetToken', passwordResetTokenSchema);