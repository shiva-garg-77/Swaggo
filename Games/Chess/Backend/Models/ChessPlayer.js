import mongoose from 'mongoose';

/**
 * Chess Player Model
 * Extends the main User model with chess-specific data
 */

const ChessPlayerSchema = new mongoose.Schema({
  // Reference to main User
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Reference to Profile
  profileId: {
    type: String,
    required: true,
    index: true
  },
  
  // Chess Statistics
  chessStats: {
    elo: {
      type: Number,
      default: 1200,
      min: 0,
      max: 4000
    },
    rank: {
      type: String,
      enum: ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Expert', 'Master', 'Grandmaster'],
      default: 'Novice'
    },
    gamesPlayed: {
      type: Number,
      default: 0
    },
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    draws: {
      type: Number,
      default: 0
    },
    winStreak: {
      type: Number,
      default: 0
    },
    bestWinStreak: {
      type: Number,
      default: 0
    },
    averageGameDuration: {
      type: Number,
      default: 0
    },
    favoriteOpening: String
  },
  
  // Recent Opponents (max 10, FIFO)
  recentOpponents: [{
    playerId: String,
    username: String,
    avatar: String,
    playedAt: Date,
    result: {
      type: String,
      enum: ['win', 'loss', 'draw']
    }
  }],
  
  // Blocked Players
  blockedPlayers: [{
    playerId: String,
    blockedAt: Date,
    blockType: {
      type: String,
      enum: ['temporary', 'permanent']
    },
    expiresAt: Date
  }],
  
  // Player Preferences
  preferences: {
    voiceEnabled: {
      type: Boolean,
      default: true
    },
    autoAcceptRematch: {
      type: Boolean,
      default: false
    },
    showMoveHints: {
      type: Boolean,
      default: false
    },
    boardTheme: {
      type: String,
      default: 'classic'
    },
    pieceSet: {
      type: String,
      default: 'standard'
    }
  }
  
}, {
  timestamps: true
});

// Indexes for performance
ChessPlayerSchema.index({ userId: 1 });
ChessPlayerSchema.index({ 'chessStats.elo': -1 });
ChessPlayerSchema.index({ 'chessStats.rank': 1 });
ChessPlayerSchema.index({ 'recentOpponents.playerId': 1 });

// Instance Methods

/**
 * Update ELO rating
 */
ChessPlayerSchema.methods.updateELO = function(change) {
  this.chessStats.elo += change;
  this.chessStats.elo = Math.max(0, Math.min(4000, this.chessStats.elo));
  this.updateRank();
};

/**
 * Update rank based on ELO
 */
ChessPlayerSchema.methods.updateRank = function() {
  const elo = this.chessStats.elo;
  
  if (elo < 800) this.chessStats.rank = 'Beginner';
  else if (elo < 1200) this.chessStats.rank = 'Novice';
  else if (elo < 1600) this.chessStats.rank = 'Intermediate';
  else if (elo < 2000) this.chessStats.rank = 'Advanced';
  else if (elo < 2400) this.chessStats.rank = 'Expert';
  else if (elo < 2800) this.chessStats.rank = 'Master';
  else this.chessStats.rank = 'Grandmaster';
};

/**
 * Add recent opponent
 */
ChessPlayerSchema.methods.addRecentOpponent = function(opponent) {
  // Remove if already exists
  this.recentOpponents = this.recentOpponents.filter(
    o => o.playerId !== opponent.playerId
  );
  
  // Add to front
  this.recentOpponents.unshift(opponent);
  
  // Keep only last 10
  this.recentOpponents = this.recentOpponents.slice(0, 10);
};

/**
 * Check if player is blocked
 */
ChessPlayerSchema.methods.isBlocked = function(playerId) {
  const block = this.blockedPlayers.find(b => b.playerId === playerId);
  
  if (!block) return false;
  
  if (block.blockType === 'permanent') return true;
  
  if (block.expiresAt && block.expiresAt > new Date()) return true;
  
  return false;
};

/**
 * Block a player
 */
ChessPlayerSchema.methods.blockPlayer = function(playerId, blockType = 'temporary') {
  // Remove existing block
  this.blockedPlayers = this.blockedPlayers.filter(b => b.playerId !== playerId);
  
  const block = {
    playerId,
    blockedAt: new Date(),
    blockType
  };
  
  if (blockType === 'temporary') {
    block.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  }
  
  this.blockedPlayers.push(block);
};

/**
 * Unblock a player
 */
ChessPlayerSchema.methods.unblockPlayer = function(playerId) {
  this.blockedPlayers = this.blockedPlayers.filter(b => b.playerId !== playerId);
};

export default mongoose.model('ChessPlayer', ChessPlayerSchema);
