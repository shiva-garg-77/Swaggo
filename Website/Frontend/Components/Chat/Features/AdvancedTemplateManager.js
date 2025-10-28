/**
 * AdvancedTemplateManager - Advanced component for managing message templates
 * 
 * This component provides a comprehensive UI for creating, editing, and organizing message templates.
 */

import React, { useState } from 'react';
import { X, Plus, Save, Trash2, FolderPlus, Edit3 } from 'lucide-react';
import useMessageTemplates from '../../hooks/useMessageTemplates';

const AdvancedTemplateManager = ({ isOpen, onClose }) => {
  const { 
    templates, 
    categories, 
    loading, 
    error, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate 
  } = useMessageTemplates();
  
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' or 'categories'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general'
  });
  const [newCategory, setNewCategory] = useState('');

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle template selection for editing
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData({
      title: template.title,
      content: template.content,
      category: template.category || 'general'
    });
    setIsEditing(true);
  };

  // Handle creating a new template
  const handleCreateTemplate = async () => {
    try {
      await createTemplate(formData);
      setFormData({
        title: '',
        content: '',
        category: 'general'
      });
    } catch (err) {
      console.error('Failed to create template:', err);
    }
  };

  // Handle updating an existing template
  const handleUpdateTemplate = async () => {
    try {
      if (selectedTemplate) {
        await updateTemplate(selectedTemplate.id, formData);
        setSelectedTemplate(null);
        setIsEditing(false);
        setFormData({
          title: '',
          content: '',
          category: 'general'
        });
      }
    } catch (err) {
      console.error('Failed to update template:', err);
    }
  };

  // Handle deleting a template
  const handleDeleteTemplate = async (templateId) => {
    try {
      await deleteTemplate(templateId);
      if (selectedTemplate && selectedTemplate.id === templateId) {
        setSelectedTemplate(null);
        setIsEditing(false);
        setFormData({
          title: '',
          content: '',
          category: 'general'
        });
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  // Handle creating a new category
  const handleCreateCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      // In a real implementation, this would call an API to create a category
      setNewCategory('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Template Manager</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'templates'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'categories'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Categories
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'templates' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template Form */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-lg text-gray-900 dark:text-white mb-4">
                  {isEditing ? 'Edit Template' : 'Create New Template'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Template title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <div className="flex gap-2">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="general">General</option>
                        <option value="greetings">Greetings</option>
                        <option value="farewells">Farewells</option>
                        <option value="work">Work</option>
                        <option value="personal">Personal</option>
                        {categories
                          .filter(cat => !['general', 'greetings', 'farewells', 'work', 'personal'].includes(cat))
                          .map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))
                        }
                      </select>
                      <button 
                        onClick={() => setActiveTab('categories')}
                        className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        <FolderPlus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Content
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Template content..."
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleUpdateTemplate}
                          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Update Template
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setSelectedTemplate(null);
                            setFormData({
                              title: '',
                              content: '',
                              category: 'general'
                            });
                          }}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleCreateTemplate}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Create Template
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Templates List */}
              <div>
                <h3 className="font-medium text-lg text-gray-900 dark:text-white mb-4">
                  Your Templates
                </h3>
                
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-500">Error loading templates: {error}</p>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No templates yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {templates.map(template => (
                      <div 
                        key={template.id} 
                        className={`p-3 rounded-lg transition-colors cursor-pointer ${
                          selectedTemplate?.id === template.id
                            ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                            : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{template.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                              {template.content}
                            </p>
                            {template.category && (
                              <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                {template.category}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-500 ml-2"
                          >
                            <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Categories Tab
            <div className="max-w-2xl mx-auto">
              <h3 className="font-medium text-lg text-gray-900 dark:text-white mb-4">
                Manage Categories
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="New category name"
                  />
                  <button
                    onClick={handleCreateCategory}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['general', 'greetings', 'farewells', 'work', 'personal', ...categories].map(category => (
                  <div 
                    key={category} 
                    className="p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 flex items-center justify-between"
                  >
                    <span className="text-gray-900 dark:text-white">{category}</span>
                    <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-500">
                      <Edit3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTemplateManager;