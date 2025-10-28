/**
 * RBAC Service - Frontend service for role-based access control
 * This service should only handle UI-related operations and delegate actual RBAC logic to the backend
 */

import ApiService from './ApiService';

class RBACService {
  /**
   * Get all roles from the backend
   * @returns {Promise<Array>} Array of role objects
   */
  static async getRoles() {
    try {
      const response = await ApiService.get('/api/rbac/roles');
      if (response.success) {
        return response.roles;
      } else {
        throw new Error(response.error || 'Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  /**
   * Get all permissions from the backend
   * @returns {Promise<Array>} Array of permission objects
   */
  static async getPermissions() {
    try {
      const response = await ApiService.get('/api/rbac/permissions');
      if (response.success) {
        return response.permissions;
      } else {
        throw new Error(response.error || 'Failed to fetch permissions');
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  }

  /**
   * Get a specific role by ID
   * @param {string} roleId - The ID of the role to fetch
   * @returns {Promise<Object>} Role object
   */
  static async getRoleById(roleId) {
    try {
      const response = await ApiService.get(`/api/rbac/roles/${roleId}`);
      if (response.success) {
        return response.role;
      } else {
        throw new Error(response.error || 'Failed to fetch role');
      }
    } catch (error) {
      console.error(`Error fetching role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new role
   * @param {Object} roleData - The role data to create
   * @returns {Promise<Object>} Created role object
   */
  static async createRole(roleData) {
    try {
      const response = await ApiService.post('/api/rbac/roles', roleData);
      if (response.success) {
        return response.role;
      } else {
        throw new Error(response.error || 'Failed to create role');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update an existing role
   * @param {string} roleId - The ID of the role to update
   * @param {Object} roleData - The updated role data
   * @returns {Promise<Object>} Updated role object
   */
  static async updateRole(roleId, roleData) {
    try {
      const response = await ApiService.put(`/api/rbac/roles/${roleId}`, roleData);
      if (response.success) {
        return response.role;
      } else {
        throw new Error(response.error || 'Failed to update role');
      }
    } catch (error) {
      console.error(`Error updating role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a role
   * @param {string} roleId - The ID of the role to delete
   * @returns {Promise<void>}
   */
  static async deleteRole(roleId) {
    try {
      const response = await ApiService.delete(`/api/rbac/roles/${roleId}`);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete role');
      }
    } catch (error) {
      console.error(`Error deleting role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Get user roles
   * @param {string} userId - The ID of the user
   * @returns {Promise<Array>} Array of user roles
   */
  static async getUserRoles(userId) {
    try {
      const response = await ApiService.get(`/api/rbac/users/${userId}/roles`);
      if (response.success) {
        return response.roles;
      } else {
        throw new Error(response.error || 'Failed to fetch user roles');
      }
    } catch (error) {
      console.error(`Error fetching roles for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Assign a role to a user
   * @param {string} userId - The ID of the user
   * @param {string} roleId - The ID of the role to assign
   * @returns {Promise<Object>} Response object
   */
  static async assignRoleToUser(userId, roleId) {
    try {
      const response = await ApiService.post(`/api/rbac/users/${userId}/roles`, { roleId });
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || 'Failed to assign role to user');
      }
    } catch (error) {
      console.error(`Error assigning role ${roleId} to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a role from a user
   * @param {string} userId - The ID of the user
   * @param {string} roleId - The ID of the role to remove
   * @returns {Promise<Object>} Response object
   */
  static async removeRoleFromUser(userId, roleId) {
    try {
      const response = await ApiService.delete(`/api/rbac/users/${userId}/roles/${roleId}`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || 'Failed to remove role from user');
      }
    } catch (error) {
      console.error(`Error removing role ${roleId} from user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get permissions for a specific role
   * @param {string} roleId - The ID of the role
   * @returns {Promise<Array>} Array of permission objects
   */
  static async getRolePermissions(roleId) {
    try {
      const response = await ApiService.get(`/api/rbac/roles/${roleId}/permissions`);
      if (response.success) {
        return response.permissions;
      } else {
        throw new Error(response.error || 'Failed to fetch role permissions');
      }
    } catch (error) {
      console.error(`Error fetching permissions for role ${roleId}:`, error);
      throw error;
    }
  }
}

export default RBACService;