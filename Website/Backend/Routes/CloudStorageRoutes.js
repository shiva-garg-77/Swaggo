/**
 * Cloud Storage Routes - API endpoints for cloud storage integration
 * 
 * These routes provide endpoints for connecting to cloud storage providers,
 * managing files, and handling OAuth callbacks.
 * 
 * @module CloudStorageRoutes
 * @version 1.0.0
 */

import express from 'express';
import cloudStorageService from '../Services/CloudStorageService.js';
import FileService from '../Services/FileService.js';
import authMiddleware from '../Middleware/AuthenticationMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/cloud/auth/:provider
 * @desc    Get OAuth authorization URL for a cloud provider
 * @access  Private
 */
router.get('/auth/:provider', authMiddleware.authenticate, (req, res) => {
  try {
    const { provider } = req.params;
    const { userId } = req.user;
    
    const authUrl = cloudStorageService.getAuthUrl(provider, userId);
    
    res.json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/cloud/callback/:provider
 * @desc    OAuth callback endpoint for cloud providers
 * @access  Public (OAuth redirect)
 */
router.get('/callback/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code or state'
      });
    }
    
    // Exchange code for token
    await cloudStorageService.exchangeCodeForToken(provider, code, state);
    
    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}/cloud-storage?connected=${provider}`);
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/cloud-storage?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * @route   GET /api/cloud/providers
 * @desc    Get list of connected cloud providers for user
 * @access  Private
 */
router.get('/providers', authMiddleware.authenticate, (req, res) => {
  try {
    const { userId } = req.user;
    const providers = cloudStorageService.getConnectedProviders(userId);
    
    res.json({
      success: true,
      providers
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/cloud/providers/:provider
 * @desc    Disconnect a cloud provider
 * @access  Private
 */
router.delete('/providers/:provider', authMiddleware.authenticate, (req, res) => {
  try {
    const { provider } = req.params;
    const { userId } = req.user;
    
    cloudStorageService.disconnectProvider(provider, userId);
    
    res.json({
      success: true,
      message: `Disconnected from ${provider}`
    });
  } catch (error) {
    console.error('Error disconnecting provider:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/cloud/upload
 * @desc    Upload file to cloud storage
 * @access  Private
 */
router.post('/upload', authMiddleware.authenticate, async (req, res) => {
  try {
    const { provider, fileId, options } = req.body;
    const { userId } = req.user;
    
    if (!provider || !fileId) {
      return res.status(400).json({
        success: false,
        error: 'Provider and fileId are required'
      });
    }
    
    // Get file from local storage
    const file = await FileService.getFile(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    // Prepare file data for cloud upload
    const fileData = {
      path: file.path,
      filename: file.originalname,
      mimeType: file.mimetype
    };
    
    // Upload to cloud storage
    const result = await cloudStorageService.uploadFile(provider, userId, fileData, options);
    
    // Update file record with cloud provider info
    file.cloudProvider = provider;
    file.cloudFileId = result.fileId;
    await file.save();
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error uploading to cloud:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/cloud/files/:provider
 * @desc    List files from cloud storage
 * @access  Private
 */
router.get('/files/:provider', authMiddleware.authenticate, async (req, res) => {
  try {
    const { provider } = req.params;
    const { userId } = req.user;
    const { limit, query } = req.query;
    
    const options = {
      limit: parseInt(limit) || 100,
      query
    };
    
    const files = await cloudStorageService.listFiles(provider, userId, options);
    
    res.json({
      success: true,
      files
    });
  } catch (error) {
    console.error('Error listing cloud files:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/cloud/download/:provider/:fileId
 * @desc    Download file from cloud storage
 * @access  Private
 */
router.get('/download/:provider/:fileId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { provider, fileId } = req.params;
    const { userId } = req.user;
    
    // Create temporary download path
    const tempDir = path.join(process.cwd(), 'temp');
    const tempDirExists = await fs.promises.access(tempDir, fs.constants.F_OK).then(() => true).catch(() => false);
    if (!tempDirExists) {
      await fs.promises.mkdir(tempDir, { recursive: true });
    }
    
    const tempPath = path.join(tempDir, `cloud_${Date.now()}_${fileId}`);
    
    // Download from cloud storage
    await cloudStorageService.downloadFile(provider, userId, fileId, tempPath);
    
    // Send file to client
    res.download(tempPath, async (err) => {
      // Clean up temporary file
      const tempFileExists = await fs.promises.access(tempPath, fs.constants.F_OK).then(() => true).catch(() => false);
      if (tempFileExists) {
        await fs.promises.unlink(tempPath);
      }
      
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Error downloading file'
          });
        }
      }
    });
  } catch (error) {
    console.error('Error downloading from cloud:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/cloud/files/:provider/:fileId
 * @desc    Delete file from cloud storage
 * @access  Private
 */
router.delete('/files/:provider/:fileId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { provider, fileId } = req.params;
    const { userId } = req.user;
    
    await cloudStorageService.deleteFile(provider, userId, fileId);
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting from cloud:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;