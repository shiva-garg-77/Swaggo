import { create } from 'zustand';
import messageTemplateService from '../services/messageTemplateService';

/**
 * Message Template Store
 * Manages message templates state
 */
export const useMessageTemplateStore = create((set, get) => ({
  // State
  templates: [],
  recentTemplates: [],
  popularTemplates: [],
  categories: [],
  selectedTemplate: null,
  isLoading: false,
  error: null,

  // Actions
  setTemplates: (templates) => set({ templates }),
  
  setRecentTemplates: (recentTemplates) => set({ recentTemplates }),
  
  setPopularTemplates: (popularTemplates) => set({ popularTemplates }),
  
  setCategories: (categories) => set({ categories }),
  
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),

  // Fetch all user templates
  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await messageTemplateService.getUserTemplates();
      set({ 
        templates: response.data || [],
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
    }
  },

  // Create new template
  createTemplate: async (templateData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await messageTemplateService.createTemplate(templateData);
      const newTemplate = response.data;
      
      set((state) => ({
        templates: [newTemplate, ...state.templates],
        isLoading: false
      }));
      
      return newTemplate;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Update template
  updateTemplate: async (templateId, updateData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await messageTemplateService.updateTemplate(templateId, updateData);
      const updatedTemplate = response.data;
      
      set((state) => ({
        templates: state.templates.map(t => 
          t.templateId === templateId ? updatedTemplate : t
        ),
        isLoading: false
      }));
      
      return updatedTemplate;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Delete template
  deleteTemplate: async (templateId) => {
    set({ isLoading: true, error: null });
    try {
      await messageTemplateService.deleteTemplate(templateId);
      
      set((state) => ({
        templates: state.templates.filter(t => t.templateId !== templateId),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Search templates
  searchTemplates: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const response = await messageTemplateService.searchTemplates(query);
      return response.data || [];
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  // Get templates by category
  getTemplatesByCategory: async (category) => {
    set({ isLoading: true, error: null });
    try {
      const response = await messageTemplateService.getTemplatesByCategory(category);
      return response.data || [];
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch categories
  fetchCategories: async () => {
    try {
      const response = await messageTemplateService.getUserCategories();
      set({ categories: response.data || [] });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },

  // Add to recent templates
  addToRecent: (template) => {
    set((state) => {
      const recent = [template, ...state.recentTemplates.filter(t => t.templateId !== template.templateId)];
      return {
        recentTemplates: recent.slice(0, 10) // Keep only last 10
      };
    });
  },

  // Clear error
  clearError: () => set({ error: null })
}));
