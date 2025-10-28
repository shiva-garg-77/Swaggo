/**
 * Message Template Service - Frontend service for managing message templates
 * 
 * This service provides functionality for interacting with the backend message template API.
 */

class MessageTemplateService {
  constructor() {
    this.baseUrl = '/api/templates';
  }

  /**
   * Create a new message template
   * @param {object} templateData - Template data
   * @returns {Promise} Created template
   */
  async createTemplate(templateData) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Auth header would be added by auth middleware
        },
        credentials: 'include',
        body: JSON.stringify(templateData)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create template');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Get all templates for the current user
   * @returns {Promise} Array of templates
   */
  async getUserTemplates() {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get templates');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error getting user templates:', error);
      throw error;
    }
  }

  /**
   * Get a specific template by ID
   * @param {string} templateId - Template ID
   * @returns {Promise} Template object
   */
  async getTemplateById(templateId) {
    try {
      const response = await fetch(`${this.baseUrl}/${templateId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(result.message || 'Failed to get template');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error getting template:', error);
      throw error;
    }
  }

  /**
   * Update a template
   * @param {string} templateId - Template ID
   * @param {object} updateData - Update data
   * @returns {Promise} Updated template
   */
  async updateTemplate(templateId, updateData) {
    try {
      const response = await fetch(`${this.baseUrl}/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update template');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Delete a template
   * @param {string} templateId - Template ID
   * @returns {Promise} Deletion result
   */
  async deleteTemplate(templateId) {
    try {
      const response = await fetch(`${this.baseUrl}/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete template');
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Search templates by query
   * @param {string} query - Search query
   * @returns {Promise} Array of matching templates
   */
  async searchTemplates(query) {
    try {
      const response = await fetch(`${this.baseUrl}/search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to search templates');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error searching templates:', error);
      throw error;
    }
  }

  /**
   * Get templates by category
   * @param {string} category - Category name
   * @returns {Promise} Array of templates in category
   */
  async getTemplatesByCategory(category) {
    try {
      const response = await fetch(`${this.baseUrl}/category/${encodeURIComponent(category)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get templates by category');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error getting templates by category:', error);
      throw error;
    }
  }

  /**
   * Get all categories for the current user
   * @returns {Promise} Array of categories
   */
  async getUserCategories() {
    try {
      const response = await fetch(`${this.baseUrl}/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get categories');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error getting user categories:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new MessageTemplateService();