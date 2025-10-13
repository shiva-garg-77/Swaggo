import React, { useEffect, useState } from 'react';
import useMessageTemplates from '../../hooks/useMessageTemplates';

export default function MessageTemplatesPanel({ isOpen, onClose, onInsert }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('general');
  
  const {
    templates,
    categories,
    isLoading,
    error,
    createTemplate,
    deleteTemplate,
    searchTemplates,
    getUserCategories
  } = useMessageTemplates();

  const [filteredTemplates, setFilteredTemplates] = useState(templates);

  const addTemplate = async () => {
    if (!title.trim() || !text.trim()) return;
    
    try {
      await createTemplate({
        title: title.trim(),
        content: text.trim(),
        category: category.trim() || 'general'
      });
      
      setTitle('');
      setText('');
      setCategory('general');
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const removeTemplate = async (id) => {
    try {
      await deleteTemplate(id);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  useEffect(() => {
    if (search.trim()) {
      const filtered = templates.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.content.toLowerCase().includes(search.toLowerCase()) ||
        (t.category && t.category.toLowerCase().includes(search.toLowerCase()))
      );
      setFilteredTemplates(filtered);
    } else {
      setFilteredTemplates(templates);
    }
  }, [search, templates]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Message Templates</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Template title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            <textarea
              placeholder="Template text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={addTemplate}
              disabled={isLoading}
              className={`px-3 py-2 rounded ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            >
              {isLoading ? 'Saving...' : 'Save Template'}
            </button>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <div className="max-h-72 overflow-auto space-y-2">
              {isLoading ? (
                <div className="text-sm text-gray-500">Loading templates...</div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-sm text-gray-500">No templates found</div>
              ) : (
                filteredTemplates.map(t => (
                  <div key={t.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{t.title}</div>
                        {t.category && t.category !== 'general' && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.category}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onInsert && onInsert(t.content)}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Insert
                        </button>
                        <button
                          onClick={() => removeTemplate(t.id)}
                          className="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-3">{t.content}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Created: {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
