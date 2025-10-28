/**
 * useMessageTemplates - Custom hook for managing message templates
 * 
 * This hook provides state management and API interactions for message templates.
 */

import { useState, useEffect, useCallback } from 'react';
import MessageTemplateService from '../services/MessageTemplateService';

export const useMessageTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load all user templates
   */
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userTemplates = await MessageTemplateService.getUserTemplates();
      setTemplates(userTemplates);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load user categories
   */
  const loadCategories = useCallback(async () => {
    try {
      const userCategories = await MessageTemplateService.getUserCategories();
      setCategories(userCategories);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  /**
   * Create a new template
   */
  const createTemplate = useCallback(async (templateData) => {
    try {
      const newTemplate = await MessageTemplateService.createTemplate(templateData);
      setTemplates(prev => [...prev, newTemplate]);
      await loadCategories(); // Refresh categories
      return newTemplate;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadCategories]);

  /**
   * Update an existing template
   */
  const updateTemplate = useCallback(async (templateId, updateData) => {
    try {
      const updatedTemplate = await MessageTemplateService.updateTemplate(templateId, updateData);
      setTemplates(prev => 
        prev.map(template => 
          template.id === templateId ? updatedTemplate : template
        )
      );
      await loadCategories(); // Refresh categories
      return updatedTemplate;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Delete a template
   */
  const deleteTemplate = useCallback(async (templateId) => {
    try {
      await MessageTemplateService.deleteTemplate(templateId);
      setTemplates(prev => prev.filter(template => template.id !== templateId));
      await loadCategories(); // Refresh categories
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Search templates
   */
  const searchTemplates = useCallback(async (query) => {
    try {
      const results = await MessageTemplateService.searchTemplates(query);
      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Get templates by category
   */
  const getTemplatesByCategory = useCallback(async (category) => {
    try {
      const results = await MessageTemplateService.getTemplatesByCategory(category);
      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Load templates and categories on mount
  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, [loadTemplates, loadCategories]);

  return {
    templates,
    categories,
    loading,
    error,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    searchTemplates,
    getTemplatesByCategory
  };
};

export default useMessageTemplates;