/**
 * Message Template Service - Backend service for managing message templates
 * 
 * This service provides functionality for creating, retrieving, updating, and deleting
 * message templates for quick responses.
 */

class MessageTemplateService {
  constructor() {
    // In a real implementation, this would connect to a database
    // For now, we'll use an in-memory store for demonstration
    this.templates = new Map();
  }

  /**
   * Create a new message template
   * @param {string} userId - User ID
   * @param {object} templateData - Template data
   * @returns {Promise} Created template
   */
  async createTemplate(userId, templateData) {
    try {
      // Validate input
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      if (!templateData.title || !templateData.content) {
        throw new Error('Template title and content are required');
      }

      // Create template object
      const template = {
        id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        title: templateData.title.trim(),
        content: templateData.content.trim(),
        category: templateData.category || 'general',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store template (in a real implementation, this would save to a database)
      if (!this.templates.has(userId)) {
        this.templates.set(userId, new Map());
      }
      
      this.templates.get(userId).set(template.id, template);
      
      return template;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Get all templates for a user
   * @param {string} userId - User ID
   * @returns {Promise} Array of templates
   */
  async getUserTemplates(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Retrieve templates (in a real implementation, this would query a database)
      if (!this.templates.has(userId)) {
        return [];
      }
      
      const userTemplates = this.templates.get(userId);
      return Array.from(userTemplates.values());
    } catch (error) {
      console.error('Error getting user templates:', error);
      throw error;
    }
  }

  /**
   * Get a specific template by ID
   * @param {string} userId - User ID
   * @param {string} templateId - Template ID
   * @returns {Promise} Template object
   */
  async getTemplateById(userId, templateId) {
    try {
      if (!userId || !templateId) {
        throw new Error('User ID and Template ID are required');
      }

      // Retrieve template (in a real implementation, this would query a database)
      if (!this.templates.has(userId)) {
        return null;
      }
      
      const userTemplates = this.templates.get(userId);
      return userTemplates.get(templateId) || null;
    } catch (error) {
      console.error('Error getting template:', error);
      throw error;
    }
  }

  /**
   * Update a template
   * @param {string} userId - User ID
   * @param {string} templateId - Template ID
   * @param {object} updateData - Update data
   * @returns {Promise} Updated template
   */
  async updateTemplate(userId, templateId, updateData) {
    try {
      if (!userId || !templateId) {
        throw new Error('User ID and Template ID are required');
      }

      // Check if template exists
      const template = await this.getTemplateById(userId, templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Update template fields
      const updatedTemplate = {
        ...template,
        ...updateData,
        id: template.id,
        userId: template.userId,
        createdAt: template.createdAt,
        updatedAt: new Date().toISOString()
      };

      // Save updated template (in a real implementation, this would update in a database)
      this.templates.get(userId).set(templateId, updatedTemplate);
      
      return updatedTemplate;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Delete a template
   * @param {string} userId - User ID
   * @param {string} templateId - Template ID
   * @returns {Promise} Deletion result
   */
  async deleteTemplate(userId, templateId) {
    try {
      if (!userId || !templateId) {
        throw new Error('User ID and Template ID are required');
      }

      // Check if template exists
      if (!this.templates.has(userId)) {
        return { success: false, message: 'Template not found' };
      }
      
      const userTemplates = this.templates.get(userId);
      if (!userTemplates.has(templateId)) {
        return { success: false, message: 'Template not found' };
      }

      // Delete template (in a real implementation, this would delete from a database)
      userTemplates.delete(templateId);
      
      return { success: true, message: 'Template deleted successfully' };
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Search templates by title or content
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @returns {Promise} Array of matching templates
   */
  async searchTemplates(userId, query) {
    try {
      if (!userId || !query) {
        throw new Error('User ID and search query are required');
      }

      // Get all user templates
      const templates = await this.getUserTemplates(userId);
      
      // Filter templates based on query
      const searchTerm = query.toLowerCase();
      const matchingTemplates = templates.filter(template => 
        template.title.toLowerCase().includes(searchTerm) ||
        template.content.toLowerCase().includes(searchTerm) ||
        (template.category && template.category.toLowerCase().includes(searchTerm))
      );
      
      return matchingTemplates;
    } catch (error) {
      console.error('Error searching templates:', error);
      throw error;
    }
  }

  /**
   * Get templates by category
   * @param {string} userId - User ID
   * @param {string} category - Category name
   * @returns {Promise} Array of templates in category
   */
  async getTemplatesByCategory(userId, category) {
    try {
      if (!userId || !category) {
        throw new Error('User ID and category are required');
      }

      // Get all user templates
      const templates = await this.getUserTemplates(userId);
      
      // Filter templates by category
      const categoryTemplates = templates.filter(template => 
        template.category && template.category.toLowerCase() === category.toLowerCase()
      );
      
      return categoryTemplates;
    } catch (error) {
      console.error('Error getting templates by category:', error);
      throw error;
    }
  }

  /**
   * Get all categories for a user
   * @param {string} userId - User ID
   * @returns {Promise} Array of categories
   */
  async getUserCategories(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Get all user templates
      const templates = await this.getUserTemplates(userId);
      
      // Extract unique categories
      const categories = [...new Set(templates.map(template => template.category).filter(Boolean))];
      
      return categories;
    } catch (error) {
      console.error('Error getting user categories:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new MessageTemplateService();