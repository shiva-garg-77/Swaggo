/**
 * Sentiment Analysis Routes - API endpoints for AI-powered message sentiment analysis
 * 
 * This file defines the REST API endpoints for sentiment analysis functionality.
 */

import express from 'express';
import SentimentAnalysisController from '../../../Controllers/Features/SentimentAnalysisController.js';
import authMiddleware from '../../../Middleware/Authentication/AuthenticationMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/sentiment
 * @desc    Analyze sentiment of a single message
 * @access  Private
 */
router.post('/', authMiddleware.authenticate, SentimentAnalysisController.analyzeSentiment);

/**
 * @route   POST /api/sentiment/batch
 * @desc    Batch analyze sentiment for multiple messages
 * @access  Private
 */
router.post('/batch', authMiddleware.authenticate, SentimentAnalysisController.batchAnalyze);

/**
 * @route   GET /api/sentiment/definitions
 * @desc    Get sentiment definitions
 * @access  Public
 */
router.get('/definitions', SentimentAnalysisController.getDefinitions);

/**
 * @route   GET /api/sentiment/metrics
 * @desc    Get performance metrics
 * @access  Private (Admin only)
 */
router.get('/metrics', authMiddleware.authenticate, SentimentAnalysisController.getMetrics);

export default router;