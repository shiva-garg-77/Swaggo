import React, { useEffect } from 'react';

export default function KeyboardShortcuts({ onOpenSearch, onFocusComposer }) {
  useEffect(() => {
    const handler = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'k' || e.key === 'f')) {
        e.preventDefault();
        onOpenSearch && onOpenSearch();
      }
      if (mod && e.key === 'j') {
        e.preventDefault();
        onFocusComposer && onFocusComposer();
      }
    };

    const openSearchListener = () => {
      onOpenSearch && onOpenSearch();
    };

    window.addEventListener('keydown', handler);
    window.addEventListener('open-search-panel', openSearchListener);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('open-search-panel', openSearchListener);
    };
  }, [onOpenSearch, onFocusComposer]);

  return null;
}
