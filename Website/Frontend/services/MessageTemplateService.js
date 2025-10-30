/**
 * Message Template Service
 * Handles all message template API calls
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class MessageTemplateService {
  /**
   * Get auth token from localStorage
   */
  getAuthToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  /**
   * Get auth headers
   */
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Create a new template
   */
  async createTemplate(templateData) {
    const response = await fetch(`${API_BASE_URL}/api/templates`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(templateData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create template');
    }

    return response.json();
  }

  /**
   * Get all user templates
   */
  async getUserTemplates() {
    const response = await fetch(`${API_BASE_URL}/api/templates`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch templates');
    }

    return response.json();
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId) {
    const response = await fetch(`${API_BASE_URL}/api/templates/${templateId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch template');
    }

    return response.json();
  }

  /**
   * Update template
   */
  async updateTemplate(templateId, updateData) {
    const response = await fetch(`${API_BASE_URL}/api/templates/${templateId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update template');
    }

    return response.json();
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId) {
    const response = await fetch(`${API_BASE_URL}/api/templates/${templateId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete template');
    }

    return response.json();
  }

  /**
   * Search templates
   */
  async searchTemplates(query) {
    const response = await fetch(`${API_BASE_URL}/api/templates/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to search templates');
    }

    return response.json();
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category) {
    const response = await fetch(`${API_BASE_URL}/api/templates/category/${encodeURIComponent(category)}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch templates by category');
    }

    return response.json();
  }

  /**
   * Get user categories
   */
  async getUserCategories() {
    const response = await fetch(`${API_BASE_URL}/api/templates/categories`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch categories');
    }

    return response.json();
  }

  /**
   * Replace variables in template content
   */
  replaceVariables(content, variables) {
    let result = content;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });

    return result;
  }

  /**
   * Extract variables from template content
   */
  extractVariables(content) {
    const regex = /{{(\w+)}}/g;
    const variables = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }
}

export default new MessageTemplateService();
