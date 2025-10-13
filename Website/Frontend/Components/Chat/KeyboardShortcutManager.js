import React, { useState, useEffect } from 'react';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import KeyboardShortcutService from '../../services/KeyboardShortcutService';
import { Plus, Trash2, Edit, Save, X, Keyboard } from 'lucide-react';

/**
 * ⌨️ Keyboard Shortcut Manager Component
 * 
 * Provides functionality for managing and customizing keyboard shortcuts
 * 
 * Features:
 * - View all shortcuts
 * - Customize shortcuts
 * - Add new shortcuts
 * - Reset to defaults
 */

export default function KeyboardShortcutManager({ 
  isOpen, 
  onClose,
  theme = 'light'
}) {
  const [shortcuts, setShortcuts] = useState([]);
  const [editingShortcut, setEditingShortcut] = useState(null);
  const [newShortcut, setNewShortcut] = useState({
    context: 'global',
    keyCombo: '',
    action: '',
    description: ''
  });
  const [isAdding, setIsAdding] = useState(false);
  const [recordedKeyCombo, setRecordedKeyCombo] = useState('');

  // Load shortcuts on mount
  useEffect(() => {
    if (isOpen) {
      const helpInfo = KeyboardShortcutService.getHelpInfo();
      setShortcuts(helpInfo);
    }
  }, [isOpen]);

  // Handle keyboard events for recording shortcuts
  useEffect(() => {
    if (!isOpen || !isAdding) return;

    const handleKeyDown = (event) => {
      event.preventDefault();
      const keyCombo = KeyboardShortcutService.parseKeyEvent(event);
      setRecordedKeyCombo(keyCombo);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAdding]);

  const handleSaveShortcut = () => {
    if (editingShortcut) {
      // Update existing shortcut
      KeyboardShortcutService.unregisterShortcut(
        editingShortcut.context, 
        editingShortcut.keyCombo
      );
      
      KeyboardShortcutService.registerShortcut(
        editingShortcut.context,
        editingShortcut.keyCombo,
        editingShortcut.action,
        editingShortcut.description
      );
      
      setEditingShortcut(null);
    }
  };

  const handleDeleteShortcut = (shortcut) => {
    if (window.confirm('Are you sure you want to delete this shortcut?')) {
      KeyboardShortcutService.unregisterShortcut(
        shortcut.context, 
        shortcut.keyCombo
      );
      
      // Refresh shortcuts
      const helpInfo = KeyboardShortcutService.getHelpInfo();
      setShortcuts(helpInfo);
    }
  };

  const handleAddShortcut = () => {
    if (newShortcut.keyCombo && newShortcut.action && newShortcut.description) {
      KeyboardShortcutService.registerShortcut(
        newShortcut.context,
        newShortcut.keyCombo,
        newShortcut.action,
        newShortcut.description
      );
      
      // Reset form
      setNewShortcut({
        context: 'global',
        keyCombo: '',
        action: '',
        description: ''
      });
      setRecordedKeyCombo('');
      setIsAdding(false);
      
      // Refresh shortcuts
      const helpInfo = KeyboardShortcutService.getHelpInfo();
      setShortcuts(helpInfo);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all shortcuts to defaults?')) {
      // Clear all shortcuts
      KeyboardShortcutService.shortcuts.clear();
      
      // Reinitialize with defaults
      KeyboardShortcutService.initializeDefaultShortcuts();
      
      // Refresh shortcuts
      const helpInfo = KeyboardShortcutService.getHelpInfo();
      setShortcuts(helpInfo);
    }
  };

  // Group shortcuts by context
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.context]) {
      acc[shortcut.context] = [];
    }
    acc[shortcut.context].push(shortcut);
    return acc;
  }, {});

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
          <div className="flex items-center">
            <Keyboard className={`w-5 h-5 mr-2 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Keyboard Shortcut Manager
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className={`p-1 rounded-full transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className={`p-4 border-b ${
          theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAdding(true)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Shortcut
              </button>
              
              <button
                onClick={handleResetToDefaults}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-600 text-white hover:bg-gray-500' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-160px)]">
          {isAdding && (
            <div className={`p-4 mb-6 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
            }`}>
              <h4 className={`text-md font-semibold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Add New Shortcut
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Context
                  </label>
                  <select
                    value={newShortcut.context}
                    onChange={(e) => setNewShortcut({...newShortcut, context: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-600 border-gray-500 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="global">Global</option>
                    <option value="chat">Chat</option>
                    <option value="compose">Compose</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Key Combination
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={recordedKeyCombo || newShortcut.keyCombo}
                      readOnly
                      placeholder="Press keys to record..."
                      className={`flex-1 px-3 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    {recordedKeyCombo && (
                      <button
                        onClick={() => setRecordedKeyCombo('')}
                        className={`p-2 rounded-lg ${
                          theme === 'dark' 
                            ? 'text-gray-400 hover:bg-gray-500' 
                            : 'text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Action
                  </label>
                  <input
                    type="text"
                    value={newShortcut.action}
                    onChange={(e) => setNewShortcut({...newShortcut, action: e.target.value})}
                    placeholder="Enter action name"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={newShortcut.description}
                    onChange={(e) => setNewShortcut({...newShortcut, description: e.target.value})}
                    placeholder="Enter description"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewShortcut({
                      context: 'global',
                      keyCombo: '',
                      action: '',
                      description: ''
                    });
                    setRecordedKeyCombo('');
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    theme === 'dark' 
                      ? 'bg-gray-600 text-white hover:bg-gray-500' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddShortcut}
                  disabled={!newShortcut.keyCombo || !newShortcut.action || !newShortcut.description}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    !newShortcut.keyCombo || !newShortcut.action || !newShortcut.description
                      ? theme === 'dark' 
                        ? 'bg-gray-600 text-gray-400' 
                        : 'bg-gray-200 text-gray-500'
                      : theme === 'dark' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Add Shortcut
                </button>
              </div>
            </div>
          )}

          {Object.entries(groupedShortcuts).length === 0 ? (
            <div className={`text-center py-8 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Keyboard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No shortcuts found</p>
            </div>
          ) : (
            Object.entries(groupedShortcuts).map(([context, contextShortcuts]) => (
              <div key={context} className="mb-6">
                <h4 className={`text-md font-semibold mb-3 capitalize ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {context} Shortcuts
                </h4>
                
                <div className="space-y-2">
                  {contextShortcuts.map((shortcut, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className={`font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {shortcut.description}
                        </div>
                        <div className={`text-sm mt-1 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Action: {shortcut.action}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded font-mono text-sm ${
                          theme === 'dark' 
                            ? 'bg-gray-600 text-gray-200' 
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {shortcut.keyCombo.replace(/\+/g, ' + ')}
                        </div>
                        
                        <button
                          onClick={() => handleDeleteShortcut(shortcut)}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark' 
                              ? 'text-red-400 hover:bg-gray-500' 
                              : 'text-red-600 hover:bg-gray-200'
                          }`}
                          title="Delete shortcut"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}