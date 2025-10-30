'use client';

import { useState, useRef } from 'react';
import { X, Download, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { useMessageTemplateStore } from '../../../store/messageTemplateStore';
import toast from 'react-hot-toast';

/**
 * Template Import/Export Component
 * Allows users to backup, export, and import templates
 */
export default function TemplateImportExport({ isOpen, onClose, theme = 'light' }) {
  const { templates, createTemplate } = useMessageTemplateStore();
  const [importData, setImportData] = useState('');
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);

  const isDark = theme === 'dark';

  const handleExport = () => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      templates: templates.map(t => ({
        title: t.title,
        content: t.content,
        category: t.category,
        isFavorite: t.isFavorite
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message-templates-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Templates exported successfully!');
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setImportData(JSON.stringify(data, null, 2));
        setImportStatus({ type: 'success', message: 'File loaded successfully' });
      } catch (error) {
        setImportStatus({ type: 'error', message: 'Invalid JSON file' });
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    try {
      const data = JSON.parse(importData);
      
      if (!data.templates || !Array.isArray(data.templates)) {
        throw new Error('Invalid template format');
      }

      let imported = 0;
      let failed = 0;

      for (const template of data.templates) {
        try {
          await createTemplate({
            title: template.title,
            content: template.content,
            category: template.category || 'General',
            isFavorite: template.isFavorite || false
          });
          imported++;
        } catch (error) {
          failed++;
        }
      }

      setImportStatus({
        type: 'success',
        message: `Imported ${imported} templates${failed > 0 ? `, ${failed} failed` : ''}`
      });
      toast.success(`Successfully imported ${imported} templates!`);
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setImportStatus({ type: 'error', message: 'Failed to import templates' });
      toast.error('Failed to import templates');
    }
  };

  const handlePasteImport = () => {
    navigator.clipboard.readText().then(text => {
      try {
        const data = JSON.parse(text);
        setImportData(JSON.stringify(data, null, 2));
        setImportStatus({ type: 'success', message: 'Data pasted successfully' });
      } catch (error) {
        setImportStatus({ type: 'error', message: 'Invalid JSON in clipboard' });
        toast.error('Invalid JSON in clipboard');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <FileJson className="w-6 h-6 text-blue-500" />
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Import / Export Templates
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Section */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Export Templates
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Download all your templates as a JSON file for backup or sharing.
            </p>
            <button
              onClick={handleExport}
              disabled={templates.length === 0}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              Export {templates.length} Template{templates.length !== 1 ? 's' : ''}
            </button>
          </div>

          <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />

          {/* Import Section */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Import Templates
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Import templates from a JSON file or paste JSON data directly.
            </p>

            {/* File Upload */}
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 ${
                    isDark 
                      ? 'border-gray-600 hover:border-gray-500 text-gray-300' 
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  Choose File
                </button>
                <button
                  onClick={handlePasteImport}
                  className={`px-4 py-3 rounded-lg ${
                    isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  Paste JSON
                </button>
              </div>

              {/* JSON Editor */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  JSON Data
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder='Paste your JSON data here or use "Choose File" button above'
                  rows={10}
                  className={`w-full px-4 py-2 rounded-lg border font-mono text-sm resize-none ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Status Message */}
              {importStatus && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${
                  importStatus.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {importStatus.type === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="text-sm">{importStatus.message}</span>
                </div>
              )}

              {/* Import Button */}
              <button
                onClick={handleImport}
                disabled={!importData.trim()}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-5 h-5" />
                Import Templates
              </button>
            </div>
          </div>

          {/* Example Format */}
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Expected JSON Format:
            </p>
            <pre className={`text-xs overflow-x-auto ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
{`{
  "version": "1.0",
  "templates": [
    {
      "title": "Welcome Message",
      "content": "Hi {{name}}! Welcome!",
      "category": "Greetings",
      "isFavorite": false
    }
  ]
}`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
