/**
 * CHARACTER COUNTER COMPONENT
 * Solves: 6.3 - Bio Character Count
 */

'use client';

import React from 'react';

export default function CharacterCounter({
    current = 0,
    max = 150,
    showCount = true,
    showProgress = true,
    warningThreshold = 0.8, // Show warning at 80%
    className = ''
}) {
    const percentage = (current / max) * 100;
    const isWarning = percentage >= warningThreshold * 100;
    const isError = current > max;

    const getColor = () => {
        if (isError) return 'text-red-600 dark:text-red-400';
        if (isWarning) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-gray-500 dark:text-gray-400';
    };

    const getProgressColor = () => {
        if (isError) return 'bg-red-500';
        if (isWarning) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Progress Bar */}
            {showProgress && (
                <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${getProgressColor()}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
            )}

            {/* Count */}
            {showCount && (
                <span className={`text-xs font-medium ${getColor()} transition-colors`}>
                    {current}/{max}
                </span>
            )}
        </div>
    );
}

/**
 * Hook for character counting
 */
export function useCharacterCount(initialValue = '', maxLength = 150) {
    const [value, setValue] = React.useState(initialValue);
    const [count, setCount] = React.useState(initialValue.length);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setValue(newValue);
        setCount(newValue.length);
    };

    const isValid = count <= maxLength;
    const remaining = maxLength - count;

    return {
        value,
        count,
        maxLength,
        isValid,
        remaining,
        handleChange,
        setValue
    };
}
