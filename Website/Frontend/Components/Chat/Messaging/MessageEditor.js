'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function MessageEditor({ 
  initialContent, 
  onSave, 
  onCancel, 
  isOpen 
}) {
  const [content, setContent] = useState(initialContent || '');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end of text
      textareaRef.current.selectionStart = content.length;
      textareaRef.current.selectionEnd = content.length;
    }
  }, [isOpen, content]);

  const handleSave = () => {
    if (content.trim() !== initialContent) {
      onSave(content.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Edit Message
          </h3>
          
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-32 p-4 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Edit your message..."
          />
          
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            
            <div className="flex space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Press Enter to save
              </span>
              <button
                onClick={handleSave}
                disabled={content.trim() === initialContent || content.trim() === ''}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                  content.trim() === initialContent || content.trim() === ''
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function MessageEditor({ 
  initialContent, 
  onSave, 
  onCancel, 
  isOpen 
}) {
  const [content, setContent] = useState(initialContent || '');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end of text
      textareaRef.current.selectionStart = content.length;
      textareaRef.current.selectionEnd = content.length;
    }
  }, [isOpen, content]);

  const handleSave = () => {
    if (content.trim() !== initialContent) {
      onSave(content.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Edit Message
          </h3>
          
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-32 p-4 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Edit your message..."
          />
          
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            
            <div className="flex space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Press Enter to save
              </span>
              <button
                onClick={handleSave}
                disabled={content.trim() === initialContent || content.trim() === ''}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                  content.trim() === initialContent || content.trim() === ''
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}