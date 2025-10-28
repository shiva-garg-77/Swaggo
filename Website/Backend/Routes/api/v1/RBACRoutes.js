/**
 * RBAC Routes - API endpoints for role-based access control management
 * 
 * These routes provide endpoints for managing roles, permissions, and user-role assignments.
 * 
 * @module RBACRoutes
 * @version 1.0.0
 */

import express from 'express';
import authMiddleware from '../../../Middleware/Authentication/AuthenticationMiddleware.js';
import User from '../../../Models/User.js';

const router = express.Router();

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (req.user?.permissions?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

// Predefined roles and permissions
const predefinedRoles = [
  { 
    id: 'admin', 
    name: 'Administrator', 
    description: 'Full system access',
    permissions: ['*'] // All permissions
  },
  { 
    id: 'moderator', 
    name: 'Moderator', 
    description: 'Content moderation and user management',
    permissions: [
      'read_users',
      'manage_content',
      'moderate_comments',
      'ban_users',
      'view_reports'
    ]
  },
  { 
    id: 'user', 
    name: 'User', 
    description: 'Standard user access',
    permissions: [
      'read_profile',
      'write_messages',
      'create_posts',
      'comment',
      'like',
      'follow'
    ]
  },
  { 
    id: 'guest', 
    name: 'Guest', 
    description: 'Limited access for unauthenticated users',
    permissions: [
      'read_public_content'
    ]
  }
];

const predefinedPermissions = [
  // User management
  { id: 'read_users', name: 'Read Users', description: 'View user profiles and information' },
  { id: 'manage_users', name: 'Manage Users', description: 'Create, update, and delete users' },
  { id: 'ban_users', name: 'Ban Users', description: 'Ban or suspend user accounts' },
  
  // Content management
  { id: 'read_content', name: 'Read Content', description: 'View content' },
  { id: 'create_content', name: 'Create Content', description: 'Create new content' },
  { id: 'update_content', name: 'Update Content', description: 'Edit existing content' },
  { id: 'delete_content', name: 'Delete Content', description: 'Remove content' },
  { id: 'manage_content', name: 'Manage Content', description: 'Full content management' },
  
  // System management
  { id: 'view_reports', name: 'View Reports', description: 'Access system reports and analytics' },
  { id: 'manage_settings', name: 'Manage Settings', description: 'Modify system settings' },
  { id: 'view_audit_logs', name: 'View Audit Logs', description: 'Access audit logs' },
  
  // Communication
  { id: 'read_messages', name: 'Read Messages', description: 'View messages' },
  { id: 'write_messages', name: 'Write Messages', description: 'Send messages' },
  { id: 'delete_messages', name: 'Delete Messages', description: 'Remove messages' },
  
  // Profile management
  { id: 'read_profile', name: 'Read Profile', description: 'View profile information' },
  { id: 'update_profile', name: 'Update Profile', description: 'Modify profile information' },
  { id: 'delete_profile', name: 'Delete Profile', description: 'Remove profile' },
  
  // Social features
  { id: 'follow', name: 'Follow', description: 'Follow other users' },
  { id: 'like', name: 'Like', description: 'Like content' },
  { id: 'comment', name: 'Comment', description: 'Add comments' },
  { id: 'share', name: 'Share', description: 'Share content' },
  
  // Moderation
  { id: 'moderate_comments', name: 'Moderate Comments', description: 'Approve or reject comments' },
  { id: 'moderate_content', name: 'Moderate Content', description: 'Review and moderate content' },
  
  // Public access
  { id: 'read_public_content', name: 'Read Public Content', description: 'View publicly available content' }
];

/**
 * Get All Roles
 * @swagger
 * /api/v1/rbac/roles:
 *   get:
 *     summary: Get all roles
 *     description: Retrieve all predefined roles. Admin access required.
 *     tags: [Security]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       "200":
 *         description: Roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: admin
 *                       name:
 *                         type: string
 *                         example: Administrator
 *                       description:
 *                         type: string
 *                         example: Full system access
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/roles', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      roles: predefinedRoles
    });
  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Role by ID
 * @swagger
 * /api/v1/rbac/roles/{roleId}:
 *   get:
 *     summary: Get a specific role
 *     description: Retrieve details for a specific role by ID. Admin access required.
 *     tags: [Security]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       "200":
 *         description: Role retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 role:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: admin
 *                     name:
 *                       type: string
 *                       example: Administrator
 *                     description:
 *                       type: string
 *                       example: Full system access
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         description: Role not found
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
 *                   example: Role not found
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/roles/:roleId', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const { roleId } = req.params;
    const role = predefinedRoles.find(r => r.id === roleId);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }
    
    res.json({
      success: true,
      role
    });
  } catch (error) {
    console.error('Error getting role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create New Role
 * @swagger
 * /api/v1/rbac/roles:
 *   post:
 *     summary: Create a new role
 *     description: Create a new role with specified permissions. Admin access required.
 *     tags: [Security]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - permissions
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name
 *                 example: Custom Role
 *               description:
 *                 type: string
 *                 description: Role description
 *                 example: Custom role with specific permissions
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of permission IDs
 *                 example: ['read_users', 'write_messages']
 *     responses:
 *       "201":
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 role:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: role_1234567890
 *                     name:
 *                       type: string
 *                       example: Custom Role
 *                     description:
 *                       type: string
 *                       example: Custom role with specific permissions
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                 message:
 *                   type: string
 *                   example: Role created successfully
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/roles', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    // In a real implementation, you would store this in a database
    // For now, we'll just return a success response
    const newRole = {
      id: `role_${Date.now()}`,
      name,
      description,
      permissions
    };
    
    res.status(201).json({
      success: true,
      role: newRole,
      message: 'Role created successfully'
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update Role
 * @swagger
 * /api/v1/rbac/roles/{roleId}:
 *   put:
 *     summary: Update a role
 *     description: Update an existing role's details. Admin access required.
 *     tags: [Security]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name
 *                 example: Updated Role Name
 *               description:
 *                 type: string
 *                 description: Role description
 *                 example: Updated role description
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of permission IDs
 *                 example: ['read_users', 'write_messages', 'manage_content']
 *     responses:
 *       "200":
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 role:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: admin
 *                     name:
 *                       type: string
 *                       example: Updated Role Name
 *                     description:
 *                       type: string
 *                       example: Updated role description
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                 message:
 *                   type: string
 *                   example: Role updated successfully
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         description: Role not found
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
 *                   example: Role not found
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/roles/:roleId', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, description, permissions } = req.body;
    
    // In a real implementation, you would update this in a database
    // For now, we'll just return a success response
    const updatedRole = {
      id: roleId,
      name: name || `Role ${roleId}`,
      description: description || 'Updated role',
      permissions: permissions || []
    };
    
    res.json({
      success: true,
      role: updatedRole,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete Role
 * @swagger
 * /api/v1/rbac/roles/{roleId}:
 *   delete:
 *     summary: Delete a role
 *     description: Delete an existing role. Admin access required.
 *     tags: [Security]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       "200":
 *         description: Role deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Role deleted successfully
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         description: Role not found
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
 *                   example: Role not found
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/roles/:roleId', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const { roleId } = req.params;
    
    // In a real implementation, you would delete this from a database
    // For now, we'll just return a success response
    
    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get All Permissions
 * @swagger
 * /api/v1/rbac/permissions:
 *   get:
 *     summary: Get all permissions
 *     description: Retrieve all predefined permissions. Admin access required.
 *     tags: [Security]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       "200":
 *         description: Permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: read_users
 *                       name:
 *                         type: string
 *                         example: Read Users
 *                       description:
 *                         type: string
 *                         example: View user profiles and information
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/permissions', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      permissions: predefinedPermissions
    });
  } catch (error) {
    console.error('Error getting permissions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Assign Role to User
 * @swagger
 * /api/v1/rbac/users/{userId}/roles:
 *   post:
 *     summary: Assign role to user
 *     description: Assign a role to a specific user. Admin access required.
 *     tags: [Security]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: string
 *                 description: Role ID to assign
 *                 example: admin
 *     responses:
 *       "200":
 *         description: Role assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Role assigned successfully
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         description: User or role not found
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
 *                   example: User or role not found
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/users/:userId/roles', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    
    // Find the role
    const role = predefinedRoles.find(r => r.id === roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // In a real implementation, you would update the user's role in the database
    // For now, we'll just return a success response
    if (!user.permissions) user.permissions = {};
    user.permissions.role = roleId;
    await user.save();
    
    res.json({
      success: true,
      message: 'Role assigned successfully',
      user: {
        id: user.id,
        username: user.username,
        role: roleId
      }
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Remove Role from User
 * @swagger
 * /api/v1/rbac/users/{userId}/roles/{roleId}:
 *   delete:
 *     summary: Remove role from user
 *     description: Remove a role from a specific user. Admin access required.
 *     tags: [Security]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID to remove
 *     responses:
 *       "200":
 *         description: Role removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Role removed successfully
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         description: User or role not found
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
 *                   example: User or role not found
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/users/:userId/roles/:roleId', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId, roleId } = req.params;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if user has this role
    if (!user.permissions || user.permissions.role !== roleId) {
      return res.status(404).json({
        success: false,
        error: 'User does not have this role'
      });
    }
    
    // In a real implementation, you would remove the user's role in the database
    // For now, we'll just return a success response
    user.permissions.role = 'user'; // Default to user role
    await user.save();
    
    res.json({
      success: true,
      message: 'Role removed successfully',
      user: {
        id: user.id,
        username: user.username,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Check User Permissions
 * @swagger
 * /api/v1/rbac/users/{userId}/permissions:
 *   get:
 *     summary: Check user permissions
 *     description: Check all permissions for a specific user. Admin access required.
 *     tags: [Security]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       "200":
 *         description: User permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: user123
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     role:
 *                       type: string
 *                       example: admin
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ['read_users', 'manage_content']
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         description: User not found
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
 *                   example: User not found
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/users/:userId/permissions', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Get role permissions
    const role = predefinedRoles.find(r => r.id === (user.permissions?.role || 'user'));
    const permissions = role ? role.permissions : predefinedRoles.find(r => r.id === 'user').permissions;
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.permissions?.role || 'user',
        permissions
      }
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;