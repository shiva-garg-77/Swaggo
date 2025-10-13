import express from 'express';
import APMIntegration from '../utils/APMIntegration.js'; // 🔧 APM #87: Import APM integration

const router = express.Router();

// In-memory storage for error reports (in production, you would use a database)
const errorReports = [];
const MAX_REPORTS = 1000;

/**
 * POST /api/monitoring/errors
 * Receive error reports from frontend
 */
router.post('/errors', (req, res) => {
  try {
    const errorReport = req.body;
    
    // Add timestamp
    errorReport.receivedAt = new Date().toISOString();
    errorReport.id = Date.now() + '-' + Math.random().toString(36).substring(2, 15);
    
    // Add to reports array
    errorReports.push(errorReport);
    
    // Limit array size
    if (errorReports.length > MAX_REPORTS) {
      errorReports.shift();
    }
    
    console.log('Error report received:', {
      sessionId: errorReport.sessionId,
      error: errorReport.error?.name,
      message: errorReport.error?.message,
      environment: errorReport.metadata?.environment
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Error report received',
      id: errorReport.id
    });
  } catch (error) {
    console.error('Error processing error report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process error report' 
    });
  }
});

/**
 * GET /api/monitoring/errors
 * Get recent error reports (protected endpoint)
 */
router.get('/errors', (req, res) => {
  try {
    // In a real implementation, you would check authentication/authorization
    // For now, we'll just return the reports if in development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      reports: errorReports.slice(-50), // Return last 50 reports
      total: errorReports.length
    });
  } catch (error) {
    console.error('Error fetching error reports:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch error reports' 
    });
  }
});

/**
 * DELETE /api/monitoring/errors
 * Clear error reports (protected endpoint)
 */
router.delete('/errors', (req, res) => {
  try {
    // In a real implementation, you would check authentication/authorization
    // For now, we'll just clear the reports if in development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    const count = errorReports.length;
    errorReports.length = 0;
    
    res.status(200).json({ 
      success: true, 
      message: `Cleared ${count} error reports` 
    });
  } catch (error) {
    console.error('Error clearing error reports:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear error reports' 
    });
  }
});

// 🔧 APM #87: Add APM metrics endpoint
/**
 * GET /api/monitoring/apm/metrics
 * Get APM metrics
 */
router.get('/apm/metrics', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const metrics = APMIntegration.getRecentMetrics(parseInt(limit));
    const status = APMIntegration.getStatus();
    
    res.status(200).json({ 
      success: true,
      metrics,
      status
    });
  } catch (error) {
    console.error('Error fetching APM metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch APM metrics' 
    });
  }
});

// 🔧 APM #87: Add APM traces endpoint
/**
 * GET /api/monitoring/apm/traces
 * Get APM traces
 */
router.get('/apm/traces', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const traces = APMIntegration.getRecentTraces(parseInt(limit));
    const status = APMIntegration.getStatus();
    
    res.status(200).json({ 
      success: true,
      traces,
      status
    });
  } catch (error) {
    console.error('Error fetching APM traces:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch APM traces' 
    });
  }
});

// 🔧 APM #87: Add APM status endpoint
/**
 * GET /api/monitoring/apm/status
 * Get APM system status
 */
router.get('/apm/status', (req, res) => {
  try {
    const status = APMIntegration.getStatus();
    
    res.status(200).json({ 
      success: true,
      status
    });
  } catch (error) {
    console.error('Error fetching APM status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch APM status' 
    });
  }
});

export default router;