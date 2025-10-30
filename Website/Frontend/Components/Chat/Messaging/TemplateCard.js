'use client';

import { Star, Clock, Edit, Trash2 } from 'lucide-react';

export default function TemplateCard({ template, onSelect, onEdit, onDelete, theme = 'light' }) {
  const isDark = theme === 'dark';

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
        isDark ? 'bg-gray-700 border-gray-600 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-500'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {template.title}
        </h3>
        <div className="flex items-center gap-1">
          {template.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(template); }} className="p-1 hover:bg-gray-600 rounded">
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(template); }} className="p-1 hover:bg-red-600 rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <p className={`text-sm line-clamp-2 mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        {template.content}
      </p>
      <div className="flex items-center justify-between text-xs">
        <span className={`px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          {template.category || 'General'}
        </span>
        <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <Clock className="w-3 h-3" />
          {template.usageCount || 0} uses
        </span>
      </div>
    </div>
  );
}
