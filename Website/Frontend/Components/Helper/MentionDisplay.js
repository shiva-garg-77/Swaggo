"use client";

import { useRouter } from 'next/navigation';
import { renderMentionsAsReact } from '../../utils/mentionParser';

/**
 * Component to display text with clickable mentions
 * Automatically detects @mentions and makes them clickable
 */
export default function MentionDisplay({ 
  text, 
  theme = 'light',
  className = '',
  onMentionClick = null 
}) {
  const router = useRouter();

  const handleMentionClick = (username) => {
    if (onMentionClick) {
      onMentionClick(username);
    } else {
      // Default behavior: navigate to user profile
      router.push(`/Profile?username=${username}`);
    }
  };

  if (!text) return null;

  const parts = renderMentionsAsReact(text, handleMentionClick);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>;
        } else if (part.type === 'mention') {
          return (
            <span
              key={index}
              onClick={() => part.onClick?.(part.username)}
              className={`font-medium cursor-pointer hover:underline ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}
            >
              {part.display}
            </span>
          );
        }
        return null;
      })}
    </span>
  );
}
