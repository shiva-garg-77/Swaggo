/**
 * Feature Flag Service
 * Handles all API calls for feature flags
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_VERSION = 'v1';

class FeatureFlagService {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/${API_VERSION}/feature`;
  }

  /**
   * Get auth headers with token
   */
  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Get all feature flags (Admin only)
   */
  async getAllFlags() {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      throw error;
    }
  }

  /**
   * Get a specific feature flag (Admin only)
   */
  async getFlag(flagName) {
    try {
      const response = await fetch(`${this.baseUrl}/${flagName}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching feature flag ${flagName}:`, error);
      throw error;
    }
  }

  /**
   * Create a new feature flag (Admin only)
   */
  async createFlag(flagName, config) {
    try {
      const response = await fetch(`${this.baseUrl}/${flagName}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating feature flag:', error);
      throw error;
    }
  }

  /**
   * Update a feature flag (Admin only)
   */
  async updateFlag(flagName, updates) {
    try {
      const response = await fetch(`${this.baseUrl}/${flagName}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating feature flag:', error);
      throw error;
    }
  }

  /**
   * Delete a feature flag (Admin only)
   */
  async deleteFlag(flagName) {
    try {
      const response = await fetch(`${this.baseUrl}/${flagName}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      throw error;
    }
  }

  /**
   * Set user override for a feature flag (Admin only)
   */
  async setUserOverride(flagName, userId, enabled) {
    try {
      const response = await fetch(`${this.baseUrl}/${flagName}/user-override`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId, enabled })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error setting user override:', error);
      throw error;
    }
  }

  /**
   * Set segment override for a feature flag (Admin only)
   */
  async setSegmentOverride(flagName, segment, enabled) {
    try {
      const response = await fetch(`${this.baseUrl}/${flagName}/segment-override`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ segment, enabled })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error setting segment override:', error);
      throw error;
    }
  }

  /**
   * Check if a feature is enabled for the current user
   */
  async checkFeatureEnabled(flagName) {
    try {
      const response = await fetch(`${this.baseUrl}/check/${flagName}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.enabled || false;
    } catch (error) {
      console.error(`Error checking feature flag ${flagName}:`, error);
      return false; // Default to disabled on error
    }
  }
}

// Export singleton instance
const featureFlagService = new FeatureFlagService();
export default featureFlagService;
