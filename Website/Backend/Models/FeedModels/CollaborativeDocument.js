import mongoose from 'mongoose';

const CollaborativeDocumentSchema = new mongoose.Schema({
  docId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  chatId: {
    type: String,
    required: true,
    index: true
  },
  createdBy: {
    type: String, // profileid
    required: true
  },
  collaborators: [{
    userId: {
      type: String, // profileid
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'editor'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  version: {
    type: Number,
    default: 1
  },
  changes: [{
    userId: {
      type: String, // profileid
      required: true
    },
    changes: [{
      type: {
        type: String,
        enum: ['insert', 'delete', 'format'],
        required: true
      },
      position: {
        type: Number,
        required: true
      },
      length: {
        type: Number,
        default: 0
      },
      text: {
        type: String,
        default: ''
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedBy: {
    type: String, // profileid
    default: null
  },
  lockedAt: {
    type: Date,
    default: null
  },
  permissions: {
    canEdit: {
      type: Boolean,
      default: true
    },
    canComment: {
      type: Boolean,
      default: true
    },
    canShare: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    characterCount: {
      type: Number,
      default: 0
    },
    lastEditedBy: {
      type: String, // profileid
      default: null
    },
    lastEditedAt: {
      type: Date,
      default: null
    }
  },
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
CollaborativeDocumentSchema.index({ chatId: 1, createdAt: -1 });
CollaborativeDocumentSchema.index({ createdBy: 1 });
CollaborativeDocumentSchema.index({ 'collaborators.userId': 1 });
CollaborativeDocumentSchema.index({ updatedAt: -1 });

// Update timestamp on save
CollaborativeDocumentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update metadata
  if (this.content) {
    this.metadata.characterCount = this.content.length;
    this.metadata.wordCount = this.content.trim().split(/\s+/).length;
  }
  
  next();
});

// Method to check if user is collaborator
CollaborativeDocumentSchema.methods.isCollaborator = function(userId) {
  return this.collaborators.some(collab => collab.userId === userId);
};

// Method to get user role
CollaborativeDocumentSchema.methods.getUserRole = function(userId) {
  const collaborator = this.collaborators.find(collab => collab.userId === userId);
  return collaborator ? collaborator.role : null;
};

// Method to check if user can edit
CollaborativeDocumentSchema.methods.canUserEdit = function(userId) {
  // Check if document allows editing
  if (!this.permissions.canEdit) {
    return false;
  }
  
  // Owner can always edit
  if (this.createdBy === userId) {
    return true;
  }
  
  // Check collaborator role
  const role = this.getUserRole(userId);
  return role === 'owner' || role === 'editor';
};

// Method to add collaborator
CollaborativeDocumentSchema.methods.addCollaborator = function(userId, role = 'editor') {
  // Check if user is already a collaborator
  if (this.isCollaborator(userId)) {
    throw new Error('User is already a collaborator');
  }
  
  this.collaborators.push({
    userId,
    role,
    joinedAt: new Date()
  });
  
  return this;
};

// Method to remove collaborator
CollaborativeDocumentSchema.methods.removeCollaborator = function(userId) {
  // Owner cannot be removed
  if (this.createdBy === userId) {
    throw new Error('Cannot remove document owner');
  }
  
  this.collaborators = this.collaborators.filter(collab => collab.userId !== userId);
  
  return this;
};

// Method to update collaborator role
CollaborativeDocumentSchema.methods.updateCollaboratorRole = function(userId, newRole) {
  // Owner role cannot be changed
  if (this.createdBy === userId) {
    throw new Error('Cannot change owner role');
  }
  
  const collaborator = this.collaborators.find(collab => collab.userId === userId);
  if (!collaborator) {
    throw new Error('User is not a collaborator');
  }
  
  collaborator.role = newRole;
  return this;
};

// Method to add change
CollaborativeDocumentSchema.methods.addChange = function(userId, changeData) {
  // Validate user can edit
  if (!this.canUserEdit(userId)) {
    throw new Error('User does not have permission to edit this document');
  }
  
  this.changes.push({
    userId,
    changes: changeData,
    timestamp: new Date()
  });
  
  // Update version
  this.version += 1;
  
  // Update metadata
  this.metadata.lastEditedBy = userId;
  this.metadata.lastEditedAt = new Date();
  
  return this;
};

// Method to lock document
CollaborativeDocumentSchema.methods.lock = function(userId) {
  if (this.isLocked && this.lockedBy !== userId) {
    throw new Error('Document is locked by another user');
  }
  
  this.isLocked = true;
  this.lockedBy = userId;
  this.lockedAt = new Date();
  
  return this;
};

// Method to unlock document
CollaborativeDocumentSchema.methods.unlock = function(userId) {
  // Only the user who locked it or the owner can unlock
  if (this.isLocked && this.lockedBy !== userId && this.createdBy !== userId) {
    throw new Error('Only the locker or owner can unlock this document');
  }
  
  this.isLocked = false;
  this.lockedBy = null;
  this.lockedAt = null;
  
  return this;
};

// Static method to create document
CollaborativeDocumentSchema.statics.createDocument = function(docData) {
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const doc = new this({
    docId,
    ...docData,
    collaborators: [{
      userId: docData.createdBy,
      role: 'owner',
      joinedAt: new Date()
    }]
  });
  
  return doc.save();
};

// Static method to get document by ID
CollaborativeDocumentSchema.statics.getByDocId = function(docId) {
  return this.findOne({ docId });
};

// Static method to get documents by chat
CollaborativeDocumentSchema.statics.getByChatId = function(chatId, options = {}) {
  const query = { chatId };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.offset || 0);
};

// Static method to get documents by user
CollaborativeDocumentSchema.statics.getByUserId = function(userId, options = {}) {
  const query = {
    $or: [
      { createdBy: userId },
      { 'collaborators.userId': userId }
    ]
  };
  
  return this.find(query)
    .sort({ updatedAt: -1 })
    .limit(options.limit || 50)
    .skip(options.offset || 0);
};

const CollaborativeDocument = mongoose.model('CollaborativeDocument', CollaborativeDocumentSchema);

export default CollaborativeDocument;