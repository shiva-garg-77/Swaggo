import React, { useState, useEffect } from 'react';
import useMessageTemplates from '../../hooks/useMessageTemplates';
import { Plus, Search, Edit, Trash2, Folder, Tag, Filter } from 'lucide-react';

/**
 * 📋 Advanced Template Manager Component
 * 
 * Provides advanced functionality for managing message templates
 * 
 * Features:
 * - Template creation and editing
 * - Category management
 * - Advanced search and filtering
 * - Template organization
 */

export default function AdvancedTemplateManager({ 
  isOpen, 
  onClose, 
  onInsert,
  theme = 'light'
}) {
  const [activeView, setActiveView] = useState('list'); // list, create, edit
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  
  const {
    templates,
    categories,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    searchTemplates,
    getUserCategories
  } = useMessageTemplates();

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    // Category filter
    if (selectedCategory !== 'all' && template.category !== selectedCategory) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.title.toLowerCase().includes(query) ||
        template.content.toLowerCase().includes(query) ||
        (template.category && template.category.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // Reset form when switching views
  useEffect(() => {
    if (activeView === 'list') {
      setSelectedTemplate(null);
      setTitle('');
      setContent('');
      setCategory('general');
    } else if (activeView === 'edit' && selectedTemplate) {
      setTitle(selectedTemplate.title);
      setContent(selectedTemplate.content);
      setCategory(selectedTemplate.category || 'general');
    }
  }, [activeView, selectedTemplate]);

  const handleCreateTemplate = async () => {
    if (!title.trim() || !content.trim()) return;
    
    try {
      await createTemplate({
        title: title.trim(),
        content: content.trim(),
        category: category.trim() || 'general'
      });
      
      // Reset form and switch to list view
      setTitle('');
      setContent('');
      setCategory('general');
      setActiveView('list');
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate || !title.trim() || !content.trim()) return;
    
    try {
      await updateTemplate(selectedTemplate.id, {
        title: title.trim(),
        content: content.trim(),
        category: category.trim() || 'general'
      });
      
      // Reset form and switch to list view
      setSelectedTemplate(null);
      setTitle('');
      setContent('');
      setCategory('general');
      setActiveView('list');
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await deleteTemplate(templateId);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setActiveView('edit');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className={`rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {activeView === 'create' ? 'Create Template' : 
             activeView === 'edit' ? 'Edit Template' : 
             'Message Templates'}
          </h3>
          <button 
            onClick={onClose} 
            className={`text-gray-500 hover:text-gray-700 ${
              theme === 'dark' ? 'dark:text-gray-400 dark:hover:text-gray-200' : ''
            }`}
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        {activeView === 'list' && (
          <div className={`p-4 border-b ${
            theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveView('create')}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'dark' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-3 py-2 rounded-lg border text-sm ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
          {activeView === 'list' && (
            <div className="space-y-3">
              {isLoading ? (
                <div className={`text-center py-8 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Loading templates...
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className={`text-center py-8 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No templates found</p>
                  <p className="text-sm mt-1">
                    {searchQuery || selectedCategory !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Create your first template to get started'}
                  </p>
                  {!searchQuery && selectedCategory === 'all' && (
                    <button
                      onClick={() => setActiveView('create')}
                      className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium ${
                        theme === 'dark' 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      Create Template
                    </button>
                  )}
                </div>
              ) : (
                filteredTemplates.map(template => (
                  <div 
                    key={template.id} 
                    className={`p-4 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {template.title}
                          </h4>
                          {template.category && template.category !== 'general' && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              theme === 'dark' 
                                ? 'bg-gray-600 text-gray-200' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              <Tag className="w-3 h-3 mr-1" />
                              {template.category}
                            </span>
                          )}
                        </div>
                        <p className={`mt-2 text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {template.content}
                        </p>
                        <div className={`text-xs mt-2 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Created {new Date(template.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => onInsert && onInsert(template.content)}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark' 
                              ? 'text-green-400 hover:bg-gray-600' 
                              : 'text-green-600 hover:bg-gray-100'
                          }`}
                          title="Insert template"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark' 
                              ? 'text-blue-400 hover:bg-gray-600' 
                              : 'text-blue-600 hover:bg-gray-100'
                          }`}
                          title="Edit template"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark' 
                              ? 'text-red-400 hover:bg-gray-600' 
                              : 'text-red-600 hover:bg-gray-100'
                          }`}
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {(activeView === 'create' || activeView === 'edit') && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Template Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter template title"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="general">General</option>
                  <option value="greetings">Greetings</option>
                  <option value="thanks">Thanks</option>
                  <option value="apologies">Apologies</option>
                  <option value="questions">Questions</option>
                  <option value="confirmations">Confirmations</option>
                  {categories.filter(cat => !['general', 'greetings', 'thanks', 'apologies', 'questions', 'confirmations'].includes(cat)).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Template Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter template content"
                  rows={6}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              
              {error && (
                <div className={`p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'
                }`}>
                  {error}
                </div>
              )}
              
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={() => setActiveView('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    theme === 'dark' 
                      ? 'bg-gray-600 text-white hover:bg-gray-500' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={activeView === 'create' ? handleCreateTemplate : handleUpdateTemplate}
                  disabled={isLoading || !title.trim() || !content.trim()}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    isLoading || !title.trim() || !content.trim()
                      ? theme === 'dark' 
                        ? 'bg-gray-600 text-gray-400' 
                        : 'bg-gray-200 text-gray-500'
                      : theme === 'dark' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isLoading ? 'Saving...' : activeView === 'create' ? 'Create Template' : 'Update Template'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}