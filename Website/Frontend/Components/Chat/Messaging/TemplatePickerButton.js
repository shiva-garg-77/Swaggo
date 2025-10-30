'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import TemplatePickerModal from './TemplatePickerModal';

/**
 * Template Picker Button
 * Button to open template picker modal in message input
 */
export default function TemplatePickerButton({ onTemplateSelect, theme = 'light' }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTemplateSelect = (template) => {
    onTemplateSelect(template);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 rounded-lg transition-colors ${theme === 'dark'
            ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
        title="Insert template"
      >
        <FileText className="w-5 h-5" />
      </button>

      <TemplatePickerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={handleTemplateSelect}
        theme={theme}
      />
    </>
  );
}
