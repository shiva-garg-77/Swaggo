/**
 * @fileoverview Accessibility audit component for WCAG 2.1 AA compliance checking
 * @module Components/Accessibility/AccessibilityAudit
 */

'use client';

import React, { useState, useEffect } from 'react';

/**
 * Accessibility audit component for development mode
 * @param {Object} props - Component props
 * @param {boolean} props.enabled - Whether audit is enabled
 */
export const AccessibilityAudit = ({ enabled = process.env.NODE_ENV === 'development' }) => {
  const [issues, setIssues] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const runAudit = () => {
      const newIssues = [];
      
      // Check for missing alt attributes on images
      const images = document.querySelectorAll('img:not([alt])');
      images.forEach(img => {
        newIssues.push({
          type: 'error',
          element: img,
          message: 'Image missing alt attribute',
          severity: 'high'
        });
      });
      
      // Check for low color contrast
      const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label');
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        const backgroundColor = styles.backgroundColor;
        const color = styles.color;
        
        // Simplified contrast check (in a real implementation, this would be more thorough)
        if (backgroundColor === color && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          newIssues.push({
            type: 'warning',
            element: element,
            message: 'Low color contrast detected',
            severity: 'medium'
          });
        }
      });
      
      // Check for missing form labels
      const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby]):not([id])');
      inputs.forEach(input => {
        // Check if there's a corresponding label
        const hasLabel = input.hasAttribute('id') && 
          document.querySelector(`label[for="${input.getAttribute('id')}"]`);
        
        if (!hasLabel && !input.hasAttribute('aria-label')) {
          newIssues.push({
            type: 'error',
            element: input,
            message: 'Form input missing label',
            severity: 'high'
          });
        }
      });
      
      // Check for missing ARIA roles
      const interactiveElements = document.querySelectorAll('div[onclick], div[onkeydown]');
      interactiveElements.forEach(element => {
        if (!element.hasAttribute('role') && !element.hasAttribute('tabindex')) {
          newIssues.push({
            type: 'warning',
            element: element,
            message: 'Interactive element missing ARIA role or tabindex',
            severity: 'medium'
          });
        }
      });
      
      setIssues(newIssues);
    };

    // Run audit periodically in development
    const interval = setInterval(runAudit, 5000);
    runAudit(); // Run immediately
    
    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled || issues.length === 0) return null;

  return (
    <div className={`fixed bottom-4 right-4 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-50'}`}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsVisible(!isVisible)}
      >
        <h3 className="font-semibold text-gray-800 dark:text-white">
          Accessibility Audit ({issues.length} issues)
        </h3>
        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          {isVisible ? '▼' : '▲'}
        </button>
      </div>
      
      {isVisible && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
          {issues.map((issue, index) => (
            <div 
              key={index} 
              className={`p-2 mb-2 rounded ${
                issue.severity === 'high' ? 'bg-red-100 dark:bg-red-900/30' : 
                issue.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 
                'bg-blue-100 dark:bg-blue-900/30'
              }`}
            >
              <div className="flex items-start">
                <span className={`mr-2 mt-1 ${
                  issue.severity === 'high' ? 'text-red-600 dark:text-red-400' : 
                  issue.severity === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 
                  'text-blue-600 dark:text-blue-400'
                }`}>
                  {issue.severity === 'high' ? '🔴' : 
                   issue.severity === 'medium' ? '🟡' : '🔵'}
                </span>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {issue.message}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Element: {issue.element.tagName}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccessibilityAudit;