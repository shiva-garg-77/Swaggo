import express from 'express';
import authMiddleware from '../../../Middleware/Authentication/AuthenticationMiddleware.js';
import User from '../../../Models/User.js';
import Profile from '../../../Models/FeedModels/Profile.js';

const router = express.Router();

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (req.user?.permissions?.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required',
      timestamp: new Date().toISOString()
    });
  }
  next();
};

/**
 * Get All Users (Admin only)
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Retrieve a paginated list of all users. Admin access required.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for username or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, suspended, banned, deactivated]
 *         description: Filter users by account status
 *     responses:
 *       "200":
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Users retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 100
 *                         pages:
 *                           type: integer
 *                           example: 5
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/users', 
  authMiddleware.authenticate, 
  requireAdmin, 
  async (req, res) => {
    try {
      const { page = 1, limit = 20, search, status } = req.query;
      
      // Build query
      const query = {};
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      if (status) {
        query['profile.accountStatus'] = status;
      }

      // Execute query
      const users = await User.find(query)
        .select('-password -security.mfa.secret -security.mfa.backupCodes')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(query);

      res.json({
        status: 'success',
        message: 'Users retrieved successfully',
        data: {
          users: users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.profile?.displayName || user.username,
            emailVerified: user.profile?.emailVerified || false,
            role: user.permissions?.role || 'user',
            accountStatus: user.profile?.accountStatus || 'active',
            isAccountLocked: user.isAccountLocked ? user.isAccountLocked() : false,
            lastLogin: user.audit?.lastLogin,
            createdAt: user.createdAt
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Admin get users error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve users',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Get User Details (Admin only)
 * @swagger
 * /api/v1/admin/users/{id}:
 *   get:
 *     summary: Get user details (Admin only)
 *     description: Retrieve detailed information for a specific user. Admin access required.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       "200":
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User details retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/users/:id', 
  authMiddleware.authenticate, 
  requireAdmin, 
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id)
        .select('-password -security.mfa.secret -security.mfa.backupCodes');

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
          timestamp: new Date().toISOString()
        });
      }

      // Get associated profile
      const profile = await Profile.findOne({
        $or: [
          { email: user.email },
          { username: user.username }
        ]
      });

      res.json({
        status: 'success',
        message: 'User details retrieved successfully',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.profile?.displayName || user.username,
            emailVerified: user.profile?.emailVerified || false,
            role: user.permissions?.role || 'user',
            accountStatus: user.profile?.accountStatus || 'active',
            isAccountLocked: user.isAccountLocked ? user.isAccountLocked() : false,
            lastLogin: user.audit?.lastLogin,
            lastLoginIP: user.audit?.lastLoginIP,
            loginAttempts: user.security?.loginAttempts?.count || 0,
            mfaEnabled: user.security?.mfa?.enabled || false,
            trustedDevices: user.security?.trustedDevices?.length || 0,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            profile: profile ? {
              profileid: profile.profileid,
              name: profile.name,
              bio: profile.bio,
              profilePic: profile.profilePic,
              isPrivate: profile.isPrivate,
              isVerified: profile.isVerified,
              accountStatus: profile.accountStatus
            } : null
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Admin get user details error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve user details',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Update User Status (Admin only)
 * @swagger
 * /api/v1/admin/users/{id}/status:
 *   patch:
 *     summary: Update user status (Admin only)
 *     description: Update the account status for a specific user. Admin access required.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, suspended, banned, deactivated]
 *                 description: New account status
 *               reason:
 *                 type: string
 *                 description: Reason for status change
 *     responses:
 *       "200":
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User status updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/users/:id/status', 
  authMiddleware.authenticate, 
  requireAdmin, 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!['active', 'suspended', 'banned', 'deactivated'].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status value',
          timestamp: new Date().toISOString()
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
          timestamp: new Date().toISOString()
        });
      }

      // Update user status
      if (!user.profile) user.profile = {};
      user.profile.accountStatus = status;
      await user.save();

      // Update profile status
      await Profile.findOneAndUpdate(
        {
          $or: [
            { email: user.email },
            { username: user.username }
          ]
        },
        {
          $set: {
            accountStatus: status
          }
        }
      );

      res.json({
        status: 'success',
        message: 'User status updated successfully',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.profile?.displayName || user.username,
            emailVerified: user.profile?.emailVerified || false,
            role: user.permissions?.role || 'user',
            accountStatus: user.profile?.accountStatus || 'active',
            isAccountLocked: user.isAccountLocked ? user.isAccountLocked() : false,
            lastLogin: user.audit?.lastLogin,
            createdAt: user.createdAt
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Admin update user status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update user status',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;