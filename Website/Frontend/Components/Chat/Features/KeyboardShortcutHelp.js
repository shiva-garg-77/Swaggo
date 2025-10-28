import React, { useState, useEffect } from 'react';
import KeyboardShortcutService from '../../services/KeyboardShortcutService';
import { X, Keyboard, Search } from 'lucide-react';

/**
 * ⌨️ Keyboard Shortcut Help Component
 * 
 * Displays a modal with all available keyboard shortcuts
 * 
 * Features:
 * - Organized by context
 * - Search functionality
 * - Responsive design
 */

export default function KeyboardShortcutHelp({ 
  isOpen, 
  onClose,
  theme = 'light'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [shortcuts, setShortcuts] = useState([]);

  // Load shortcuts on mount
  useEffect(() => {
    if (isOpen) {
      const helpInfo = KeyboardShortcutService.getHelpInfo();
      setShortcuts(helpInfo);
    }
  }, [isOpen]);

  // Filter shortcuts based on search query
  const filteredShortcuts = shortcuts.filter(shortcut => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      shortcut.keyCombo.toLowerCase().includes(query) ||
      shortcut.action.toLowerCase().includes(query) ||
      shortcut.description.toLowerCase().includes(query) ||
      shortcut.context.toLowerCase().includes(query)
    );
  });

  // Group shortcuts by context
  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.context]) {
      acc[shortcut.context] = [];
    }
    acc[shortcut.context].push(shortcut);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className={`rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden ${
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
              Keyboard Shortcuts
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

        {/* Search */}
        <div className={`p-4 border-b ${
          theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-3 py-2 rounded-lg border text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
          {Object.entries(groupedShortcuts).length === 0 ? (
            <div className={`text-center py-8 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Keyboard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No shortcuts found</p>
              <p className="text-sm mt-1">
                Try adjusting your search query
              </p>
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
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        theme === 'dark' 
                          ? 'bg-gray-700 hover:bg-gray-600' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div>
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
                      
                      <div className={`px-3 py-1 rounded font-mono text-sm ${
                        theme === 'dark' 
                          ? 'bg-gray-600 text-gray-200' 
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {shortcut.keyCombo.replace(/\+/g, ' + ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t text-sm ${
          theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'
        }`}>
          Tip: Shortcuts work best when not focused on input fields
        </div>
      </div>
    </div>
  );
}