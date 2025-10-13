'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';

export default function EditMessageModal({ 
  message, 
  isOpen, 
  onSave, 
  onCancel 
}) {
  const [editedContent, setEditedContent] = useState(message?.content || '');
  const [originalContent, setOriginalContent] = useState(message?.content || '');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && message) {
      setEditedContent(message.content || '');
      setOriginalContent(message.content || '');
    }
  }, [isOpen, message]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Focus the textarea when modal opens
      textareaRef.current.focus();
      // Move cursor to end of text
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (editedContent.trim() !== originalContent.trim()) {
      onSave(editedContent.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e) => {
    // Save on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Cancel on Escape
    else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  if (!isOpen || !message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Message
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Original Message Preview */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Original message:
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            {originalContent}
          </div>
        </div>

        {/* Edit Area */}
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-32 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
            placeholder="Edit your message..."
          />
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Press Ctrl+Enter to save
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={editedContent.trim() === originalContent.trim() || !editedContent.trim()}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
                  editedContent.trim() === originalContent.trim() || !editedContent.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Footer with edit history info */}
        {message?.editHistory && message.editHistory.length > 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800 rounded-b-xl">
            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
              <RotateCcw className="w-4 h-4" />
              <span>
                This message has been edited {message.editHistory.length} time{message.editHistory.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}