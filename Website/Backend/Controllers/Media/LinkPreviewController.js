import LinkPreviewService from '../../Services/Media/LinkPreviewService.js';
import { URL } from 'url';

class LinkPreviewController {
  /**
   * Get link preview for a URL
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getLinkPreview(req, res) {
    try {
      const { url, detailed = false } = req.query;

      // Validate URL
      if (!url) {
        return res.status(400).json({
          error: 'URL parameter is required'
        });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid URL format'
        });
      }

      // Extract link preview
      const previewData = await LinkPreviewService.extractLinkPreview(url);

      // Add additional metadata if detailed view is requested
      if (detailed && previewData) {
        previewData.requestedAt = new Date().toISOString();
        previewData.cacheHit = false; // This would be set to true if cached
      }

      res.json(previewData);
    } catch (error) {
      console.error('Error in link preview controller:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get cache statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCacheStats(req, res) {
    try {
      const stats = {
        cacheSize: LinkPreviewService.getCacheSize(),
        cacheExpiry: LinkPreviewService.cacheExpiry
      };

      res.json(stats);
    } catch (error) {
      console.error('Error in cache stats controller:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Clear expired cache entries
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async clearExpiredCache(req, res) {
    try {
      LinkPreviewService.clearExpiredCache();
      res.json({
        message: 'Expired cache entries cleared'
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}

export default new LinkPreviewController();