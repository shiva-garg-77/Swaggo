/**
 * Collaborative Editing Routes - API endpoints for collaborative document management
 * 
 * These routes provide endpoints for creating, managing, and editing collaborative documents.
 * 
 * @module CollaborativeEditingRoutes
 * @version 1.0.0
 */

import express from 'express';
import CollaborativeEditingService from '../../../Services/Features/CollaborativeEditingService.js';
import authMiddleware from '../../../Middleware/Authentication/AuthenticationMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/collab-docs
 * @desc    Create a new collaborative document
 * @access  Private
 */
router.post('/', authMiddleware.authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const docData = {
      ...req.body,
      createdBy: userId
    };
    
    const doc = await CollaborativeEditingService.createDocument(docData);
    
    res.status(201).json({
      success: true,
      doc
    });
  } catch (error) {
    console.error('Error creating collaborative document:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/collab-docs/:docId
 * @desc    Get collaborative document by ID
 * @access  Private
 */
router.get('/:docId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { docId } = req.params;
    const { userId } = req.user;
    
    const doc = await CollaborativeEditingService.getDocument(docId);
    
    // Check if user has access
    if (!doc.isCollaborator(userId) && doc.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      doc
    });
  } catch (error) {
    console.error('Error getting collaborative document:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/collab-docs/chat/:chatId
 * @desc    Get collaborative documents by chat ID
 * @access  Private
 */
router.get('/chat/:chatId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit, offset } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };
    
    const docs = await CollaborativeEditingService.getDocumentsByChat(chatId, options);
    
    res.json({
      success: true,
      docs
    });
  } catch (error) {
    console.error('Error getting collaborative documents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/collab-docs/user/:userId
 * @desc    Get collaborative documents by user ID
 * @access  Private
 */
router.get('/user/:userId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, offset } = req.query;
    
    // Only allow users to get their own documents
    if (userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const options = {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };
    
    const docs = await CollaborativeEditingService.getDocumentsByUser(userId, options);
    
    res.json({
      success: true,
      docs
    });
  } catch (error) {
    console.error('Error getting user collaborative documents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/collab-docs/:docId/collaborators
 * @desc    Add collaborator to document
 * @access  Private
 */
router.post('/:docId/collaborators', authMiddleware.authenticate, async (req, res) => {
  try {
    const { docId } = req.params;
    const { userId } = req.user;
    const { collaboratorId, role } = req.body;
    
    // Validate required fields
    if (!collaboratorId) {
      return res.status(400).json({
        success: false,
        error: 'Collaborator ID is required'
      });
    }
    
    const doc = await CollaborativeEditingService.getDocument(docId);
    
    // Check if user can add collaborators
    if (doc.createdBy !== userId && doc.getUserRole(userId) !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Only document owner can add collaborators'
      });
    }
    
    const updatedDoc = await CollaborativeEditingService.addCollaborator(docId, collaboratorId, role);
    
    res.json({
      success: true,
      doc: updatedDoc
    });
  } catch (error) {
    console.error('Error adding collaborator:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/collab-docs/:docId/collaborators/:collaboratorId
 * @desc    Remove collaborator from document
 * @access  Private
 */
router.delete('/:docId/collaborators/:collaboratorId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { docId, collaboratorId } = req.params;
    const { userId } = req.user;
    
    const doc = await CollaborativeEditingService.getDocument(docId);
    
    // Check if user can remove collaborators
    if (doc.createdBy !== userId && doc.getUserRole(userId) !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Only document owner can remove collaborators'
      });
    }
    
    const updatedDoc = await CollaborativeEditingService.removeCollaborator(docId, collaboratorId);
    
    res.json({
      success: true,
      doc: updatedDoc
    });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/collab-docs/:docId/collaborators/:collaboratorId/role
 * @desc    Update collaborator role
 * @access  Private
 */
router.put('/:docId/collaborators/:collaboratorId/role', authMiddleware.authenticate, async (req, res) => {
  try {
    const { docId, collaboratorId } = req.params;
    const { userId } = req.user;
    const { role } = req.body;
    
    // Validate required fields
    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required'
      });
    }
    
    const doc = await CollaborativeEditingService.getDocument(docId);
    
    // Check if user can update roles
    if (doc.createdBy !== userId && doc.getUserRole(userId) !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Only document owner can update collaborator roles'
      });
    }
    
    const updatedDoc = await CollaborativeEditingService.updateCollaboratorRole(docId, collaboratorId, role);
    
    res.json({
      success: true,
      doc: updatedDoc
    });
  } catch (error) {
    console.error('Error updating collaborator role:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/collab-docs/:docId/changes
 * @desc    Apply changes to document
 * @access  Private
 */
router.post('/:docId/changes', authMiddleware.authenticate, async (req, res) => {
  try {
    const { docId } = req.params;
    const { userId } = req.user;
    const { changes } = req.body;
    
    // Validate required fields
    if (!changes || !Array.isArray(changes)) {
      return res.status(400).json({
        success: false,
        error: 'Changes array is required'
      });
    }
    
    const doc = await CollaborativeEditingService.getDocument(docId);
    
    // Check if user can edit
    if (!doc.canUserEdit(userId)) {
      return res.status(403).json({
        success: false,
        error: 'User does not have permission to edit this document'
      });
    }
    
    const updatedDoc = await CollaborativeEditingService.applyChanges(docId, userId, changes);
    
    res.json({
      success: true,
      doc: updatedDoc
    });
  } catch (error) {
    console.error('Error applying changes:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/collab-docs/:docId/history
 * @desc    Get document change history
 * @access  Private
 */
router.get('/:docId/history', authMiddleware.authenticate, async (req, res) => {
  try {
    const { docId } = req.params;
    const { userId } = req.user;
    
    const doc = await CollaborativeEditingService.getDocument(docId);
    
    // Check if user has access
    if (!doc.isCollaborator(userId) && doc.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const history = await CollaborativeEditingService.getDocumentHistory(docId);
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error getting document history:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/collab-docs/:docId/revert/:version
 * @desc    Revert document to specific version
 * @access  Private
 */
router.post('/:docId/revert/:version', authMiddleware.authenticate, async (req, res) => {
  try {
    const { docId, version } = req.params;
    const { userId } = req.user;
    
    const updatedDoc = await CollaborativeEditingService.revertToVersion(docId, userId, parseInt(version));
    
    res.json({
      success: true,
      doc: updatedDoc
    });
  } catch (error) {
    console.error('Error reverting document:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/collab-docs/:docId
 * @desc    Delete collaborative document
 * @access  Private
 */
router.delete('/:docId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { docId } = req.params;
    const { userId } = req.user;
    
    const result = await CollaborativeEditingService.deleteDocument(docId, userId);
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;