/**
 * Poll Routes - API endpoints for poll management
 * 
 * These routes provide endpoints for creating, voting in, and managing polls.
 * 
 * @module PollRoutes
 * @version 1.0.0
 */

import express from 'express';
import PollService from '../Services/PollService.js';
import authMiddleware from '../Middleware/AuthenticationMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/polls
 * @desc    Create a new poll
 * @access  Private
 */
router.post('/', authMiddleware.authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const pollData = {
      ...req.body,
      createdBy: userId
    };
    
    const poll = await PollService.createPoll(pollData);
    
    res.status(201).json({
      success: true,
      poll
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/polls/:pollId
 * @desc    Get poll by ID
 * @access  Private
 */
router.get('/:pollId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { pollId } = req.params;
    
    const poll = await PollService.getPoll(pollId);
    
    res.json({
      success: true,
      poll
    });
  } catch (error) {
    console.error('Error getting poll:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/polls/chat/:chatId
 * @desc    Get polls by chat ID
 * @access  Private
 */
router.get('/chat/:chatId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { excludeClosed, limit, offset } = req.query;
    
    const options = {
      excludeClosed: excludeClosed === 'true',
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };
    
    const polls = await PollService.getPollsByChat(chatId, options);
    
    res.json({
      success: true,
      polls
    });
  } catch (error) {
    console.error('Error getting polls:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/polls/:pollId/vote
 * @desc    Vote in a poll
 * @access  Private
 */
router.post('/:pollId/vote', authMiddleware.authenticate, async (req, res) => {
  try {
    const { pollId } = req.params;
    const { userId } = req.user;
    const { optionIds } = req.body;
    
    if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Option IDs are required'
      });
    }
    
    const poll = await PollService.vote(pollId, userId, optionIds);
    
    res.json({
      success: true,
      poll
    });
  } catch (error) {
    console.error('Error voting in poll:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/polls/:pollId/results
 * @desc    Get poll results
 * @access  Private
 */
router.get('/:pollId/results', authMiddleware.authenticate, async (req, res) => {
  try {
    const { pollId } = req.params;
    
    const results = await PollService.getResults(pollId);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error getting poll results:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/polls/:pollId/close
 * @desc    Close a poll
 * @access  Private
 */
router.put('/:pollId/close', authMiddleware.authenticate, async (req, res) => {
  try {
    const { pollId } = req.params;
    
    const poll = await PollService.closePoll(pollId);
    
    res.json({
      success: true,
      poll
    });
  } catch (error) {
    console.error('Error closing poll:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/polls/:pollId/reopen
 * @desc    Reopen a poll
 * @access  Private
 */
router.put('/:pollId/reopen', authMiddleware.authenticate, async (req, res) => {
  try {
    const { pollId } = req.params;
    
    const poll = await PollService.reopenPoll(pollId);
    
    res.json({
      success: true,
      poll
    });
  } catch (error) {
    console.error('Error reopening poll:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/polls/:pollId
 * @desc    Delete a poll
 * @access  Private
 */
router.delete('/:pollId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { pollId } = req.params;
    
    const result = await PollService.deletePoll(pollId);
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/polls/chat/:chatId/analytics
 * @desc    Get poll analytics for a chat
 * @access  Private
 */
router.get('/chat/:chatId/analytics', authMiddleware.authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit, offset } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };
    
    const analytics = await PollService.getAnalytics(chatId, options);
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error getting poll analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;