import express from 'express';
import { body, validationResult } from 'express-validator';
import SubscriptionService from '../Services/SubscriptionService.js';
import AuthenticationMiddleware from '../Middleware/AuthenticationMiddleware.js';
import ApiResponse from '../Utils/ApiResponse.js';

const router = express.Router();
const { sendSuccess, sendError, sendNotFound, sendUnauthorized, sendValidationError } = ApiResponse;

/**
 * 📋 SUBSCRIPTION MANAGEMENT ROUTES
 * 
 * Features:
 * - Create and manage user subscriptions
 * - Handle subscription lifecycle (create, update, cancel, renew)
 * - Track usage metrics
 * - Process subscription expiration
 */

// Apply authentication middleware to all routes
router.use(AuthenticationMiddleware.authenticate);

/**
 * Get user's subscription status
 * GET /api/subscriptions/status
 * @swagger
 * /api/subscriptions/status:
 *   get:
 *     summary: Get subscription status
 *     description: Retrieve the current subscription status for the authenticated user.
 *     tags: [Subscriptions]
 *     responses:
 *       "200":
 *         description: Subscription status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasSubscription:
 *                       type: boolean
 *                     status:
 *                       type: string
 *                       enum: [none, active, inactive, pending, cancelled, expired]
 *                     plan:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         price:
 *                           type: number
 *                         currency:
 *                           type: string
 *                         features:
 *                           type: array
 *                           items:
 *                             type: string
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                     daysUntilExpiration:
 *                       type: number
 *                     isInTrial:
 *                       type: boolean
 *                     usage:
 *                       type: object
 *                       properties:
 *                         messages:
 *                           type: number
 *                         storage:
 *                           type: number
 *                         bandwidth:
 *                           type: number
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/status', async (req, res) => {
  try {
    const subscriptionService = new SubscriptionService();
    const status = await subscriptionService.getSubscriptionStatus(req.user.id);
    
    return sendSuccess(res, status, 'Subscription status retrieved successfully');
  } catch (error) {
    console.error('Get subscription status error:', error);
    return sendError(res, 'Failed to retrieve subscription status', 500);
  }
});

/**
 * Get all user subscriptions
 * GET /api/subscriptions
 * @swagger
 * /api/subscriptions:
 *   get:
 *     summary: Get all subscriptions
 *     description: Retrieve all subscriptions for the authenticated user.
 *     tags: [Subscriptions]
 *     responses:
 *       "200":
 *         description: Subscriptions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Subscription'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', async (req, res) => {
  try {
    const subscriptionService = new SubscriptionService();
    const subscriptions = await subscriptionService.getUserSubscriptions(req.user.id);
    
    return sendSuccess(res, subscriptions, 'Subscriptions retrieved successfully');
  } catch (error) {
    console.error('Get subscriptions error:', error);
    return sendError(res, 'Failed to retrieve subscriptions', 500);
  }
});

/**
 * Get specific subscription
 * GET /api/subscriptions/:subscriptionId
 * @swagger
 * /api/subscriptions/{subscriptionId}:
 *   get:
 *     summary: Get subscription
 *     description: Retrieve details for a specific subscription.
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     responses:
 *       "200":
 *         description: Subscription retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:subscriptionId', [
  // Validate subscription ID
  body('subscriptionId')
    .notEmpty()
    .withMessage('Subscription ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }
    
    const { subscriptionId } = req.params;
    const subscriptionService = new SubscriptionService();
    const subscription = await subscriptionService.getSubscription(subscriptionId, req.user.id);
    
    if (!subscription) {
      return sendNotFound(res, 'Subscription not found');
    }
    
    return sendSuccess(res, subscription, 'Subscription retrieved successfully');
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return sendNotFound(res, error.message);
    }
    
    console.error('Get subscription error:', error);
    return sendError(res, 'Failed to retrieve subscription', 500);
  }
});

/**
 * Create new subscription
 * POST /api/subscriptions
 * @swagger
 * /api/subscriptions:
 *   post:
 *     summary: Create subscription
 *     description: Create a new subscription for the authenticated user.
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *               - startDate
 *               - endDate
 *             properties:
 *               plan:
 *                 type: object
 *                 required:
 *                   - name
 *                   - price
 *                 properties:
 *                   name:
 *                     type: string
 *                     enum: [basic, premium, enterprise]
 *                   price:
 *                     type: number
 *                   currency:
 *                     type: string
 *                   features:
 *                     type: array
 *                     items:
 *                       type: string
 *               payment:
 *                 type: object
 *                 properties:
 *                   method:
 *                     type: string
 *                     enum: [credit_card, paypal, bank_transfer, crypto]
 *                   last4:
 *                     type: string
 *                   expiryDate:
 *                     type: string
 *                     format: date
 *                   provider:
 *                     type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               trial:
 *                 type: object
 *                 properties:
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                   isActive:
 *                     type: boolean
 *               autoRenew:
 *                 type: boolean
 *     responses:
 *       "201":
 *         description: Subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *                 message:
 *                   type: string
 *                   example: Subscription created successfully
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "409":
 *         description: Conflict - User already has active subscription
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: User already has an active subscription
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', [
  // Validate required fields
  body('plan.name')
    .notEmpty()
    .isIn(['basic', 'premium', 'enterprise'])
    .withMessage('Valid plan name is required'),
  
  body('plan.price')
    .isNumeric()
    .withMessage('Valid plan price is required'),
    
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
    
  body('endDate')
    .isISO8601()
    .withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }
    
    const subscriptionService = new SubscriptionService();
    const subscription = await subscriptionService.createSubscription(req.user.id, req.body);
    
    return sendSuccess(res, subscription, 'Subscription created successfully', 201);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendValidationError(res, error.message);
    }
    
    if (error.message.includes('already has an active subscription')) {
      return sendError(res, error.message, 409);
    }
    
    console.error('Create subscription error:', error);
    return sendError(res, 'Failed to create subscription', 500);
  }
});

/**
 * Update subscription
 * PUT /api/subscriptions/:subscriptionId
 * @swagger
 * /api/subscriptions/{subscriptionId}:
 *   put:
 *     summary: Update subscription
 *     description: Update an existing subscription.
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, pending, cancelled, expired]
 *               autoRenew:
 *                 type: boolean
 *               payment:
 *                 type: object
 *                 properties:
 *                   method:
 *                     type: string
 *                   last4:
 *                     type: string
 *                   expiryDate:
 *                     type: string
 *                     format: date
 *                   provider:
 *                     type: string
 *               plan:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   price:
 *                     type: number
 *                   currency:
 *                     type: string
 *                   features:
 *                     type: array
 *                     items:
 *                       type: string
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       "200":
 *         description: Subscription updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *                 message:
 *                   type: string
 *                   example: Subscription updated successfully
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const subscriptionService = new SubscriptionService();
    const subscription = await subscriptionService.updateSubscription(subscriptionId, req.body, req.user.id);
    
    return sendSuccess(res, subscription, 'Subscription updated successfully');
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return sendNotFound(res, error.message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return sendUnauthorized(res, error.message);
    }
    
    console.error('Update subscription error:', error);
    return sendError(res, 'Failed to update subscription', 500);
  }
});

/**
 * Cancel subscription
 * DELETE /api/subscriptions/:subscriptionId
 * @swagger
 * /api/subscriptions/{subscriptionId}:
 *   delete:
 *     summary: Cancel subscription
 *     description: Cancel an existing subscription.
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *               feedback:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Subscription cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *                 message:
 *                   type: string
 *                   example: Subscription cancelled successfully
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const subscriptionService = new SubscriptionService();
    const subscription = await subscriptionService.cancelSubscription(subscriptionId, req.user.id, req.body);
    
    return sendSuccess(res, subscription, 'Subscription cancelled successfully');
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return sendNotFound(res, error.message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return sendUnauthorized(res, error.message);
    }
    
    console.error('Cancel subscription error:', error);
    return sendError(res, 'Failed to cancel subscription', 500);
  }
});

/**
 * Renew subscription
 * POST /api/subscriptions/:subscriptionId/renew
 * @swagger
 * /api/subscriptions/{subscriptionId}/renew:
 *   post:
 *     summary: Renew subscription
 *     description: Renew an existing subscription.
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               plan:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   price:
 *                     type: number
 *                   currency:
 *                     type: string
 *                   features:
 *                     type: array
 *                     items:
 *                       type: string
 *               autoRenew:
 *                 type: boolean
 *     responses:
 *       "200":
 *         description: Subscription renewed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *                 message:
 *                   type: string
 *                   example: Subscription renewed successfully
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:subscriptionId/renew', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const subscriptionService = new SubscriptionService();
    const subscription = await subscriptionService.renewSubscription(subscriptionId, req.body, req.user.id);
    
    return sendSuccess(res, subscription, 'Subscription renewed successfully');
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return sendNotFound(res, error.message);
    }
    
    if (error.name === 'UnauthorizedError') {
      return sendUnauthorized(res, error.message);
    }
    
    console.error('Renew subscription error:', error);
    return sendError(res, 'Failed to renew subscription', 500);
  }
});

/**
 * Update usage metrics
 * POST /api/subscriptions/:subscriptionId/usage
 * @swagger
 * /api/subscriptions/{subscriptionId}/usage:
 *   post:
 *     summary: Update usage metrics
 *     description: Update usage metrics for a subscription.
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messages:
 *                 type: number
 *               storage:
 *                 type: number
 *               bandwidth:
 *                 type: number
 *     responses:
 *       "200":
 *         description: Usage metrics updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *                 message:
 *                   type: string
 *                   example: Usage metrics updated successfully
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:subscriptionId/usage', [
  body('messages')
    .optional()
    .isNumeric()
    .withMessage('Messages must be a number'),
    
  body('storage')
    .optional()
    .isNumeric()
    .withMessage('Storage must be a number'),
    
  body('bandwidth')
    .optional()
    .isNumeric()
    .withMessage('Bandwidth must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }
    
    const { subscriptionId } = req.params;
    const subscriptionService = new SubscriptionService();
    const subscription = await subscriptionService.updateUsage(subscriptionId, req.body);
    
    return sendSuccess(res, subscription, 'Usage metrics updated successfully');
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return sendNotFound(res, error.message);
    }
    
    console.error('Update usage error:', error);
    return sendError(res, 'Failed to update usage metrics', 500);
  }
});

export default router;