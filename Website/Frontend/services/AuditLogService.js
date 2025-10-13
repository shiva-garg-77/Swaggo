/**
 * Audit Log Service - Frontend service for interacting with audit log API
 * 
 * This service provides a unified interface for querying and managing audit logs.
 */

import apiService from './ApiService';

class AuditLogService {
  /**
   * Get audit logs with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Pagination and sorting options
   * @returns {Promise} Array of audit logs
   */
  async getAuditLogs(filters = {}, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          queryParams.append(key, filters[key]);
        }
      });
      
      // Add options
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined && options[key] !== null) {
          queryParams.append(key, options[key]);
        }
      });
      
      const response = await apiService.get(`/api/audit-logs?${queryParams}`);
      if (response.success) {
        return response.logs;
      } else {
        throw new Error(response.error || 'Failed to get audit logs');
      }
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise} Array of audit logs
   */
  async getAuditLogsByUser(userId, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined && options[key] !== null) {
          queryParams.append(key, options[key]);
        }
      });
      
      const response = await apiService.get(`/api/audit-logs/user/${userId}?${queryParams}`);
      if (response.success) {
        return response.logs;
      } else {
        throw new Error(response.error || 'Failed to get user audit logs');
      }
    } catch (error) {
      console.error('Error getting user audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific resource
   * @param {string} resourceId - Resource ID
   * @param {Object} options - Query options
   * @returns {Promise} Array of audit logs
   */
  async getAuditLogsByResource(resourceId, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined && options[key] !== null) {
          queryParams.append(key, options[key]);
        }
      });
      
      const response = await apiService.get(`/api/audit-logs/resource/${resourceId}?${queryParams}`);
      if (response.success) {
        return response.logs;
      } else {
        throw new Error(response.error || 'Failed to get resource audit logs');
      }
    } catch (error) {
      console.error('Error getting resource audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific compliance tag
   * @param {string} complianceTag - Compliance tag
   * @param {Object} options - Query options
   * @returns {Promise} Array of audit logs
   */
  async getAuditLogsByComplianceTag(complianceTag, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined && options[key] !== null) {
          queryParams.append(key, options[key]);
        }
      });
      
      const response = await apiService.get(`/api/audit-logs/compliance/${complianceTag}?${queryParams}`);
      if (response.success) {
        return response.logs;
      } else {
        throw new Error(response.error || 'Failed to get compliance audit logs');
      }
    } catch (error) {
      console.error('Error getting compliance audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit log statistics
   * @param {Object} filters - Filter criteria
   * @returns {Promise} Statistics data
   */
  async getStatistics(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          queryParams.append(key, filters[key]);
        }
      });
      
      const response = await apiService.get(`/api/audit-logs/statistics?${queryParams}`);
      if (response.success) {
        return response.statistics;
      } else {
        throw new Error(response.error || 'Failed to get audit log statistics');
      }
    } catch (error) {
      console.error('Error getting audit log statistics:', error);
      throw error;
    }
  }

  /**
   * Export audit logs
   * @param {Object} filters - Filter criteria
   * @param {string} format - Export format (json, csv)
   * @returns {Promise} Exported data
   */
  async exportLogs(filters = {}, format = 'json') {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          queryParams.append(key, filters[key]);
        }
      });
      
      // Add format
      queryParams.append('format', format);
      
      const response = await apiService.get(`/api/audit-logs/export?${queryParams}`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }

  /**
   * Verify log integrity
   * @param {string} logId - Log ID to verify
   * @returns {Promise} Verification result
   */
  async verifyLogIntegrity(logId) {
    try {
      const response = await apiService.post(`/api/audit-logs/verify/${logId}`);
      if (response.success) {
        return response.verification;
      } else {
        throw new Error(response.error || 'Failed to verify log integrity');
      }
    } catch (error) {
      console.error('Error verifying log integrity:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new AuditLogService();