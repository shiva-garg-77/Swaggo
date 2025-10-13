/**
 * Translation Routes - API endpoints for message translation
 * 
 * This file defines the REST API endpoints for translation functionality.
 */

import express from 'express';
import TranslationController from '../Controllers/TranslationController.js';
import authMiddleware from '../Middleware/AuthenticationMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/translate
 * @desc    Translate text to target language
 * @access  Private
 */
router.post('/', authMiddleware.authenticate, TranslationController.translateText);

/**
 * @route   POST /api/translate/detect
 * @desc    Detect language of text
 * @access  Private
 */
router.post('/detect', authMiddleware.authenticate, TranslationController.detectLanguage);

/**
 * @route   GET /api/translate/languages
 * @desc    Get supported languages
 * @access  Public
 */
router.get('/languages', TranslationController.getSupportedLanguages);

/**
 * @route   POST /api/translate/batch
 * @desc    Batch translate multiple texts
 * @access  Private
 */
router.post('/batch', authMiddleware.authenticate, TranslationController.batchTranslate);

export default router;