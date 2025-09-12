"use client";

import { Suspense } from 'react';
import AIAssistant from '../../../Components/MainComponents/AI/AIAssistant';
import { useTheme } from '../../../Components/Helper/ThemeProvider';
import SplashScreen from '../../../Components/shared/SplashScreen';

export default function AIAssistantPage() {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Suspense fallback={<SplashScreen compact show />}>
        <AIAssistant />
      </Suspense>
    </div>
  );
}
