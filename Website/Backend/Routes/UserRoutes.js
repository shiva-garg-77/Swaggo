import express from 'express';
import authMiddleware from '../Middleware/AuthenticationMiddleware.js';
import User from '../Models/User.js';
import Profile from '../Models/FeedModels/Profile.js';

const router = express.Router();

/**
 * Get Current User Profile
 * GET /api/users/profile
 */
router.get('/profile', authMiddleware.authenticate, async (req, res) => {
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
});

/**
 * Update User Profile
 * PATCH /api/users/profile
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