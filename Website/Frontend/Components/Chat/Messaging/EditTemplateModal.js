'use client';

import { useState, useEffect } from 'react';
import { X, Save, Copy, Trash2, BarChart3 } from 'lucide-react';
import { useMessageTemplateStore } from '../../../store/messageTemplateStore';
import TemplateVariableInserter from './TemplateVariableInserter';
import toast from 'react-hot-toast';

/**
 * Edit Template Modal
 * Modal for editing existing message templates
 */
export default function EditTemplateModal({ isOpen, onClose, template, theme = 'light' }) {
  const { updateTemplate, deleteTemplate } = useMessageTemplateStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (template) {
      setTitle(template.title || '');
      setContent(template.content || '');
      setCategory(template.category || 'General');
      setIsFavorite(template.isFavorite || false);
    }
  }, [template]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTemplate(template.templateId, {
        title: title.trim(),
        content: content.trim(),
        category,
        isFavorite
      });
      toast.success('Template updated successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to update template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await deleteTemplate(template.templateId);
      toast.success('Template deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicate = () => {
    setTitle(`${title} (Copy)`);
    toast.info('Template duplicated. Click Save to create a copy.');
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('template-content-edit');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + variable + content.substring(end);
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Edit Template
            </h2>
            {template.usageCount > 0 && (
              <div className={`flex items-center gap-2 mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <BarChart3 className="w-4 h-4" />
                Used {template.usageCount} times
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Template Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Template Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Welcome Message"
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* Category */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="General">General</option>
              <option value="Greetings">Greetings</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Business">Business</option>
              <option value="Support">Support</option>
              <option value="Personal">Personal</option>
            </select>
          </div>

          {/* Template Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Template Content *
              </label>
              <TemplateVariableInserter onInsert={insertVariable} theme={theme} />
            </div>
            <textarea
              id="template-content-edit"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your template message here..."
              rows={6}
              className={`w-full px-4 py-2 rounded-lg border resize-none ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Use variables like {'{{username}}'}, {'{{name}}'}, {'{{date}}'} for dynamic content
            </p>
          </div>

          {/* Favorite Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="favorite-edit"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="favorite-edit" className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Mark as favorite
            </label>
          </div>

          {/* Preview */}
          {content && (
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Preview:
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {content
                  .replace(/\{\{username\}\}/g, 'john_doe')
                  .replace(/\{\{name\}\}/g, 'John Doe')
                  .replace(/\{\{date\}\}/g, new Date().toLocaleDateString())
                  .replace(/\{\{time\}\}/g, new Date().toLocaleTimeString())
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-6 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDuplicate}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${
                isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
