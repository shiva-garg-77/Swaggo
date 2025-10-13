/**
 * Collaborative Editing Service - Frontend service for interacting with collaborative editing API
 * 
 * This service provides a unified interface for managing collaborative documents
 * including creation, editing, and real-time synchronization.
 */

import apiService from './ApiService';

class CollaborativeEditingService {
  constructor() {
    this.activeDocuments = new Map(); // Active document sessions
    this.listeners = new Map(); // Event listeners
  }

  /**
   * Create a new collaborative document
   * @param {Object} docData - Document data
   * @returns {Promise} Created document
   */
  async createDocument(docData) {
    try {
      const response = await apiService.post('/api/collab-docs', docData);
      if (response.success) {
        return response.doc;
      } else {
        throw new Error(response.error || 'Failed to create document');
      }
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * Get document by ID
   * @param {string} docId - Document ID
   * @returns {Promise} Document data
   */
  async getDocument(docId) {
    try {
      const response = await apiService.get(`/api/collab-docs/${docId}`);
      if (response.success) {
        return response.doc;
      } else {
        throw new Error(response.error || 'Failed to get document');
      }
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  /**
   * Get documents by chat ID
   * @param {string} chatId - Chat ID
   * @param {Object} options - Query options
   * @returns {Promise} Array of documents
   */
  async getDocumentsByChat(chatId, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.offset) queryParams.append('offset', options.offset);
      
      const response = await apiService.get(`/api/collab-docs/chat/${chatId}?${queryParams}`);
      if (response.success) {
        return response.docs;
      } else {
        throw new Error(response.error || 'Failed to get documents');
      }
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  /**
   * Get documents by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise} Array of documents
   */
  async getDocumentsByUser(userId, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.offset) queryParams.append('offset', options.offset);
      
      const response = await apiService.get(`/api/collab-docs/user/${userId}?${queryParams}`);
      if (response.success) {
        return response.docs;
      } else {
        throw new Error(response.error || 'Failed to get user documents');
      }
    } catch (error) {
      console.error('Error getting user documents:', error);
      throw error;
    }
  }

  /**
   * Add collaborator to document
   * @param {string} docId - Document ID
   * @param {string} collaboratorId - Collaborator ID
   * @param {string} role - Role (owner, editor, viewer)
   * @returns {Promise} Updated document
   */
  async addCollaborator(docId, collaboratorId, role = 'editor') {
    try {
      const response = await apiService.post(`/api/collab-docs/${docId}/collaborators`, {
        collaboratorId,
        role
      });
      if (response.success) {
        return response.doc;
      } else {
        throw new Error(response.error || 'Failed to add collaborator');
      }
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw error;
    }
  }

  /**
   * Remove collaborator from document
   * @param {string} docId - Document ID
   * @param {string} collaboratorId - Collaborator ID
   * @returns {Promise} Updated document
   */
  async removeCollaborator(docId, collaboratorId) {
    try {
      const response = await apiService.delete(`/api/collab-docs/${docId}/collaborators/${collaboratorId}`);
      if (response.success) {
        return response.doc;
      } else {
        throw new Error(response.error || 'Failed to remove collaborator');
      }
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }
  }

  /**
   * Update collaborator role
   * @param {string} docId - Document ID
   * @param {string} collaboratorId - Collaborator ID
   * @param {string} role - New role
   * @returns {Promise} Updated document
   */
  async updateCollaboratorRole(docId, collaboratorId, role) {
    try {
      const response = await apiService.put(`/api/collab-docs/${docId}/collaborators/${collaboratorId}/role`, {
        role
      });
      if (response.success) {
        return response.doc;
      } else {
        throw new Error(response.error || 'Failed to update collaborator role');
      }
    } catch (error) {
      console.error('Error updating collaborator role:', error);
      throw error;
    }
  }

  /**
   * Apply changes to document
   * @param {string} docId - Document ID
   * @param {Array} changes - Array of changes
   * @returns {Promise} Updated document
   */
  async applyChanges(docId, changes) {
    try {
      const response = await apiService.post(`/api/collab-docs/${docId}/changes`, { changes });
      if (response.success) {
        return response.doc;
      } else {
        throw new Error(response.error || 'Failed to apply changes');
      }
    } catch (error) {
      console.error('Error applying changes:', error);
      throw error;
    }
  }

  /**
   * Get document change history
   * @param {string} docId - Document ID
   * @returns {Promise} Document history
   */
  async getDocumentHistory(docId) {
    try {
      const response = await apiService.get(`/api/collab-docs/${docId}/history`);
      if (response.success) {
        return response.history;
      } else {
        throw new Error(response.error || 'Failed to get document history');
      }
    } catch (error) {
      console.error('Error getting document history:', error);
      throw error;
    }
  }

  /**
   * Revert document to specific version
   * @param {string} docId - Document ID
   * @param {number} version - Version to revert to
   * @returns {Promise} Updated document
   */
  async revertToVersion(docId, version) {
    try {
      const response = await apiService.post(`/api/collab-docs/${docId}/revert/${version}`);
      if (response.success) {
        return response.doc;
      } else {
        throw new Error(response.error || 'Failed to revert document');
      }
    } catch (error) {
      console.error('Error reverting document:', error);
      throw error;
    }
  }

  /**
   * Delete document
   * @param {string} docId - Document ID
   * @returns {Promise} Deletion result
   */
  async deleteDocument(docId) {
    try {
      const response = await apiService.delete(`/api/collab-docs/${docId}`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }
}

// Export singleton instance
export default new CollaborativeEditingService();