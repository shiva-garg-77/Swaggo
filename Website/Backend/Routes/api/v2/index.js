/**
 * @fileoverview API v2 Routes Index
 * @module Routes/v2
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * This file serves as the entry point for all API v2 routes.
 * Currently, it's a copy of v1 routes but can be modified to include breaking changes.
 */

import express from 'express';
// Import v1 routes as a starting point
import v1Routes from '../v1/index.js';

const router = express.Router();

// For now, use the same routes as v1
// In the future, this can be modified to include breaking changes
router.use('/', v1Routes);

export default router;