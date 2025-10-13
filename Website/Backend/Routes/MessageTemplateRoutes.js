/**
 * Message Template Routes - API endpoints for managing message templates
 * 
 * This file defines the REST API endpoints for message template functionality.
 */

import express from 'express';
import MessageTemplateController from '../Controllers/MessageTemplateController.js';
import authMiddleware from '../Middleware/AuthenticationMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/templates
 * @desc    Create a new message template
 * @access  Private
 */
router.post('/', authMiddleware.authenticate, MessageTemplateController.createTemplate);

/**
 * @route   GET /api/templates
 * @desc    Get all templates for a user
 * @access  Private
 */
router.get('/', authMiddleware.authenticate, MessageTemplateController.getUserTemplates);

/**
 * @route   GET /api/templates/:templateId
 * @desc    Get a specific template by ID
 * @access  Private
 */
router.get('/:templateId', authMiddleware.authenticate, MessageTemplateController.getTemplateById);

/**
 * @route   PUT /api/templates/:templateId
 * @desc    Update a template
 * @access  Private
 */
router.put('/:templateId', authMiddleware.authenticate, MessageTemplateController.updateTemplate);

/**
 * @route   DELETE /api/templates/:templateId
 * @desc    Delete a template
 * @access  Private
 */
router.delete('/:templateId', authMiddleware.authenticate, MessageTemplateController.deleteTemplate);

/**
 * @route   GET /api/templates/search
 * @desc    Search templates by query
 * @access  Private
 */
router.get('/search', authMiddleware.authenticate, MessageTemplateController.searchTemplates);

/**
 * @route   GET /api/templates/category/:category
 * @desc    Get templates by category
 * @access  Private
 */
router.get('/category/:category', authMiddleware.authenticate, MessageTemplateController.getTemplatesByCategory);

/**
 * @route   GET /api/templates/categories
 * @desc    Get user categories
 * @access  Private
 */
router.get('/categories', authMiddleware.authenticate, MessageTemplateController.getUserCategories);

export default router;