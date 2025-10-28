/**
 * @fileoverview API Routes Index
 * @module Routes/api
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * This file serves as the main entry point for all API routes.
 * It handles API versioning and routes requests to the appropriate version.
 */

import express from 'express';
import v1Routes from './v1/index.js';
import v2Routes from './v2/index.js';

const router = express.Router();

// Mount API versions
router.use('/v1', v1Routes);
router.use('/v2', v2Routes);

// Default to v1 if no version is specified
router.use('/', v1Routes);

export default router;