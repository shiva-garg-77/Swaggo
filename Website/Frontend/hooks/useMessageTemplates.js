import { useState, useCallback, useEffect } from 'react';
import MessageTemplateService from '../services/MessageTemplateService';

/**
 * 📋 Message Templates Hook
 * 
 * Provides functionality for managing message templates
 * 
 * Features:
 * - Create, read, update, delete templates
 * - Search templates
 * - Category management
 * - Error handling
 */

export const useMessageTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Create a new message template
   * @param {object} templateData - Template data
   * @returns {Promise<object>} Created template
   */
  const createTemplate = useCallback(async (templateData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await MessageTemplateService.createTemplate(templateData);
      
      // Add to local templates list
      setTemplates(prev => [result.data, ...prev]);
      
      // Refresh categories
      await getUserCategories();
      
      return result;
    } catch (error) {
      console.error('Create template error:', error);
      setError(error.message || 'Failed to create template');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get all templates for the current user
   * @returns {Promise<Array>} Array of templates
   */
  const getUserTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await MessageTemplateService.getUserTemplates();
      
      setTemplates(result.data);
      
      return result.data;
    } catch (error) {
      console.error('Get user templates error:', error);
      setError(error.message || 'Failed to get templates');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get a specific template by ID
   * @param {string} templateId - Template ID
   * @returns {Promise<object>} Template object
   */
  const getTemplateById = useCallback(async (templateId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await MessageTemplateService.getTemplateById(templateId);
      
      return result.data;
    } catch (error) {
      console.error('Get template error:', error);
      setError(error.message || 'Failed to get template');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update a template
   * @param {string} templateId - Template ID
   * @param {object} updateData - Update data
   * @returns {Promise<object>} Updated template
   */
  const updateTemplate = useCallback(async (templateId, updateData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await MessageTemplateService.updateTemplate(templateId, updateData);
      
      // Update in local templates list
      setTemplates(prev => 
        prev.map(template => 
          template.id === templateId ? { ...template, ...updateData, updatedAt: new Date().toISOString() } : template
        )
      );
      
      // Refresh categories if category was updated
      if (updateData.category) {
        await getUserCategories();
      }
      
      return result.data;
    } catch (error) {
      console.error('Update template error:', error);
      setError(error.message || 'Failed to update template');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a template
   * @param {string} templateId - Template ID
   * @returns {Promise<object>} Deletion result
   */
  const deleteTemplate = useCallback(async (templateId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await MessageTemplateService.deleteTemplate(templateId);
      
      // Remove from local templates list
      setTemplates(prev => prev.filter(template => template.id !== templateId));
      
      return result;
    } catch (error) {
      console.error('Delete template error:', error);
      setError(error.message || 'Failed to delete template');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Search templates by query
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching templates
   */
  const searchTemplates = useCallback(async (query) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await MessageTemplateService.searchTemplates(query);
      
      return result.data;
    } catch (error) {
      console.error('Search templates error:', error);
      setError(error.message || 'Failed to search templates');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get templates by category
   * @param {string} category - Category name
   * @returns {Promise<Array>} Array of templates in category
   */
  const getTemplatesByCategory = useCallback(async (category) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await MessageTemplateService.getTemplatesByCategory(category);
      
      return result.data;
    } catch (error) {
      console.error('Get templates by category error:', error);
      setError(error.message || 'Failed to get templates by category');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get all categories for the current user
   * @returns {Promise<Array>} Array of categories
   */
  const getUserCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await MessageTemplateService.getUserCategories();
      
      setCategories(result.data);
      
      return result.data;
    } catch (error) {
      console.error('Get user categories error:', error);
      setError(error.message || 'Failed to get categories');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initialize templates and categories
   */
  useEffect(() => {
    getUserTemplates();
    getUserCategories();
  }, [getUserTemplates, getUserCategories]);

  return {
    // State
    templates,
    categories,
    isLoading,
    error,
    
    // Functions
    createTemplate,
    getUserTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    searchTemplates,
    getTemplatesByCategory,
    getUserCategories
  };
};

export default useMessageTemplates;