"use client";

import { Suspense } from 'react';
import AIAssistant from '../../../Components/MainComponents/AI/AIAssistant';
import { useTheme } from '../../../Components/Helper/ThemeProvider';

export default function AIAssistantPage() {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Suspense 
        fallback={
          <div className={`min-h-screen flex items-center justify-center ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
          }`}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Loading AI Assistant...
              </p>
            </div>
          </div>
        }
      >
        <AIAssistant />
      </Suspense>
    </div>
  );
}
