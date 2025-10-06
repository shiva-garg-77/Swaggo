import express from 'express';
import authMiddleware from '../Middleware/AuthenticationMiddleware.js';
import User from '../Models/User.js';
import Profile from '../Models/FeedModels/Profile.js';

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
 * GET /api/admin/users
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
 * GET /api/admin/users/:id
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
 * PATCH /api/admin/users/:id/status
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
        { $set: { accountStatus: status } }
      );

      console.log(`Admin ${req.user.username} changed status of user ${user.username} to ${status}. Reason: ${reason || 'No reason provided'}`);

      res.json({
        status: 'success',
        message: `User status updated to ${status}`,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            accountStatus: status
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

/**
 * Delete User (Admin only)
 * DELETE /api/admin/users/:id
 */
router.delete('/users/:id', 
  authMiddleware.authenticate, 
  requireAdmin, 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
          timestamp: new Date().toISOString()
        });
      }

      // Prevent admins from deleting themselves
      if (user.id === req.user.id) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete your own account',
          timestamp: new Date().toISOString()
        });
      }

      // Delete associated profile
      await Profile.findOneAndDelete({
        $or: [
          { email: user.email },
          { username: user.username }
        ]
      });

      // Delete user
      await User.findByIdAndDelete(id);

      console.log(`Admin ${req.user.username} deleted user ${user.username}. Reason: ${reason || 'No reason provided'}`);

      res.json({
        status: 'success',
        message: 'User deleted successfully',
        data: {
          deletedUser: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Admin delete user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete user',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;