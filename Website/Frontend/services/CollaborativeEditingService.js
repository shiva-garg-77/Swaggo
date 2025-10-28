/**
 * Collaborative Editing Service - Frontend service for managing collaborative documents
 * 
 * This service provides a client-side interface for interacting with the backend
 * collaborative editing API and managing local state.
 */

class CollaborativeEditingService {
  constructor() {
    this.baseUrl = '/api/collaborative-editing';
  }

  /**
   * Create a new collaborative document
   * @param {Object} docData - Document data
   * @returns {Promise} Created document
   */
  async createDocument(docData) {
    try {
      const response = await fetch(`${this.baseUrl}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(docData)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create document');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * Get document by ID
   * @param {string} docId - Document ID
   * @returns {Promise} Document
   */
  async getDocument(docId) {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${docId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get document');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error getting document ${docId}:`, error);
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
      const queryParams = new URLSearchParams(options).toString();
      const response = await fetch(`${this.baseUrl}/documents/chat/${chatId}${queryParams ? `?${queryParams}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get documents');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error getting documents for chat ${chatId}:`, error);
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
      const queryParams = new URLSearchParams(options).toString();
      const response = await fetch(`${this.baseUrl}/documents/user/${userId}${queryParams ? `?${queryParams}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get documents');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error getting documents for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Add collaborator to document
   * @param {string} docId - Document ID
   * @param {string} userId - User ID to add
   * @param {string} role - Role (owner, editor, viewer)
   * @returns {Promise} Updated document
   */
  async addCollaborator(docId, userId, role = 'editor') {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${docId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId, role })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to add collaborator');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error adding collaborator to document ${docId}:`, error);
      throw error;
    }
  }

  /**
   * Remove collaborator from document
   * @param {string} docId - Document ID
   * @param {string} userId - User ID to remove
   * @returns {Promise} Updated document
   */
  async removeCollaborator(docId, userId) {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${docId}/collaborators/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to remove collaborator');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error removing collaborator from document ${docId}:`, error);
      throw error;
    }
  }

  /**
   * Update collaborator role
   * @param {string} docId - Document ID
   * @param {string} userId - User ID
   * @param {string} newRole - New role
   * @returns {Promise} Updated document
   */
  async updateCollaboratorRole(docId, userId, newRole) {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${docId}/collaborators/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update collaborator role');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error updating collaborator role for document ${docId}:`, error);
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
      const response = await fetch(`${this.baseUrl}/documents/${docId}/changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ changes })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to apply changes');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error applying changes to document ${docId}:`, error);
      throw error;
    }
  }

  /**
   * Get document history
   * @param {string} docId - Document ID
   * @returns {Promise} Document changes history
   */
  async getDocumentHistory(docId) {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${docId}/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get document history');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error getting history for document ${docId}:`, error);
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
      const response = await fetch(`${this.baseUrl}/documents/${docId}/revert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ version })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to revert document');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error reverting document ${docId} to version ${version}:`, error);
      throw error;
    }
  }

  /**
   * Update document metadata
   * @param {string} docId - Document ID
   * @param {Object} updateData - Update data
   * @returns {Promise} Updated document
   */
  async updateDocument(docId, updateData) {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${docId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update document');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error updating document ${docId}:`, error);
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
      const response = await fetch(`${this.baseUrl}/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete document');
      }
      
      return result;
    } catch (error) {
      console.error(`Error deleting document ${docId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export default new CollaborativeEditingService();