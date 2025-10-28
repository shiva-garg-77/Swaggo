import React, { useEffect, useMemo, useState } from 'react';
import LinkPreviewCard from './LinkPreviewCard';
import { LinkPreviewCache } from '../../../services/LinkPreviewCache';

const urlRegex = /(https?:\/\/[^\s]+)/g;

export default function InlineLinkPreviewBar({ text, onDismiss }) {
  const urls = useMemo(() => {
    if (!text) return [];
    const m = text.match(urlRegex);
    if (!m) return [];
    // unique preserve order
    return Array.from(new Set(m));
  }, [text]);

  const [hidden, setHidden] = useState(new Set());

  useEffect(() => {
    // Prefetch first two
    const firstTwo = urls.slice(0, 2);
    firstTwo.forEach((u) => prefetchPreview(u).catch(() => {}));
  }, [urls]);

  if (urls.length === 0) return null;

  const visible = urls.filter(u => !hidden.has(u));
  if (visible.length === 0) return null;

  return (
    <div className="mt-2 space-y-2" aria-label="Link previews">
      {visible.slice(0, 2).map((u) => (
        <div key={u} className="relative group">
          <LinkPreviewCard url={u} variant="compact" />
          <button
            aria-label="Dismiss preview"
            className="absolute top-1 right-1 p-1 rounded bg-white/80 hover:bg-white shadow hidden group-hover:block"
            onClick={() => {
              const next = new Set(hidden);
              next.add(u);
              setHidden(next);
              onDismiss && onDismiss(u);
            }}
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      ))}
    </div>
  );
}
