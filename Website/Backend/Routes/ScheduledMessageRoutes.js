import express from 'express';
import ScheduledMessage from '../Models/FeedModels/ScheduledMessage.js';
import ScheduledMessageService from '../Services/ScheduledMessageService.js';
import authMiddleware from '../Middleware/AuthenticationMiddleware.js';

const router = express.Router();

// Get scheduled messages for a user or chat
router.get('/', authMiddleware.authenticate, async (req, res) => {
  try {
    const { chatId } = req.query;
    const userId = req.user.profileid;
    
    let messages;
    if (chatId) {
      messages = await ScheduledMessageService.getScheduledMessagesByChat(chatId);
    } else {
      messages = await ScheduledMessageService.getScheduledMessagesByUser(userId);
    }
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled messages' });
  }
});

// Get a specific scheduled message
router.get('/:scheduledMessageId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { scheduledMessageId } = req.params;
    const userId = req.user.profileid;
    
    const scheduledMessage = await ScheduledMessage.findOne({ scheduledMessageId });
    if (!scheduledMessage) {
      return res.status(404).json({ error: 'Scheduled message not found' });
    }
    
    // Check if user has permission to view this message
    if (scheduledMessage.senderid !== userId) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    res.json(scheduledMessage);
  } catch (error) {
    console.error('Error fetching scheduled message:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled message' });
  }
});

// Update a scheduled message
router.patch('/:scheduledMessageId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { scheduledMessageId } = req.params;
    const userId = req.user.profileid;
    const updateData = req.body;
    
    const scheduledMessage = await ScheduledMessage.findOne({ scheduledMessageId });
    if (!scheduledMessage) {
      return res.status(404).json({ error: 'Scheduled message not found' });
    }
    
    // Check if user has permission to update this message
    if (scheduledMessage.senderid !== userId) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Update allowed fields
    const allowedUpdates = ['content', 'scheduledFor'];
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        scheduledMessage[field] = updateData[field];
      }
    });
    
    await scheduledMessage.save();
    
    res.json(scheduledMessage);
  } catch (error) {
    console.error('Error updating scheduled message:', error);
    res.status(500).json({ error: 'Failed to update scheduled message' });
  }
});

// Cancel a scheduled message
router.delete('/:scheduledMessageId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { scheduledMessageId } = req.params;
    const userId = req.user.profileid;
    
    const scheduledMessage = await ScheduledMessage.findOne({ scheduledMessageId });
    if (!scheduledMessage) {
      return res.status(404).json({ error: 'Scheduled message not found' });
    }
    
    // Check if user has permission to cancel this message
    if (scheduledMessage.senderid !== userId) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    await ScheduledMessageService.cancelScheduledMessage(scheduledMessageId);
    
    res.json({ message: 'Scheduled message cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling scheduled message:', error);
    res.status(500).json({ error: 'Failed to cancel scheduled message' });
  }
});

export default router;