/**
 * AUTO-EXPANDING TEXTAREA COMPONENT
 * Solves: 5.5 - Comment Input Auto-Expanding
 */

'use client';

import React, { useRef, useEffect } from 'react';

export default function AutoExpandTextarea({
  value,
  onChange,
  placeholder = 'Write a comment...',
  maxHeight = 200,
  minHeight = 40,
  className = '',
  onSubmit,
  ...props
}) {
  const textareaRef = useRef(null);
  
  // Auto-expand textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to get accurate scrollHeight
    textarea.style.height = `${minHeight}px`;
    
    // Calculate new height
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
    
    // Add scroll if content exceeds maxHeight
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value, maxHeight, minHeight]);
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };
  
  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`resize-none transition-all duration-200 ${className}`}
      style={{
        minHeight: `${minHeight}px`,
        maxHeight: `${maxHeight}px`
      }}
      {...props}
    />
  );
}
