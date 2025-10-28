/**
 * Cloud Storage Service - Handles integration with various cloud storage providers
 * 
 * This service provides a unified interface for interacting with different cloud storage
 * providers like Google Drive, Dropbox, OneDrive, etc.
 * 
 * @module CloudStorageService
 * @version 1.0.0
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

class CloudStorageService {
  constructor() {
    this.providers = {
      google: {
        name: 'Google Drive',
        baseUrl: 'https://www.googleapis.com/drive/v3',
        authUrl: 'https://accounts.google.com/o/oauth2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI
      },
      dropbox: {
        name: 'Dropbox',
        baseUrl: 'https://api.dropboxapi.com/2',
        authUrl: 'https://www.dropbox.com/oauth2/authorize',
        tokenUrl: 'https://api.dropbox.com/oauth2/token',
        clientId: process.env.DROPBOX_CLIENT_ID,
        clientSecret: process.env.DROPBOX_CLIENT_SECRET,
        redirectUri: process.env.DROPBOX_REDIRECT_URI
      },
      onedrive: {
        name: 'OneDrive',
        baseUrl: 'https://graph.microsoft.com/v1.0',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        clientId: process.env.ONEDRIVE_CLIENT_ID,
        clientSecret: process.env.ONEDRIVE_CLIENT_SECRET,
        redirectUri: process.env.ONEDRIVE_REDIRECT_URI
      }
    };
    
    this.tokens = new Map(); // In-memory token storage (should use Redis or DB in production)
  }
  
  /**
   * Get OAuth authorization URL for a provider
   * @param {string} provider - Provider name (google, dropbox, onedrive)
   * @param {string} userId - User ID for token association
   * @returns {string} Authorization URL
   */
  getAuthUrl(provider, userId) {
    const config = this.providers[provider];
    if (!config) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    const state = `${provider}_${userId}_${Date.now()}`;
    const scope = this.getProviderScopes(provider);
    
    let authUrl = `${config.authUrl}?`;
    authUrl += `client_id=${config.clientId}`;
    authUrl += `&redirect_uri=${config.redirectUri}`;
    authUrl += `&scope=${encodeURIComponent(scope)}`;
    authUrl += `&state=${state}`;
    authUrl += `&response_type=code`;
    
    if (provider === 'google') {
      authUrl += '&access_type=offline&prompt=consent';
    }
    
    return authUrl;
  }
  
  /**
   * Exchange authorization code for access token
   * @param {string} provider - Provider name
   * @param {string} code - Authorization code
   * @param {string} state - State parameter from OAuth flow
   * @returns {Object} Token response
   */
  async exchangeCodeForToken(provider, code, state) {
    const config = this.providers[provider];
    if (!config) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    try {
      const response = await axios.post(config.tokenUrl, {
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      // Store token with user association (parsed from state)
      const [providerName, userId] = state.split('_');
      this.tokens.set(`${provider}_${userId}`, {
        ...response.data,
        userId,
        provider,
        expiresAt: Date.now() + (response.data.expires_in * 1000)
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error exchanging code for ${provider} token:`, error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Refresh access token
   * @param {string} provider - Provider name
   * @param {string} userId - User ID
   * @returns {Object} New token response
   */
  async refreshToken(provider, userId) {
    const config = this.providers[provider];
    if (!config) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    const tokenKey = `${provider}_${userId}`;
    const tokenData = this.tokens.get(tokenKey);
    
    if (!tokenData || !tokenData.refresh_token) {
      throw new Error(`No refresh token found for ${provider} user ${userId}`);
    }
    
    try {
      const response = await axios.post(config.tokenUrl, {
        refresh_token: tokenData.refresh_token,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'refresh_token'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      // Update token data
      const newTokenData = {
        ...tokenData,
        ...response.data,
        expiresAt: Date.now() + (response.data.expires_in * 1000)
      };
      
      this.tokens.set(tokenKey, newTokenData);
      return response.data;
    } catch (error) {
      console.error(`Error refreshing ${provider} token:`, error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Check if token is expired and refresh if needed
   * @param {string} provider - Provider name
   * @param {string} userId - User ID
   * @returns {Object} Valid token data
   */
  async getValidToken(provider, userId) {
    const tokenKey = `${provider}_${userId}`;
    let tokenData = this.tokens.get(tokenKey);
    
    if (!tokenData) {
      throw new Error(`No token found for ${provider} user ${userId}`);
    }
    
    // Check if token is expired (with 5 minute buffer)
    if (tokenData.expiresAt < Date.now() - (5 * 60 * 1000)) {
      try {
        tokenData = await this.refreshToken(provider, userId);
      } catch (error) {
        // If refresh fails, remove the token
        this.tokens.delete(tokenKey);
        throw error;
      }
    }
    
    return tokenData;
  }
  
  /**
   * Upload file to cloud storage
   * @param {string} provider - Provider name
   * @param {string} userId - User ID
   * @param {Object} fileData - File data { path, filename, mimeType }
   * @param {Object} options - Upload options
   * @returns {Object} Upload result
   */
  async uploadFile(provider, userId, fileData, options = {}) {
    const tokenData = await this.getValidToken(provider, userId);
    
    switch (provider) {
      case 'google':
        return this.uploadToGoogleDrive(tokenData, fileData, options);
      case 'dropbox':
        return this.uploadToDropbox(tokenData, fileData, options);
      case 'onedrive':
        return this.uploadToOneDrive(tokenData, fileData, options);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
  
  /**
   * List files from cloud storage
   * @param {string} provider - Provider name
   * @param {string} userId - User ID
   * @param {Object} options - List options
   * @returns {Array} List of files
   */
  async listFiles(provider, userId, options = {}) {
    const tokenData = await this.getValidToken(provider, userId);
    
    switch (provider) {
      case 'google':
        return this.listGoogleDriveFiles(tokenData, options);
      case 'dropbox':
        return this.listDropboxFiles(tokenData, options);
      case 'onedrive':
        return this.listOneDriveFiles(tokenData, options);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
  
  /**
   * Download file from cloud storage
   * @param {string} provider - Provider name
   * @param {string} userId - User ID
   * @param {string} fileId - File ID
   * @param {string} destinationPath - Local path to save file
   * @returns {Object} Download result
   */
  async downloadFile(provider, userId, fileId, destinationPath) {
    const tokenData = await this.getValidToken(provider, userId);
    
    switch (provider) {
      case 'google':
        return this.downloadFromGoogleDrive(tokenData, fileId, destinationPath);
      case 'dropbox':
        return this.downloadFromDropbox(tokenData, fileId, destinationPath);
      case 'onedrive':
        return this.downloadFromOneDrive(tokenData, fileId, destinationPath);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
  
  /**
   * Delete file from cloud storage
   * @param {string} provider - Provider name
   * @param {string} userId - User ID
   * @param {string} fileId - File ID
   * @returns {Object} Delete result
   */
  async deleteFile(provider, userId, fileId) {
    const tokenData = await this.getValidToken(provider, userId);
    
    switch (provider) {
      case 'google':
        return this.deleteFromGoogleDrive(tokenData, fileId);
      case 'dropbox':
        return this.deleteFromDropbox(tokenData, fileId);
      case 'onedrive':
        return this.deleteFromOneDrive(tokenData, fileId);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
  
  /**
   * Get provider-specific scopes
   * @param {string} provider - Provider name
   * @returns {string} Scopes string
   */
  getProviderScopes(provider) {
    switch (provider) {
      case 'google':
        return 'https://www.googleapis.com/auth/drive.file';
      case 'dropbox':
        return 'files.metadata.write files.content.write files.content.read';
      case 'onedrive':
        return 'Files.ReadWrite';
      default:
        return '';
    }
  }
  
  /**
   * Google Drive specific methods
   */
  async uploadToGoogleDrive(tokenData, fileData, options) {
    try {
      // First, create file metadata
      const metadata = {
        name: fileData.filename,
        mimeType: fileData.mimeType
      };
      
      // Add parent folder if specified
      if (options.parentId) {
        metadata.parents = [options.parentId];
      }
      
      // Upload file
      const response = await axios.post(
        `${this.providers.google.baseUrl}/files?uploadType=multipart`,
        {
          metadata,
          file: fs.createReadStream(fileData.path)
        },
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'multipart/related; boundary=boundary'
          }
        }
      );
      
      return {
        success: true,
        fileId: response.data.id,
        name: response.data.name,
        mimeType: response.data.mimeType,
        size: response.data.size
      };
    } catch (error) {
      console.error('Error uploading to Google Drive:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async listGoogleDriveFiles(tokenData, options) {
    try {
      const params = {
        pageSize: options.limit || 100,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime)'
      };
      
      if (options.query) {
        params.q = options.query;
      }
      
      const response = await axios.get(`${this.providers.google.baseUrl}/files`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        },
        params
      });
      
      return response.data.files.map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdTime,
        modifiedAt: file.modifiedTime,
        provider: 'google'
      }));
    } catch (error) {
      console.error('Error listing Google Drive files:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async downloadFromGoogleDrive(tokenData, fileId, destinationPath) {
    try {
      const response = await axios.get(
        `${this.providers.google.baseUrl}/files/${fileId}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          },
          responseType: 'stream'
        }
      );
      
      const writer = fs.createWriteStream(destinationPath);
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve({ success: true, path: destinationPath }));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading from Google Drive:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async deleteFromGoogleDrive(tokenData, fileId) {
    try {
      await axios.delete(`${this.providers.google.baseUrl}/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting from Google Drive:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Dropbox specific methods
   */
  async uploadToDropbox(tokenData, fileData, options) {
    try {
      const dropboxPath = options.path || `/${fileData.filename}`;
      
      const response = await axios.post(
        `${this.providers.dropbox.baseUrl}/files/upload`,
        fs.createReadStream(fileData.path),
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Dropbox-API-Arg': JSON.stringify({
              path: dropboxPath,
              mode: 'add',
              autorename: true,
              mute: false
            }),
            'Content-Type': 'application/octet-stream'
          }
        }
      );
      
      return {
        success: true,
        fileId: response.data.id,
        name: response.data.name,
        path: response.data.path_display,
        size: response.data.size
      };
    } catch (error) {
      console.error('Error uploading to Dropbox:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async listDropboxFiles(tokenData, options) {
    try {
      const response = await axios.post(
        `${this.providers.dropbox.baseUrl}/files/list_folder`,
        {
          path: options.path || '',
          recursive: false,
          include_media_info: true,
          include_deleted: false,
          limit: options.limit || 100
        },
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.entries.map(entry => ({
        id: entry.id,
        name: entry.name,
        mimeType: entry['.tag'] === 'file' ? 'application/octet-stream' : 'directory',
        size: entry.size || 0,
        createdAt: entry.server_modified,
        modifiedAt: entry.client_modified,
        path: entry.path_display,
        provider: 'dropbox'
      }));
    } catch (error) {
      console.error('Error listing Dropbox files:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async downloadFromDropbox(tokenData, fileId, destinationPath) {
    try {
      // First, get file metadata to get the path
      const metadataResponse = await axios.post(
        `${this.providers.dropbox.baseUrl}/files/get_metadata`,
        { path: fileId },
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const response = await axios.post(
        `${this.providers.dropbox.baseUrl}/files/download`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Dropbox-API-Arg': JSON.stringify({
              path: metadataResponse.data.path_display
            })
          },
          responseType: 'stream'
        }
      );
      
      const writer = fs.createWriteStream(destinationPath);
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve({ success: true, path: destinationPath }));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading from Dropbox:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async deleteFromDropbox(tokenData, fileId) {
    try {
      await axios.post(
        `${this.providers.dropbox.baseUrl}/files/delete_v2`,
        { path: fileId },
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting from Dropbox:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * OneDrive specific methods
   */
  async uploadToOneDrive(tokenData, fileData, options) {
    try {
      const onedrivePath = options.path || `/${fileData.filename}`;
      
      const response = await axios.put(
        `${this.providers.onedrive.baseUrl}/me/drive/root:${onedrivePath}:/content`,
        fs.createReadStream(fileData.path),
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/octet-stream'
          }
        }
      );
      
      return {
        success: true,
        fileId: response.data.id,
        name: response.data.name,
        mimeType: response.data.file?.mimeType,
        size: response.data.size
      };
    } catch (error) {
      console.error('Error uploading to OneDrive:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async listOneDriveFiles(tokenData, options) {
    try {
      const path = options.path || '/children';
      const response = await axios.get(
        `${this.providers.onedrive.baseUrl}/me/drive/root${path}`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          },
          params: {
            $top: options.limit || 100
          }
        }
      );
      
      return response.data.value.map(item => ({
        id: item.id,
        name: item.name,
        mimeType: item.file?.mimeType || 'folder',
        size: item.size || 0,
        createdAt: item.createdDateTime,
        modifiedAt: item.lastModifiedDateTime,
        provider: 'onedrive'
      }));
    } catch (error) {
      console.error('Error listing OneDrive files:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async downloadFromOneDrive(tokenData, fileId, destinationPath) {
    try {
      const response = await axios.get(
        `${this.providers.onedrive.baseUrl}/me/drive/items/${fileId}/content`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          },
          responseType: 'stream'
        }
      );
      
      const writer = fs.createWriteStream(destinationPath);
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve({ success: true, path: destinationPath }));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading from OneDrive:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async deleteFromOneDrive(tokenData, fileId) {
    try {
      await axios.delete(
        `${this.providers.onedrive.baseUrl}/me/drive/items/${fileId}`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        }
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting from OneDrive:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Get connected providers for a user
   * @param {string} userId - User ID
   * @returns {Array} List of connected providers
   */
  getConnectedProviders(userId) {
    const connected = [];
    
    Object.keys(this.providers).forEach(provider => {
      const tokenKey = `${provider}_${userId}`;
      if (this.tokens.has(tokenKey)) {
        connected.push({
          id: provider,
          name: this.providers[provider].name,
          connected: true
        });
      } else {
        connected.push({
          id: provider,
          name: this.providers[provider].name,
          connected: false
        });
      }
    });
    
    return connected;
  }
  
  /**
   * Disconnect a provider for a user
   * @param {string} provider - Provider name
   * @param {string} userId - User ID
   */
  disconnectProvider(provider, userId) {
    const tokenKey = `${provider}_${userId}`;
    this.tokens.delete(tokenKey);
  }
}

// Export singleton instance
export default new CloudStorageService();