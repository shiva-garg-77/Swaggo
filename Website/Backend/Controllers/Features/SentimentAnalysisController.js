/**
 * Sentiment Analysis Controller - Handles sentiment analysis HTTP requests
 * 
 * This controller provides endpoints for AI-powered message sentiment analysis.
 */

import SentimentAnalysisService from '../../Services/Features/SentimentAnalysisService.js';

class SentimentAnalysisController {
  /**
   * Analyze sentiment of a single message
   * POST /api/sentiment
   */
  async analyzeSentiment(req, res) {
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

      // Perform sentiment analysis
      const result = await SentimentAnalysisService.analyzeSentiment(message, context);

      // Return success response
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to analyze sentiment',
        error: error.message 
      });
    }
  }

  /**
   * Batch analyze sentiment for multiple messages
   * POST /api/sentiment/batch
   */
  async batchAnalyze(req, res) {
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

      // Perform batch sentiment analysis
      const results = await SentimentAnalysisService.batchAnalyze(messages);

      // Return success response
      return res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Batch sentiment analysis error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to analyze sentiment for messages',
        error: error.message 
      });
    }
  }

  /**
   * Get sentiment definitions
   * GET /api/sentiment/definitions
   */
  async getDefinitions(req, res) {
    try {
      const definitions = SentimentAnalysisService.getSentimentDefinitions();

      // Return success response
      return res.status(200).json({
        success: true,
        data: definitions
      });
    } catch (error) {
      console.error('Get sentiment definitions error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get sentiment definitions',
        error: error.message 
      });
    }
  }

  /**
   * Get performance metrics
   * GET /api/sentiment/metrics
   */
  async getMetrics(req, res) {
    try {
      const metrics = SentimentAnalysisService.getMetrics();

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
}

// Export singleton instance
export default new SentimentAnalysisController();