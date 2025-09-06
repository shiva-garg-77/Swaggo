"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../Helper/ThemeProvider';

export default function SplashScreen() {
    const { theme } = useTheme();


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-5 gap-5 flex-wrap transition-all duration-300">

           
            <div className=" py-6">
                {/* Fixed consistent dimensions for both light and dark logos */}
                <div className="w-32 h-16 mx-auto flex items-center justify-center">
                    <img
                        src={theme === 'light' ? '/logo_light.png' : '/Logo_dark1.png'}
                        alt="Swaggo Logo"
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            </div>

        </div>
    );
}