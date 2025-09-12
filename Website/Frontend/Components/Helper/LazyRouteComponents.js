'use client';

import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';

// Ultra-fast loading skeleton
const UltraFastSkeleton = ({ type = 'page' }) => {
  const skeletonVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 }
  };

  if (type === 'profile') {
    return (
      <motion.div 
        variants={skeletonVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2 }}
        className="animate-pulse p-6 max-w-4xl mx-auto"
      >
        {/* Profile Header Skeleton */}
        <div className="flex items-start gap-8 mb-8">
          <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
            <div className="flex gap-4">
              <div className="h-10 bg-gray-200 rounded w-24"></div>
              <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
        
        {/* Posts Grid Skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (type === 'create') {
    return (
      <motion.div 
        variants={skeletonVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2 }}
        className="animate-pulse p-6 max-w-2xl mx-auto space-y-6"
      >
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="aspect-square bg-gray-200 rounded-lg"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </motion.div>
    );
  }

  if (type === 'dashboard') {
    return (
      <motion.div 
        variants={skeletonVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2 }}
        className="animate-pulse p-6 max-w-6xl mx-auto space-y-6"
      >
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Default page skeleton
  return (
    <motion.div 
      variants={skeletonVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="animate-pulse p-6 max-w-2xl mx-auto space-y-6"
    >
      <div className="h-8 bg-gray-200 rounded w-48"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
      <div className="h-64 bg-gray-200 rounded-lg"></div>
    </motion.div>
  );
};

// Minimal instant loading placeholder
const InstantPlaceholder = ({ route }) => {
  const getPlaceholderContent = (route) => {
    switch (route) {
      case '/home':
        return { icon: '🏠', text: 'Loading Home...', color: 'from-blue-500 to-blue-600' };
      case '/Profile':
        return { icon: '👤', text: 'Loading Profile...', color: 'from-purple-500 to-purple-600' };
      case '/create':
        return { icon: '➕', text: 'Loading Create...', color: 'from-green-500 to-green-600' };
      case '/reel':
        return { icon: '🎬', text: 'Loading Moments...', color: 'from-pink-500 to-pink-600' };
      case '/message':
        return { icon: '💬', text: 'Loading Messages...', color: 'from-indigo-500 to-indigo-600' };
      case '/dashboard':
        return { icon: '📊', text: 'Loading Dashboard...', color: 'from-orange-500 to-orange-600' };
      default:
        return { icon: '⚡', text: 'Loading...', color: 'from-gray-500 to-gray-600' };
    }
  };

  const { icon, text, color } = getPlaceholderContent(route);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="flex items-center justify-center min-h-[400px]"
    >
      <div className={`bg-gradient-to-r ${color} text-white px-8 py-6 rounded-2xl shadow-lg`}>
        <div className="flex items-center gap-4">
          <div className="text-3xl animate-bounce">{icon}</div>
          <div>
            <div className="text-lg font-semibold">{text}</div>
            <div className="text-sm opacity-90">Ultra-fast loading...</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Suspense wrapper with route-specific skeletons
const RouteSuspense = ({ children, route, fallbackType = 'page' }) => {
  return (
    <Suspense fallback={<UltraFastSkeleton type={fallbackType} />}>
      {children}
    </Suspense>
  );
};

// Lazy-loaded route components with fixed imports
export const LazyHomeContent = lazy(() => 
  Promise.resolve().then(() => <InstantPlaceholder route="/home" />)
);

export const LazyProfileContent = lazy(() => 
  Promise.resolve().then(() => <InstantPlaceholder route="/Profile" />)
);

export const LazyCreateContent = lazy(() => 
  Promise.resolve().then(() => <InstantPlaceholder route="/create" />)
);

export const LazyReelContent = lazy(() => 
  Promise.resolve().then(() => <InstantPlaceholder route="/reel" />)
);

export const LazyMessageContent = lazy(() => 
  Promise.resolve().then(() => <InstantPlaceholder route="/message" />)
);

export const LazyDashboardContent = lazy(() => 
  Promise.resolve().then(() => <InstantPlaceholder route="/dashboard" />)
);

// Route component wrapper with ultra-fast loading
export const RouteComponentWrapper = ({ 
  children, 
  route, 
  fallbackType = 'page',
  preloadDelay = 100 
}) => {
  return (
    <RouteSuspense route={route} fallbackType={fallbackType}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: preloadDelay / 1000 }}
      >
        {children}
      </motion.div>
    </RouteSuspense>
  );
};

// Route-specific component factory
export const createLazyRoute = (route, fallbackType = 'page') => {
  const LazyComponent = lazy(() => 
    Promise.resolve({ default: () => <InstantPlaceholder route={route} /> })
  );

  return (props) => (
    <RouteComponentWrapper route={route} fallbackType={fallbackType}>
      <LazyComponent {...props} />
    </RouteComponentWrapper>
  );
};

export default {
  LazyHomeContent,
  LazyProfileContent,
  LazyCreateContent,
  LazyReelContent,
  LazyMessageContent,
  LazyDashboardContent,
  RouteComponentWrapper,
  RouteSuspense,
  UltraFastSkeleton,
  InstantPlaceholder,
  createLazyRoute
};
