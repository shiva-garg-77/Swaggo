import express from 'express';
import authMiddleware from '../../../Middleware/Authentication/AuthenticationMiddleware.js';
import User from '../../../Models/User.js';
import Profile from '../../../Models/FeedModels/Profile.js';
// 🔧 API RESPONSE TIME OPTIMIZATION #184: Import cache middleware
import { cacheMiddleware } from '../../../utils/PerformanceOptimization.js';

const router = express.Router();

/**
 * Get Current User Profile
 * @swagger
 * /api/v1/user/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the profile information for the currently authenticated user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       "200":
 *         description: User profile retrieved successfully
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
 *                   example: Profile retrieved successfully
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
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
// 🔧 API RESPONSE TIME OPTIMIZATION #184: Add cache middleware to user profile endpoint (30 second cache)
router.get('/profile', 
  authMiddleware.authenticate, 
  cacheMiddleware('users', (req) => `user-profile-${req.user.id}`, 30),
  async (req, res) => {
    try {
      // Find the profile associated with the user
      const profile = await Profile.findOne({ 
        $or: [
          { email: req.user.email },
          { username: req.user.username }
        ]
      });

      res.json({
        status: 'success',
        message: 'Profile retrieved successfully',
        data: {
          user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            displayName: req.user.profile?.displayName || req.user.username,
            emailVerified: req.user.profile?.emailVerified || false,
            role: req.user.permissions?.role || 'user',
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
      console.error('Get user profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve user profile',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Update User Profile
 * @swagger
 * /api/v1/user/profile:
 *   patch:
 *     summary: Update user profile
 *     description: Update the profile information for the currently authenticated user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 maxLength: 100
 *                 description: User's display name
 *                 example: John Doe
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 description: User's biography
 *                 example: Software developer passionate about technology
 *               isPrivate:
 *                 type: boolean
 *                 description: Whether the profile is private
 *                 example: false
 *     responses:
 *       "200":
 *         description: User profile updated successfully
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
 *                   example: Profile updated successfully
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
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/profile', 
  authMiddleware.authenticate, 
  async (req, res) => {
    try {
      const { displayName, bio, isPrivate } = req.body;

      // Update user model
      if (displayName) {
        if (!req.user.profile) req.user.profile = {};
        req.user.profile.displayName = displayName;
      }

      await req.user.save();

      // Update profile model
      const profile = await Profile.findOneAndUpdate(
        { 
          $or: [
            { email: req.user.email },
            { username: req.user.username }
          ]
        },
        {
          $set: {
            name: displayName || req.user.username,
            bio: bio,
            isPrivate: isPrivate !== undefined ? isPrivate : false
          }
        },
        { new: true }
      );

      res.json({
        status: 'success',
        message: 'Profile updated successfully',
        data: {
          user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            displayName: req.user.profile?.displayName || req.user.username,
            profile: profile ? {
              profileid: profile.profileid,
              name: profile.name,
              bio: profile.bio,
              isPrivate: profile.isPrivate
            } : null
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Update user profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update user profile',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;