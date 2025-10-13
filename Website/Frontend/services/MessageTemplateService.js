/**
 * Message Template Service - Frontend service for managing message templates
 * 
 * This service provides functionality for creating, retrieving, updating, and deleting
 * message templates for quick responses.
 */

import apiService from './ApiService';

class MessageTemplateService {
  /**
   * Create a new message template
   * @param {object} templateData - Template data
   * @returns {Promise} Created template
   */
  async createTemplate(templateData) {
    try {
      const response = await apiService.post('/templates', templateData);
      return response.data;
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
      const response = await apiService.get('/templates');
      return response.data;
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
      const response = await apiService.get(`/templates/${templateId}`);
      return response.data;
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
      const response = await apiService.put(`/templates/${templateId}`, updateData);
      return response.data;
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
      const response = await apiService.delete(`/templates/${templateId}`);
      return response.data;
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
      const response = await apiService.get(`/templates/search?query=${encodeURIComponent(query)}`);
      return response.data;
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
      const response = await apiService.get(`/templates/category/${encodeURIComponent(category)}`);
      return response.data;
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
      const response = await apiService.get('/templates/categories');
      return response.data;
    } catch (error) {
      console.error('Error getting user categories:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new MessageTemplateService();