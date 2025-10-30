'use client';

import { User, AtSign, Calendar, MapPin } from 'lucide-react';

export default function TemplateVariableInserter({ onInsert, theme = 'light' }) {
  const isDark = theme === 'dark';

  const variables = [
    { name: 'username', label: 'Username', icon: AtSign },
    { name: 'name', label: 'Full Name', icon: User },
    { name: 'date', label: 'Current Date', icon: Calendar },
    { name: 'time', label: 'Current Time', icon: Calendar },
    { name: 'location', label: 'Location', icon: MapPin }
  ];

  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        Insert Variables
      </label>
      <div className="flex flex-wrap gap-2">
        {variables.map(variable => {
          const Icon = variable.icon;
          return (
            <button
              key={variable.name}
              onClick={() => onInsert(variable.name)}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              {variable.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
