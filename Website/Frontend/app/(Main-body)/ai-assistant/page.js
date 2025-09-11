"use client";

import { Suspense } from 'react';
import AIAssistant from '../../../Components/MainComponents/AI/AIAssistant';
import { useTheme } from '../../../Components/Helper/ThemeProvider';

export default function AIAssistantPage() {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Suspense fallback={null}>
        <AIAssistant />
      </Suspense>
    </div>
  );
}
