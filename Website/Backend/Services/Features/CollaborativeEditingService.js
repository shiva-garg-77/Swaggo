/**
 * Collaborative Editing Service - Handles real-time collaborative document editing
 * 
 * This service provides a centralized interface for managing collaborative documents
 * including creation, editing, version control, and real-time synchronization.
 * 
 * @module CollaborativeEditingService
 * @version 1.0.0
 */

import CollaborativeDocument from '../../Models/FeedModels/CollaborativeDocument.js';
import { Server as SocketIOServer } from 'socket.io';

class CollaborativeEditingService {
  constructor() {
    this.documents = new Map(); // In-memory document cache
    this.activeSessions = new Map(); // Active editing sessions
    this.io = null;
  }
  
  /**
   * Initialize the service with Socket.IO instance
   * @param {SocketIOServer} io - Socket.IO server instance
   */
  initialize(io) {
    this.io = io;
    console.log('✅ Collaborative Editing Service initialized');
  }
  
  /**
   * Create a new collaborative document
   * @param {Object} docData - Document data
   * @param {string} docData.title - Document title
   * @param {string} docData.content - Initial content
   * @param {string} docData.chatId - Chat ID
   * @param {string} docData.createdBy - User ID who created the document
   * @returns {Object} Created document
   */
  async createDocument(docData) {
    try {
      const doc = await CollaborativeDocument.createDocument(docData);
      
      // Cache document
      this.documents.set(doc.docId, doc);
      
      console.log(`✅ Collaborative document created: ${doc.docId}`);
      return doc;
    } catch (error) {
      console.error('❌ Error creating collaborative document:', error);
      throw error;
    }
  }
  
  /**
   * Get document by ID
   * @param {string} docId - Document ID
   * @returns {Object} Document
   */
  async getDocument(docId) {
    try {
      // Check cache first
      if (this.documents.has(docId)) {
        return this.documents.get(docId);
      }
      
      // Fetch from database
      const doc = await CollaborativeDocument.getByDocId(docId);
      if (!doc) {
        throw new Error(`Document not found: ${docId}`);
      }
      
      // Cache document
      this.documents.set(docId, doc);
      
      return doc;
    } catch (error) {
      console.error(`❌ Error getting document ${docId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get documents by chat ID
   * @param {string} chatId - Chat ID
   * @param {Object} options - Query options
   * @returns {Array} Array of documents
   */
  async getDocumentsByChat(chatId, options = {}) {
    try {
      return await CollaborativeDocument.getByChatId(chatId, options);
    } catch (error) {
      console.error(`❌ Error getting documents for chat ${chatId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get documents by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} Array of documents
   */
  async getDocumentsByUser(userId, options = {}) {
    try {
      return await CollaborativeDocument.getByUserId(userId, options);
    } catch (error) {
      console.error(`❌ Error getting documents for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Add collaborator to document
   * @param {string} docId - Document ID
   * @param {string} userId - User ID to add
   * @param {string} role - Role (owner, editor, viewer)
   * @returns {Object} Updated document
   */
  async addCollaborator(docId, userId, role = 'editor') {
    try {
      const doc = await this.getDocument(docId);
      doc.addCollaborator(userId, role);
      await doc.save();
      
      // Update cache
      this.documents.set(docId, doc);
      
      // Notify collaborators
      if (this.io) {
        this.io.to(docId).emit('collaborator_added', {
          docId,
          userId,
          role
        });
      }
      
      console.log(`✅ Collaborator added to document ${docId}: ${userId}`);
      return doc;
    } catch (error) {
      console.error(`❌ Error adding collaborator to document ${docId}:`, error);
      throw error;
    }
  }
  
  /**
   * Remove collaborator from document
   * @param {string} docId - Document ID
   * @param {string} userId - User ID to remove
   * @returns {Object} Updated document
   */
  async removeCollaborator(docId, userId) {
    try {
      const doc = await this.getDocument(docId);
      doc.removeCollaborator(userId);
      await doc.save();
      
      // Update cache
      this.documents.set(docId, doc);
      
      // Notify collaborators
      if (this.io) {
        this.io.to(docId).emit('collaborator_removed', {
          docId,
          userId
        });
      }
      
      console.log(`✅ Collaborator removed from document ${docId}: ${userId}`);
      return doc;
    } catch (error) {
      console.error(`❌ Error removing collaborator from document ${docId}:`, error);
      throw error;
    }
  }
  
  /**
   * Update collaborator role
   * @param {string} docId - Document ID
   * @param {string} userId - User ID
   * @param {string} newRole - New role
   * @returns {Object} Updated document
   */
  async updateCollaboratorRole(docId, userId, newRole) {
    try {
      const doc = await this.getDocument(docId);
      doc.updateCollaboratorRole(userId, newRole);
      await doc.save();
      
      // Update cache
      this.documents.set(docId, doc);
      
      // Notify collaborators
      if (this.io) {
        this.io.to(docId).emit('collaborator_role_updated', {
          docId,
          userId,
          role: newRole
        });
      }
      
      console.log(`✅ Collaborator role updated for document ${docId}: ${userId} -> ${newRole}`);
      return doc;
    } catch (error) {
      console.error(`❌ Error updating collaborator role for document ${docId}:`, error);
      throw error;
    }
  }
  
  /**
   * Apply changes to document
   * @param {string} docId - Document ID
   * @param {string} userId - User ID
   * @param {Array} changes - Array of changes
   * @returns {Object} Updated document
   */
  async applyChanges(docId, userId, changes) {
    try {
      const doc = await this.getDocument(docId);
      
      // Lock document during changes
      doc.lock(userId);
      await doc.save();
      
      // Apply changes
      doc.addChange(userId, changes);
      doc.content = this.applyChangesToContent(doc.content, changes);
      await doc.save();
      
      // Unlock document
      doc.unlock(userId);
      await doc.save();
      
      // Update cache
      this.documents.set(docId, doc);
      
      // Notify collaborators in real-time
      if (this.io) {
        this.io.to(docId).emit('document_updated', {
          docId,
          content: doc.content,
          changes,
          userId,
          version: doc.version,
          metadata: {
            wordCount: doc.metadata.wordCount,
            characterCount: doc.metadata.characterCount,
            lastEditedBy: doc.metadata.lastEditedBy,
            lastEditedAt: doc.metadata.lastEditedAt
          }
        });
      }
      
      console.log(`✅ Changes applied to document ${docId} by user ${userId}`);
      return doc;
    } catch (error) {
      console.error(`❌ Error applying changes to document ${docId}:`, error);
      throw error;
    }
  }
  
  /**
   * Apply changes to content string
   * @param {string} content - Original content
   * @param {Array} changes - Array of changes
   * @returns {string} Updated content
   */
  applyChangesToContent(content, changes) {
    let updatedContent = content;
    
    // Sort changes by position (descending) to apply from end to start
    changes.sort((a, b) => b.position - a.position);
    
    for (const change of changes) {
      switch (change.type) {
        case 'insert':
          updatedContent = updatedContent.slice(0, change.position) + 
                          change.text + 
                          updatedContent.slice(change.position);
          break;
        case 'delete':
          updatedContent = updatedContent.slice(0, change.position) + 
                          updatedContent.slice(change.position + change.length);
          break;
        // Format changes would be handled differently in a real implementation
      }
    }
    
    return updatedContent;
  }
  
  /**
   * Get document history
   * @param {string} docId - Document ID
   * @returns {Array} Document changes history
   */
  async getDocumentHistory(docId) {
    try {
      const doc = await this.getDocument(docId);
      return doc.changes;
    } catch (error) {
      console.error(`❌ Error getting history for document ${docId}:`, error);
      throw error;
    }
  }
  
  /**
   * Revert document to specific version
   * @param {string} docId - Document ID
   * @param {string} userId - User ID
   * @param {number} version - Version to revert to
   * @returns {Object} Updated document
   */
  async revertToVersion(docId, userId, version) {
    try {
      const doc = await this.getDocument(docId);
      
      // Validate user can edit
      if (!doc.canUserEdit(userId)) {
        throw new Error('User does not have permission to edit this document');
      }
      
      // Find the version to revert to
      const versionIndex = doc.changes.findIndex(change => 
        doc.changes.filter(c => c.timestamp <= change.timestamp).length === version
      );
      
      if (versionIndex === -1) {
        throw new Error(`Version ${version} not found`);
      }
      
      // Rebuild content up to that version
      let content = '';
      const changesToVersion = doc.changes.slice(0, versionIndex + 1);
      
      for (const change of changesToVersion) {
        content = this.applyChangesToContent(content, change.changes);
      }
      
      // Update document
      doc.content = content;
      doc.version = version;
      doc.metadata.lastEditedBy = userId;
      doc.metadata.lastEditedAt = new Date();
      await doc.save();
      
      // Update cache
      this.documents.set(docId, doc);
      
      // Notify collaborators
      if (this.io) {
        this.io.to(docId).emit('document_reverted', {
          docId,
          content: doc.content,
          version: doc.version,
          userId
        });
      }
      
      console.log(`✅ Document ${docId} reverted to version ${version}`);
      return doc;
    } catch (error) {
      console.error(`❌ Error reverting document ${docId} to version ${version}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete document
   * @param {string} docId - Document ID
   * @param {string} userId - User ID
   * @returns {Object} Deletion result
   */
  async deleteDocument(docId, userId) {
    try {
      const doc = await this.getDocument(docId);
      
      // Only owner can delete
      if (doc.createdBy !== userId) {
        throw new Error('Only document owner can delete the document');
      }
      
      // Remove from database
      await CollaborativeDocument.deleteOne({ docId });
      
      // Remove from cache
      this.documents.delete(docId);
      
      // Notify collaborators
      if (this.io) {
        this.io.to(docId).emit('document_deleted', {
          docId
        });
      }
      
      console.log(`🗑️ Document deleted: ${docId}`);
      return { success: true, message: 'Document deleted successfully' };
    } catch (error) {
      console.error(`❌ Error deleting document ${docId}:`, error);
      throw error;
    }
  }
  
  /**
   * Start collaborative editing session
   * @param {string} docId - Document ID
   * @param {string} userId - User ID
   * @param {Object} socket - Socket instance
   */
  startEditingSession(docId, userId, socket) {
    try {
      // Join document room
      socket.join(docId);
      
      // Track active session
      if (!this.activeSessions.has(docId)) {
        this.activeSessions.set(docId, new Set());
      }
      
      this.activeSessions.get(docId).add(userId);
      
      // Notify other collaborators
      if (this.io) {
        this.io.to(docId).emit('user_joined_editing', {
          docId,
          userId,
          userCount: this.activeSessions.get(docId).size
        });
      }
      
      console.log(`👥 User ${userId} joined editing session for document ${docId}`);
    } catch (error) {
      console.error(`❌ Error starting editing session for document ${docId}:`, error);
      throw error;
    }
  }
  
  /**
   * End collaborative editing session
   * @param {string} docId - Document ID
   * @param {string} userId - User ID
   * @param {Object} socket - Socket instance
   */
  endEditingSession(docId, userId, socket) {
    try {
      // Leave document room
      socket.leave(docId);
      
      // Remove from active sessions
      if (this.activeSessions.has(docId)) {
        this.activeSessions.get(docId).delete(userId);
        
        // Clean up empty sessions
        if (this.activeSessions.get(docId).size === 0) {
          this.activeSessions.delete(docId);
        }
      }
      
      // Notify other collaborators
      if (this.io) {
        this.io.to(docId).emit('user_left_editing', {
          docId,
          userId,
          userCount: this.activeSessions.has(docId) ? this.activeSessions.get(docId).size : 0
        });
      }
      
      console.log(`👋 User ${userId} left editing session for document ${docId}`);
    } catch (error) {
      console.error(`❌ Error ending editing session for document ${docId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get active users for document
   * @param {string} docId - Document ID
   * @returns {Array} Array of active user IDs
   */
  getActiveUsers(docId) {
    if (this.activeSessions.has(docId)) {
      return Array.from(this.activeSessions.get(docId));
    }
    return [];
  }
  
  /**
   * Cache cleanup - remove old documents from cache
   */
  cleanupCache() {
    const now = Date.now();
    const cacheExpiry = 30 * 60 * 1000; // 30 minutes
    
    for (const [docId, doc] of this.documents.entries()) {
      // Remove documents not accessed in 30 minutes
      if (now - doc.updatedAt.getTime() > cacheExpiry) {
        this.documents.delete(docId);
        console.log(`🧹 Cleaned up document from cache: ${docId}`);
      }
    }
  }
  
  /**
   * Start periodic cleanup
   */
  startCleanup() {
    // Run cache cleanup every 10 minutes
    setInterval(() => {
      this.cleanupCache();
    }, 10 * 60 * 1000);
  }
}

// Export singleton instance
export default new CollaborativeEditingService();