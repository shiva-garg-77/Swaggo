/**
 * Message Template Controller - Handles message template HTTP requests
 * 
 * This controller provides endpoints for managing message templates.
 */

import MessageTemplateService from '../../Services/Messaging/MessageTemplateService.js';

class MessageTemplateController {
  /**
   * Create a new message template
   * POST /api/templates
   */
  async createTemplate(req, res) {
    try {
      const { title, content, category } = req.body;
      const userId = req.user?.profileid;

      // Validate input
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      if (!title || !content) {
        return res.status(400).json({ 
          success: false, 
          message: 'Template title and content are required' 
        });
      }

      // Create template
      const templateData = { title, content, category };
      const template = await MessageTemplateService.createTemplate(userId, templateData);

      // Return success response
      return res.status(201).json({
        success: true,
        data: template,
        message: 'Template created successfully'
      });
    } catch (error) {
      console.error('Create template error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create template',
        error: error.message 
      });
    }
  }

  /**
   * Get all templates for a user
   * GET /api/templates
   */
  async getUserTemplates(req, res) {
    try {
      const userId = req.user?.profileid;

      // Validate input
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      // Get user templates
      const templates = await MessageTemplateService.getUserTemplates(userId);

      // Return success response
      return res.status(200).json({
        success: true,
        data: templates,
        count: templates.length
      });
    } catch (error) {
      console.error('Get user templates error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get templates',
        error: error.message 
      });
    }
  }

  /**
   * Get a specific template by ID
   * GET /api/templates/:templateId
   */
  async getTemplateById(req, res) {
    try {
      const { templateId } = req.params;
      const userId = req.user?.profileid;

      // Validate input
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      if (!templateId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Template ID is required' 
        });
      }

      // Get template
      const template = await MessageTemplateService.getTemplateById(userId, templateId);

      if (!template) {
        return res.status(404).json({ 
          success: false, 
          message: 'Template not found' 
        });
      }

      // Return success response
      return res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Get template error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get template',
        error: error.message 
      });
    }
  }

  /**
   * Update a template
   * PUT /api/templates/:templateId
   */
  async updateTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const { title, content, category } = req.body;
      const userId = req.user?.profileid;

      // Validate input
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      if (!templateId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Template ID is required' 
        });
      }

      // Update template
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (category !== undefined) updateData.category = category;

      const template = await MessageTemplateService.updateTemplate(userId, templateId, updateData);

      // Return success response
      return res.status(200).json({
        success: true,
        data: template,
        message: 'Template updated successfully'
      });
    } catch (error) {
      console.error('Update template error:', error);
      
      if (error.message === 'Template not found') {
        return res.status(404).json({ 
          success: false, 
          message: 'Template not found' 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update template',
        error: error.message 
      });
    }
  }

  /**
   * Delete a template
   * DELETE /api/templates/:templateId
   */
  async deleteTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const userId = req.user?.profileid;

      // Validate input
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      if (!templateId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Template ID is required' 
        });
      }

      // Delete template
      const result = await MessageTemplateService.deleteTemplate(userId, templateId);

      if (!result.success) {
        return res.status(404).json({ 
          success: false, 
          message: result.message 
        });
      }

      // Return success response
      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Delete template error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete template',
        error: error.message 
      });
    }
  }

  /**
   * Search templates
   * GET /api/templates/search?query=...
   */
  async searchTemplates(req, res) {
    try {
      const { query } = req.query;
      const userId = req.user?.profileid;

      // Validate input
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      if (!query) {
        return res.status(400).json({ 
          success: false, 
          message: 'Search query is required' 
        });
      }

      // Search templates
      const templates = await MessageTemplateService.searchTemplates(userId, query);

      // Return success response
      return res.status(200).json({
        success: true,
        data: templates,
        count: templates.length
      });
    } catch (error) {
      console.error('Search templates error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to search templates',
        error: error.message 
      });
    }
  }

  /**
   * Get templates by category
   * GET /api/templates/category/:category
   */
  async getTemplatesByCategory(req, res) {
    try {
      const { category } = req.params;
      const userId = req.user?.profileid;

      // Validate input
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      if (!category) {
        return res.status(400).json({ 
          success: false, 
          message: 'Category is required' 
        });
      }

      // Get templates by category
      const templates = await MessageTemplateService.getTemplatesByCategory(userId, category);

      // Return success response
      return res.status(200).json({
        success: true,
        data: templates,
        count: templates.length
      });
    } catch (error) {
      console.error('Get templates by category error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get templates by category',
        error: error.message 
      });
    }
  }

  /**
   * Get user categories
   * GET /api/templates/categories
   */
  async getUserCategories(req, res) {
    try {
      const userId = req.user?.profileid;

      // Validate input
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      // Get user categories
      const categories = await MessageTemplateService.getUserCategories(userId);

      // Return success response
      return res.status(200).json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      console.error('Get user categories error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get categories',
        error: error.message 
      });
    }
  }
}

// Export singleton instance
export default new MessageTemplateController();