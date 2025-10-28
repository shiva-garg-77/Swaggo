'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTransition } from 'react';
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';

/**
 * Optimized Link component for instant, smooth navigation
 * - Eager prefetching on hover/focus
 * - Optimistic UI updates
 * - Smooth transitions
 * - Conditional prefetching based on authentication status
 */
export default function OptimizedLink({ 
  href, 
  children, 
  className = '',
  prefetch = true,
  ...props 
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { isAuthenticated, isLoading } = useFixedSecureAuth();

  // List of routes that should always be prefetched (unauthenticated routes)
  const unauthenticatedRoutes = [
    '/signup',
    '/login',
    '/forget-password',
    '/reset-password',
    '/reset-password/[token]' // Dynamic route pattern
  ];

  // Check if a route is an unauthenticated route
  const isUnauthenticatedRoute = (route) => {
    return unauthenticatedRoutes.some(unauthRoute => 
      route === unauthRoute || 
      (unauthRoute.includes('[token]') && route.startsWith('/reset-password/'))
    );
  };

  // Determine if we should prefetch based on authentication status
  const shouldPrefetch = () => {
    // Don't prefetch if prefetch is explicitly disabled
    if (!prefetch || !href) return false;
    
    // Always prefetch unauthenticated routes
    if (isUnauthenticatedRoute(href)) return true;
    
    // If still loading auth status, don't prefetch authenticated routes
    if (isLoading) return false;
    
    // Only prefetch authenticated routes if user is authenticated
    return isAuthenticated;
  };

  const handleClick = (e) => {
    // Let default Link behavior handle it with prefetch
    // This ensures the page is ready before navigation
  };

  const handleMouseEnter = () => {
    // Eagerly prefetch only if conditions are met
    if (shouldPrefetch()) {
      router.prefetch(href);
    }
  };

  const handleFocus = () => {
    // Also prefetch on focus (keyboard navigation) only if conditions are met
    if (shouldPrefetch()) {
      router.prefetch(href);
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      className={className}
      prefetch={false} // Disable Next.js built-in prefetching, we handle it manually
      {...props}
    >
      {children}
    </Link>
  );
}