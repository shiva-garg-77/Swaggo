import React from 'react';
import { Trash2, X, Forward, Download } from 'lucide-react';

const MessageSelectionToolbar = ({ 
  selectedCount, 
  onForward, 
  onDelete, 
  onExport, 
  onCancel,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  
  return (
    <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border rounded-full shadow-lg px-4 py-2 flex items-center space-x-4`}>
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
        isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
      }`}>
        {selectedCount} selected
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={onForward}
          className={`p-2 rounded-full hover:bg-opacity-20 transition-colors ${
            isDark 
              ? 'text-gray-300 hover:bg-gray-700' 
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title="Forward"
        >
          <Forward size={20} />
        </button>
        
        <button
          onClick={onDelete}
          className={`p-2 rounded-full hover:bg-opacity-20 transition-colors ${
            isDark 
              ? 'text-red-400 hover:bg-red-900' 
              : 'text-red-600 hover:bg-red-100'
          }`}
          title="Delete"
        >
          <Trash2 size={20} />
        </button>
        
        <button
          onClick={onExport}
          className={`p-2 rounded-full hover:bg-opacity-20 transition-colors ${
            isDark 
              ? 'text-gray-300 hover:bg-gray-700' 
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title="Export"
        >
          <Download size={20} />
        </button>
      </div>
      
      <button
        onClick={onCancel}
        className={`p-2 rounded-full hover:bg-opacity-20 transition-colors ${
          isDark 
            ? 'text-gray-400 hover:bg-gray-700' 
            : 'text-gray-500 hover:bg-gray-200'
        }`}
        title="Cancel"
      >
        <X size={20} />
      </button>
    </div>
  );
};

export default MessageSelectionToolbar;