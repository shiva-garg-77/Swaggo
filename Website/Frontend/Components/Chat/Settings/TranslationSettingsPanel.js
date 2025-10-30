'use client';

import { useState, useEffect } from 'react';
import { Languages, Globe, Zap, Info, Save } from 'lucide-react';
import LanguageSelector from '../../Helper/LanguageSelector';
import toast from 'react-hot-toast';

/**
 * Translation Settings Panel
 * Settings for translation preferences
 */
export default function TranslationSettingsPanel({ theme = 'light' }) {
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [showTranslationButton, setShowTranslationButton] = useState(true);
  const [translateIncoming, setTranslateIncoming] = useState(false);

  const isDark = theme === 'dark';

  // Load settings from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    const savedAutoTranslate = localStorage.getItem('autoTranslate') === 'true';
    const savedShowButton = localStorage.getItem('showTranslationButton') !== 'false';
    const savedTranslateIncoming = localStorage.getItem('translateIncoming') === 'true';

    if (savedLanguage) setPreferredLanguage(savedLanguage);
    setAutoTranslate(savedAutoTranslate);
    setShowTranslationButton(savedShowButton);
    setTranslateIncoming(savedTranslateIncoming);
  }, []);

  const handleSave = () => {
    localStorage.setItem('preferredLanguage', preferredLanguage);
    localStorage.setItem('autoTranslate', autoTranslate.toString());
    localStorage.setItem('showTranslationButton', showTranslationButton.toString());
    localStorage.setItem('translateIncoming', translateIncoming.toString());
    
    toast.success('Translation settings saved!');
  };

  return (
    <div className={`rounded-lg border ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`flex items-center gap-3 p-6 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <Languages className="w-6 h-6 text-blue-500" />
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Translation Settings
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Configure your translation preferences
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className="p-6 space-y-6">
        {/* Preferred Language */}
        <div>
          <LanguageSelector
            value={preferredLanguage}
            onChange={setPreferredLanguage}
            theme={theme}
            label="Preferred Language"
          />
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Messages will be translated to this language
          </p>
        </div>

        {/* Auto-Translate Toggle */}
        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Auto-Translate
                </h3>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Automatically translate all incoming messages
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoTranslate}
                onChange={(e) => setAutoTranslate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Translate Incoming Messages */}
        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-blue-500" />
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Translate Incoming Only
                </h3>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Only translate messages you receive (not your own)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={translateIncoming}
                onChange={(e) => setTranslateIncoming(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Show Translation Button */}
        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Show Translation Button
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Display translate button on each message
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showTranslationButton}
                onChange={(e) => setShowTranslationButton(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Info Box */}
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
        }`}>
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className={`font-medium mb-1 ${isDark ? 'text-blue-400' : 'text-blue-900'}`}>
              About Translation
            </h4>
            <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
              Messages are translated using AI-powered translation. Translations may not always be 100% accurate. 
              We support 12 languages including English, Hindi, Spanish, French, German, Japanese, and more.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`flex items-center justify-end gap-3 p-6 border-t ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
