/**
 * Cloud Storage Service - Frontend service for interacting with cloud storage providers
 * 
 * This service provides a unified interface for connecting to cloud storage providers
 * and managing files across different services.
 */

import apiService from './ApiService';

class CloudStorageService {
  constructor() {
    this.providers = {
      local: {
        id: 'local',
        name: 'Local Storage',
        connected: true,
        icon: 'folder'
      },
      google: {
        id: 'google',
        name: 'Google Drive',
        connected: false,
        icon: 'cloud'
      },
      dropbox: {
        id: 'dropbox',
        name: 'Dropbox',
        connected: false,
        icon: 'cloud'
      },
      onedrive: {
        id: 'onedrive',
        name: 'OneDrive',
        connected: false,
        icon: 'cloud'
      }
    };
  }

  /**
   * Get list of available cloud storage providers
   * @returns {Array} List of providers
   */
  getProviders() {
    return Object.values(this.providers);
  }

  /**
   * Get OAuth authorization URL for a provider
   * @param {string} provider - Provider name
   * @returns {Promise} Authorization URL
   */
  async getAuthUrl(provider) {
    try {
      const response = await apiService.get(`/api/cloud/auth/${provider}`);
      if (response.success) {
        return response.authUrl;
      } else {
        throw new Error(response.error || 'Failed to get authorization URL');
      }
    } catch (error) {
      console.error(`Error getting auth URL for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Get connected providers for current user
   * @returns {Promise} List of connected providers
   */
  async getConnectedProviders() {
    try {
      const response = await apiService.get('/api/cloud/providers');
      if (response.success) {
        return response.providers;
      } else {
        throw new Error(response.error || 'Failed to get connected providers');
      }
    } catch (error) {
      console.error('Error getting connected providers:', error);
      throw error;
    }
  }

  /**
   * Disconnect a provider
   * @param {string} provider - Provider name
   * @returns {Promise} Disconnect result
   */
  async disconnectProvider(provider) {
    try {
      const response = await apiService.delete(`/api/cloud/providers/${provider}`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || 'Failed to disconnect provider');
      }
    } catch (error) {
      console.error(`Error disconnecting ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Upload file to cloud storage
   * @param {string} provider - Provider name
   * @param {string} fileId - Local file ID
   * @param {Object} options - Upload options
   * @returns {Promise} Upload result
   */
  async uploadFile(provider, fileId, options = {}) {
    try {
      const response = await apiService.post('/api/cloud/upload', {
        provider,
        fileId,
        options
      });
      if (response.success) {
        return response.result;
      } else {
        throw new Error(response.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error(`Error uploading to ${provider}:`, error);
      throw error;
    }
  }

  /**
   * List files from cloud storage
   * @param {string} provider - Provider name
   * @param {Object} options - List options
   * @returns {Promise} List of files
   */
  async listFiles(provider, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.query) queryParams.append('query', options.query);
      
      const response = await apiService.get(`/api/cloud/files/${provider}?${queryParams}`);
      if (response.success) {
        return response.files;
      } else {
        throw new Error(response.error || 'Failed to list files');
      }
    } catch (error) {
      console.error(`Error listing ${provider} files:`, error);
      throw error;
    }
  }

  /**
   * Download file from cloud storage
   * @param {string} provider - Provider name
   * @param {string} fileId - Cloud file ID
   * @returns {Promise} Download result
   */
  async downloadFile(provider, fileId) {
    try {
      // This will trigger a download in the browser
      const response = await apiService.get(`/api/cloud/download/${provider}/${fileId}`, {
        responseType: 'blob'
      });
      
      // Handle the blob response
      if (response.data) {
        return response.data;
      } else {
        throw new Error('Failed to download file');
      }
    } catch (error) {
      console.error(`Error downloading from ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Delete file from cloud storage
   * @param {string} provider - Provider name
   * @param {string} fileId - Cloud file ID
   * @returns {Promise} Delete result
   */
  async deleteFile(provider, fileId) {
    try {
      const response = await apiService.delete(`/api/cloud/files/${provider}/${fileId}`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error(`Error deleting from ${provider}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export default new CloudStorageService();