/**
 * Smart Categorization Routes - API endpoints for AI-powered message categorization
 * 
 * This file defines the REST API endpoints for smart categorization functionality.
 */

import express from 'express';
import SmartCategorizationController from '../../../Controllers/Features/SmartCategorizationController.js';
import authMiddleware from '../../../Middleware/Authentication/AuthenticationMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/categorize
 * @desc    Categorize a single message
 * @access  Private
 */
router.post('/', authMiddleware.authenticate, SmartCategorizationController.categorizeMessage);

/**
 * @route   POST /api/categorize/batch
 * @desc    Batch categorize multiple messages
 * @access  Private
 */
router.post('/batch', authMiddleware.authenticate, SmartCategorizationController.batchCategorize);

/**
 * @route   GET /api/categorize/categories
 * @desc    Get category definitions
 * @access  Public
 */
router.get('/categories', SmartCategorizationController.getCategories);

/**
 * @route   GET /api/categorize/metrics
 * @desc    Get performance metrics
 * @access  Private (Admin only)
 */
router.get('/metrics', authMiddleware.authenticate, SmartCategorizationController.getMetrics);

/**
 * @route   PUT /api/categorize/categories/:category
 * @desc    Update category definitions
 * @access  Private (Admin only)
 */
router.put('/categories/:category', authMiddleware.authenticate, SmartCategorizationController.updateCategory);

export default router;