/**
 * Smart Categorization Controller - Handles smart categorization HTTP requests
 * 
 * This controller provides endpoints for AI-powered message categorization and tagging.
 */

import SmartCategorizationService from '../../Services/Features/SmartCategorizationService.js';

class SmartCategorizationController {
  /**
   * Categorize a single message
   * POST /api/categorize
   */
  async categorizeMessage(req, res) {
    try {
      const { message, context } = req.body;
      const userId = req.user?.profileid;

      // Validate input
      if (!message) {
        return res.status(400).json({ 
          success: false, 
          message: 'Message content is required' 
        });
      }

      // Perform categorization
      const result = await SmartCategorizationService.categorizeMessage(message, context);

      // Return success response
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Message categorization error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to categorize message',
        error: error.message 
      });
    }
  }

  /**
   * Batch categorize multiple messages
   * POST /api/categorize/batch
   */
  async batchCategorize(req, res) {
    try {
      const { messages } = req.body;
      const userId = req.user?.profileid;

      // Validate input
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Messages must be an array' 
        });
      }

      // Perform batch categorization
      const results = await SmartCategorizationService.batchCategorize(messages);

      // Return success response
      return res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Batch categorization error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to categorize messages',
        error: error.message 
      });
    }
  }

  /**
   * Get category definitions
   * GET /api/categorize/categories
   */
  async getCategories(req, res) {
    try {
      const categories = SmartCategorizationService.getCategoryDefinitions();

      // Return success response
      return res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Get categories error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get categories',
        error: error.message 
      });
    }
  }

  /**
   * Get performance metrics
   * GET /api/categorize/metrics
   */
  async getMetrics(req, res) {
    try {
      const metrics = SmartCategorizationService.getMetrics();

      // Return success response
      return res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Get metrics error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get metrics',
        error: error.message 
      });
    }
  }

  /**
   * Update category definitions
   * PUT /api/categorize/categories/:category
   */
  async updateCategory(req, res) {
    try {
      const { category } = req.params;
      const { keywords, weight } = req.body;
      const userId = req.user?.profileid;

      // Validate input
      if (!category) {
        return res.status(400).json({ 
          success: false, 
          message: 'Category is required' 
        });
      }

      if (!keywords || !Array.isArray(keywords)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Keywords must be an array' 
        });
      }

      if (typeof weight !== 'number' || weight < 0 || weight > 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Weight must be a number between 0 and 1' 
        });
      }

      // Update category
      SmartCategorizationService.updateCategory(category, keywords, weight);

      // Return success response
      return res.status(200).json({
        success: true,
        message: `Category ${category} updated successfully`
      });
    } catch (error) {
      console.error('Update category error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update category',
        error: error.message 
      });
    }
  }
}

// Export singleton instance
export default new SmartCategorizationController();