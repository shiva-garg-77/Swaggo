'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InstagramPost from './InstagramPost';

/**
 * Post Modal with Deep Linking (Issue 5.14)
 * Updates URL when modal opens/closes
 */
export default function PostModal({ post, isOpen, onClose, theme }) {
  const router = useRouter();
  
  // Update URL when modal opens (Issue 5.14)
  useEffect(() => {
    if (isOpen && post?.postid) {
      // Add post ID to URL without navigation
      const url = new URL(window.location.href);
      url.searchParams.set('post', post.postid);
      window.history.pushState({}, '', url);
    } else if (!isOpen) {
      // Remove post ID from URL when closing
      const url = new URL(window.location.href);
      url.searchParams.delete('post');
      window.history.pushState({}, '', url);
    }
  }, [isOpen, post?.postid]);
  
  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      if (!url.searchParams.has('post')) {
        onClose();
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onClose]);
  
  if (!isOpen || !post) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="max-w-5xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <InstagramPost post={post} theme={theme} />
      </div>
    </div>
  );
}
