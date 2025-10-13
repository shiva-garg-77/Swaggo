/**
 * RBAC Service - Frontend service for managing roles and permissions
 * 
 * This service provides a unified interface for querying and managing roles and permissions.
 */

import apiService from './ApiService';

class RBACService {
  /**
   * Get all roles
   * @returns {Promise} Array of roles
   */
  async getRoles() {
    try {
      const response = await apiService.get('/api/admin/roles');
      if (response.success) {
        return response.roles;
      } else {
        throw new Error(response.error || 'Failed to get roles');
      }
    } catch (error) {
      console.error('Error getting roles:', error);
      throw error;
    }
  }

  /**
   * Get a specific role by ID
   * @param {string} roleId - Role ID
   * @returns {Promise} Role object
   */
  async getRoleById(roleId) {
    try {
      const response = await apiService.get(`/api/admin/roles/${roleId}`);
      if (response.success) {
        return response.role;
      } else {
        throw new Error(response.error || 'Failed to get role');
      }
    } catch (error) {
      console.error('Error getting role:', error);
      throw error;
    }
  }

  /**
   * Create a new role
   * @param {Object} roleData - Role data
   * @returns {Promise} Created role
   */
  async createRole(roleData) {
    try {
      const response = await apiService.post('/api/admin/roles', roleData);
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
   * Update a role
   * @param {string} roleId - Role ID
   * @param {Object} roleData - Role data
   * @returns {Promise} Updated role
   */
  async updateRole(roleId, roleData) {
    try {
      const response = await apiService.put(`/api/admin/roles/${roleId}`, roleData);
      if (response.success) {
        return response.role;
      } else {
        throw new Error(response.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete a role
   * @param {string} roleId - Role ID
   * @returns {Promise} Deletion result
   */
  async deleteRole(roleId) {
    try {
      const response = await apiService.delete(`/api/admin/roles/${roleId}`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Get all permissions
   * @returns {Promise} Array of permissions
   */
  async getPermissions() {
    try {
      const response = await apiService.get('/api/admin/permissions');
      if (response.success) {
        return response.permissions;
      } else {
        throw new Error(response.error || 'Failed to get permissions');
      }
    } catch (error) {
      console.error('Error getting permissions:', error);
      throw error;
    }
  }

  /**
   * Get user roles
   * @param {string} userId - User ID
   * @returns {Promise} User roles
   */
  async getUserRoles(userId) {
    try {
      const response = await apiService.get(`/api/admin/users/${userId}/roles`);
      if (response.success) {
        return response.roles;
      } else {
        throw new Error(response.error || 'Failed to get user roles');
      }
    } catch (error) {
      console.error('Error getting user roles:', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   * @returns {Promise} Assignment result
   */
  async assignRoleToUser(userId, roleId) {
    try {
      const response = await apiService.post(`/api/admin/users/${userId}/roles`, { roleId });
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || 'Failed to assign role to user');
      }
    } catch (error) {
      console.error('Error assigning role to user:', error);
      throw error;
    }
  }

  /**
   * Remove role from user
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   * @returns {Promise} Removal result
   */
  async removeRoleFromUser(userId, roleId) {
    try {
      const response = await apiService.delete(`/api/admin/users/${userId}/roles/${roleId}`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || 'Failed to remove role from user');
      }
    } catch (error) {
      console.error('Error removing role from user:', error);
      throw error;
    }
  }

  /**
   * Get role permissions
   * @param {string} roleId - Role ID
   * @returns {Promise} Role permissions
   */
  async getRolePermissions(roleId) {
    try {
      const response = await apiService.get(`/api/admin/roles/${roleId}/permissions`);
      if (response.success) {
        return response.permissions;
      } else {
        throw new Error(response.error || 'Failed to get role permissions');
      }
    } catch (error) {
      console.error('Error getting role permissions:', error);
      throw error;
    }
  }

  /**
   * Assign permission to role
   * @param {string} roleId - Role ID
   * @param {string} permissionId - Permission ID
   * @returns {Promise} Assignment result
   */
  async assignPermissionToRole(roleId, permissionId) {
    try {
      const response = await apiService.post(`/api/admin/roles/${roleId}/permissions`, { permissionId });
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || 'Failed to assign permission to role');
      }
    } catch (error) {
      console.error('Error assigning permission to role:', error);
      throw error;
    }
  }

  /**
   * Remove permission from role
   * @param {string} roleId - Role ID
   * @param {string} permissionId - Permission ID
   * @returns {Promise} Removal result
   */
  async removePermissionFromRole(roleId, permissionId) {
    try {
      const response = await apiService.delete(`/api/admin/roles/${roleId}/permissions/${permissionId}`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || 'Failed to remove permission from role');
      }
    } catch (error) {
      console.error('Error removing permission from role:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new RBACService();