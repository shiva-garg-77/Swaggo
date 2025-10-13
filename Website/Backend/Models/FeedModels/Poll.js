import mongoose from 'mongoose';

const PollOptionSchema = new mongoose.Schema({
  optionId: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  votes: {
    type: Number,
    default: 0
  }
});

const PollSchema = new mongoose.Schema({
  pollId: {
    type: String,
    required: true,
    unique: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [PollOptionSchema],
  createdBy: {
    type: String, // profileid
    required: true
  },
  chatId: {
    type: String, // chatid
    required: true
  },
  messageId: {
    type: String, // messageid
    required: true
  },
  isMultipleChoice: {
    type: Boolean,
    default: false
  },
  allowAnonymous: {
    type: Boolean,
    default: false
  },
  allowAddOptions: {
    type: Boolean,
    default: false
  },
  endDate: {
    type: Date,
    default: null
  },
  isClosed: {
    type: Boolean,
    default: false
  },
  voters: [{
    type: String, // profileid
    required: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
PollSchema.index({ createdBy: 1, createdAt: -1 });
PollSchema.index({ chatId: 1 });
PollSchema.index({ messageId: 1 });
PollSchema.index({ isClosed: 1 });
PollSchema.index({ endDate: 1 });

// Update timestamp on save
PollSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if user has voted
PollSchema.methods.hasUserVoted = function(userId) {
  return this.voters.includes(userId);
};

// Method to get vote count
PollSchema.methods.getVoteCount = function() {
  return this.options.reduce((sum, option) => sum + option.votes, 0);
};

// Method to get results
PollSchema.methods.getResults = function() {
  const totalVotes = this.getVoteCount();
  return this.options.map(option => ({
    optionId: option.optionId,
    text: option.text,
    votes: option.votes,
    percentage: totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
  }));
};

// Method to add vote
PollSchema.methods.addVote = function(userId, optionIds) {
  // Check if user already voted
  if (this.hasUserVoted(userId)) {
    throw new Error('User has already voted');
  }
  
  // Check if poll is closed
  if (this.isClosed) {
    throw new Error('Poll is closed');
  }
  
  // Check if poll has ended
  if (this.endDate && new Date() > this.endDate) {
    throw new Error('Poll has ended');
  }
  
  // Validate option IDs
  const validOptionIds = this.options.map(opt => opt.optionId);
  const invalidOptions = optionIds.filter(id => !validOptionIds.includes(id));
  if (invalidOptions.length > 0) {
    throw new Error('Invalid option IDs');
  }
  
  // Update vote counts
  this.options.forEach(option => {
    if (optionIds.includes(option.optionId)) {
      option.votes += 1;
    }
  });
  
  // Add user to voters
  this.voters.push(userId);
  
  return this;
};

// Static method to create poll
PollSchema.statics.createPoll = function(pollData) {
  const pollId = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const poll = new this({
    pollId,
    ...pollData
  });
  
  return poll.save();
};

// Static method to get poll by ID
PollSchema.statics.getByPollId = function(pollId) {
  return this.findOne({ pollId });
};

// Static method to get polls by chat
PollSchema.statics.getByChatId = function(chatId, options = {}) {
  const query = { chatId };
  
  if (options.excludeClosed) {
    query.isClosed = false;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.offset || 0);
};

// Static method to close expired polls
PollSchema.statics.closeExpiredPolls = function() {
  return this.updateMany(
    { 
      endDate: { $lte: new Date() },
      isClosed: false
    },
    { 
      $set: { isClosed: true } 
    }
  );
};

const Poll = mongoose.model('Poll', PollSchema);

export default Poll;