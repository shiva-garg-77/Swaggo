import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../../Models/User.js';
import Chat from '../../Models/FeedModels/Chat.js';
import Message from '../../Models/FeedModels/Message.js';
import AuthenticationMiddleware from '../../Middleware/Authentication/AuthenticationMiddleware.js';
import ApiResponse from '../../utils/ApiResponse.js';

const router = express.Router();
const { sendSuccess, sendError, sendUnauthorized, sendValidationError } = ApiResponse;

/**
 * 🔄 SYNC CONTROLLER
 * 
 * Handles real-time state synchronization between frontend and backend
 * Supports offline-first architecture with conflict resolution
 */

// Apply authentication middleware to all routes
router.use(AuthenticationMiddleware.authenticate);

/**
 * Sync a single operation
 * POST /api/sync/operation
 */
router.post('/operation', [
  body('operationId').notEmpty().withMessage('Operation ID is required'),
  body('type').isIn(['create', 'update', 'delete', 'patch']).withMessage('Invalid operation type'),
  body('entityType').notEmpty().withMessage('Entity type is required'),
  body('entityId').notEmpty().withMessage('Entity ID is required'),
  body('data').isObject().withMessage('Data must be an object'),
  body('version').optional().isNumeric().withMessage('Version must be a number'),
  body('timestamp').optional().isISO8601().withMessage('Timestamp must be valid ISO date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const { operationId, type, entityType, entityId, data, version, timestamp, metadata } = req.body;
    const userId = req.user.id;

    // Log the sync operation
    console.log(`🔄 Sync operation received: ${type} ${entityType}:${entityId}`, {
      operationId,
      userId,
      version,
      timestamp
    });

    let result = null;
    let success = true;
    let error = null;

    // Handle different entity types
    switch (entityType) {
      case 'message':
        result = await syncMessage(type, entityId, data, userId);
        break;
      case 'chat':
        result = await syncChat(type, entityId, data, userId);
        break;
      case 'user':
        result = await syncUser(type, entityId, data, userId);
        break;
      default:
        success = false;
        error = `Unsupported entity type: ${entityType}`;
    }

    if (success) {
      return sendSuccess(res, {
        operationId,
        success: true,
        entityType,
        entityId,
        entityData: result,
        version: version ? version + 1 : 1,
        timestamp: new Date().toISOString()
      }, 'Operation synced successfully');
    } else {
      return sendError(res, error || 'Failed to sync operation', 400, 'SYNC_ERROR');
    }

  } catch (error) {
    console.error('Sync operation error:', error);
    return sendError(res, 'Failed to process sync operation', 500, 'SERVER_ERROR');
  }
});

/**
 * Sync a batch of operations
 * POST /api/sync/batch
 */
router.post('/batch', [
  body('operations').isArray({ min: 1 }).withMessage('Operations must be a non-empty array'),
  body('operations.*.operationId').notEmpty().withMessage('Operation ID is required'),
  body('operations.*.type').isIn(['create', 'update', 'delete', 'patch']).withMessage('Invalid operation type'),
  body('operations.*.entityType').notEmpty().withMessage('Entity type is required'),
  body('operations.*.entityId').notEmpty().withMessage('Entity ID is required'),
  body('operations.*.data').isObject().withMessage('Data must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const { operations, compression = false } = req.body;
    const userId = req.user.id;
    const results = [];
    const errorsList = [];

    console.log(`📦 Batch sync received: ${operations.length} operations`, {
      userId,
      compression
    });

    // Process operations in sequence to maintain order
    for (const operation of operations) {
      try {
        const { operationId, type, entityType, entityId, data, version, timestamp } = operation;
        
        let result = null;
        let success = true;
        let error = null;

        // Handle different entity types
        switch (entityType) {
          case 'message':
            result = await syncMessage(type, entityId, data, userId);
            break;
          case 'chat':
            result = await syncChat(type, entityId, data, userId);
            break;
          case 'user':
            result = await syncUser(type, entityId, data, userId);
            break;
          default:
            success = false;
            error = `Unsupported entity type: ${entityType}`;
        }

        if (success) {
          results.push({
            operationId,
            success: true,
            entityType,
            entityId,
            entityData: result,
            version: version ? version + 1 : 1,
            timestamp: new Date().toISOString()
          });
        } else {
          errorsList.push({
            operationId,
            success: false,
            error: error || 'Failed to sync operation'
          });
        }
      } catch (opError) {
        errorsList.push({
          operationId: operation.operationId,
          success: false,
          error: opError.message
        });
      }
    }

    return sendSuccess(res, {
      batchId: `batch_${Date.now()}`,
      results,
      errors: errorsList
    }, `Batch sync completed: ${results.length} successful, ${errorsList.length} failed`);

  } catch (error) {
    console.error('Batch sync error:', error);
    return sendError(res, 'Failed to process batch sync', 500, 'SERVER_ERROR');
  }
});

/**
 * Sync missed updates since a specific timestamp
 * POST /api/sync/missed
 */
router.post('/missed', [
  body('since').isISO8601().withMessage('Since must be a valid ISO date'),
  body('entityTypes').optional().isArray().withMessage('Entity types must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const { since, entityTypes = ['message', 'chat'] } = req.body;
    const userId = req.user.id;
    const updates = [];

    console.log(`🔄 Syncing missed updates since: ${since}`, {
      userId,
      entityTypes
    });

    // Get missed updates for each entity type
    for (const entityType of entityTypes) {
      try {
        let entityUpdates = [];
        
        switch (entityType) {
          case 'message':
            entityUpdates = await getMissedMessages(userId, since);
            break;
          case 'chat':
            entityUpdates = await getMissedChats(userId, since);
            break;
        }
        
        updates.push(...entityUpdates);
      } catch (error) {
        console.error(`Failed to get missed updates for ${entityType}:`, error);
      }
    }

    return sendSuccess(res, {
      updates,
      count: updates.length,
      since
    }, `Retrieved ${updates.length} missed updates`);

  } catch (error) {
    console.error('Missed updates sync error:', error);
    return sendError(res, 'Failed to sync missed updates', 500, 'SERVER_ERROR');
  }
});

/**
 * Get sync status for entities
 * GET /api/sync/status
 */
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get last sync time for user
    const lastSyncTime = req.user.lastSyncTime || new Date(0);
    
    // Get pending operations count
    // In a real implementation, this would query a sync operations table
    const pendingOperations = 0;
    
    return sendSuccess(res, {
      userId,
      lastSyncTime,
      pendingOperations,
      isOnline: true,
      serverTime: new Date().toISOString()
    }, 'Sync status retrieved successfully');

  } catch (error) {
    console.error('Sync status error:', error);
    return sendError(res, 'Failed to get sync status', 500, 'SERVER_ERROR');
  }
});

// === Helper Functions ===

/**
 * Sync message operations
 */
async function syncMessage(type, messageId, data, userId) {
  try {
    switch (type) {
      case 'create':
      case 'update':
        // For messages, we typically only create new ones
        const message = new Message({
          ...data,
          sender: userId,
          timestamp: data.timestamp || new Date()
        });
        
        await message.save();
        return message.toObject();
        
      case 'delete':
        await Message.deleteOne({ _id: messageId, sender: userId });
        return { deleted: true };
        
      default:
        throw new Error(`Unsupported message operation: ${type}`);
    }
  } catch (error) {
    console.error('Message sync error:', error);
    throw error;
  }
}

/**
 * Sync chat operations
 */
async function syncChat(type, chatId, data, userId) {
  try {
    switch (type) {
      case 'create':
      case 'update':
        let chat;
        if (chatId) {
          chat = await Chat.findOneAndUpdate(
            { _id: chatId },
            { ...data, updatedAt: new Date() },
            { new: true, upsert: true }
          );
        } else {
          chat = new Chat({
            ...data,
            participants: [...new Set([...(data.participants || []), userId])],
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await chat.save();
        }
        return chat.toObject();
        
      case 'delete':
        await Chat.deleteOne({ _id: chatId });
        return { deleted: true };
        
      default:
        throw new Error(`Unsupported chat operation: ${type}`);
    }
  } catch (error) {
    console.error('Chat sync error:', error);
    throw error;
  }
}

/**
 * Sync user operations
 */
async function syncUser(type, userId, data, requesterId) {
  try {
    // Users can only update their own profile
    if (userId !== requesterId) {
      throw new Error('Unauthorized: Cannot update other users');
    }
    
    switch (type) {
      case 'update':
        const user = await User.findByIdAndUpdate(
          userId,
          { ...data, updatedAt: new Date() },
          { new: true }
        );
        return user.toObject();
        
      case 'create':
      case 'delete':
        throw new Error(`Unsupported user operation: ${type}`);
        
      default:
        throw new Error(`Unsupported user operation: ${type}`);
    }
  } catch (error) {
    console.error('User sync error:', error);
    throw error;
  }
}

/**
 * Get missed messages since timestamp
 */
async function getMissedMessages(userId, since) {
  try {
    // Find messages where user is a participant and created after 'since'
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { 'recipients.userId': userId }
      ],
      timestamp: { $gte: new Date(since) }
    }).sort({ timestamp: 1 }).limit(100);
    
    return messages.map(msg => ({
      entityType: 'message',
      entityId: msg._id,
      data: msg.toObject(),
      timestamp: msg.timestamp
    }));
  } catch (error) {
    console.error('Get missed messages error:', error);
    return [];
  }
}

/**
 * Get missed chats since timestamp
 */
async function getMissedChats(userId, since) {
  try {
    // Find chats where user is a participant and updated after 'since'
    const chats = await Chat.find({
      participants: userId,
      updatedAt: { $gte: new Date(since) }
    }).sort({ updatedAt: 1 }).limit(50);
    
    return chats.map(chat => ({
      entityType: 'chat',
      entityId: chat._id,
      data: chat.toObject(),
      timestamp: chat.updatedAt
    }));
  } catch (error) {
    console.error('Get missed chats error:', error);
    return [];
  }
}

export default router;