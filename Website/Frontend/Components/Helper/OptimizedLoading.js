"use client";
import { useState, useEffect } from 'react';

// Ultra-fast skeleton loader components for instant perceived performance
export const FastSkeleton = ({ className = "", variant = "text", width, height }) => {
  const variants = {
    text: "h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse",
    circle: "rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse",
    rectangle: "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse",
    card: "h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse",
  };

  const style = {
    width: width || (variant === 'circle' ? '40px' : '100%'),
    height: height || (variant === 'circle' ? '40px' : undefined),
  };

  return (
    <div 
      className={`${variants[variant]} ${className}`}
      style={style}
    />
  );
};

// Super-fast home page skeleton
export const HomeLoadingSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Stories skeleton */}
    <div className="flex space-x-4 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col items-center space-y-2">
          <FastSkeleton variant="circle" width="60px" height="60px" />
          <FastSkeleton width="50px" className="h-3" />
        </div>
      ))}
    </div>

    {/* Posts skeleton */}
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        {/* Post header */}
        <div className="flex items-center space-x-3">
          <FastSkeleton variant="circle" width="40px" height="40px" />
          <div className="flex-1 space-y-2">
            <FastSkeleton width="120px" className="h-4" />
            <FastSkeleton width="80px" className="h-3" />
          </div>
        </div>
        
        {/* Post content */}
        <div className="space-y-2">
          <FastSkeleton className="h-4" />
          <FastSkeleton width="70%" className="h-4" />
        </div>
        
        {/* Post image */}
        <FastSkeleton variant="rectangle" className="h-64" />
        
        {/* Post actions */}
        <div className="flex items-center space-x-6">
          {[...Array(4)].map((_, j) => (
            <FastSkeleton key={j} width="60px" className="h-8 rounded-full" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Super-fast profile page skeleton
export const ProfileLoadingSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Profile header */}
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <div className="flex items-start space-x-6">
        <FastSkeleton variant="circle" width="120px" height="120px" />
        <div className="flex-1 space-y-4">
          <FastSkeleton width="200px" className="h-6" />
          <FastSkeleton width="150px" className="h-4" />
          <div className="space-y-2">
            <FastSkeleton className="h-4" />
            <FastSkeleton width="80%" className="h-4" />
          </div>
          <div className="flex space-x-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center">
                <FastSkeleton width="60px" className="h-6" />
                <FastSkeleton width="40px" className="h-4 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Posts grid */}
    <div className="grid grid-cols-3 gap-1">
      {[...Array(9)].map((_, i) => (
        <FastSkeleton key={i} variant="rectangle" className="aspect-square" />
      ))}
    </div>
  </div>
);

// Super-fast reels page skeleton
export const ReelsLoadingSkeleton = () => (
  <div className="space-y-4 animate-fade-in">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-black rounded-lg overflow-hidden relative">
        <FastSkeleton variant="rectangle" className="h-96 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <FastSkeleton width="200px" className="h-4 bg-gray-600" />
          <FastSkeleton width="150px" className="h-3 bg-gray-700" />
        </div>
        <div className="absolute top-4 right-4 space-y-3">
          {[...Array(4)].map((_, j) => (
            <FastSkeleton key={j} variant="circle" width="40px" height="40px" className="bg-gray-600" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Super-fast messages skeleton
export const MessagesLoadingSkeleton = () => (
  <div className="flex h-full animate-fade-in">
    {/* Conversations list */}
    <div className="w-80 border-r bg-gray-50 p-4 space-y-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 rounded-lg">
          <FastSkeleton variant="circle" width="50px" height="50px" />
          <div className="flex-1 space-y-2">
            <FastSkeleton width="120px" className="h-4" />
            <FastSkeleton width="80px" className="h-3" />
          </div>
          <FastSkeleton width="30px" className="h-3" />
        </div>
      ))}
    </div>
    
    {/* Message area */}
    <div className="flex-1 bg-white p-4 space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className={`max-w-xs p-3 rounded-lg ${i % 2 === 0 ? 'bg-gray-100' : 'bg-blue-500'} space-y-2`}>
            <FastSkeleton width="150px" className={`h-4 ${i % 2 === 0 ? 'bg-gray-300' : 'bg-blue-300'}`} />
            <FastSkeleton width="80px" className={`h-3 ${i % 2 === 0 ? 'bg-gray-300' : 'bg-blue-300'}`} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Super-fast create page skeleton
export const CreateLoadingSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 animate-fade-in">
    {/* Upload area */}
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
      <div className="text-center space-y-4">
        <FastSkeleton variant="circle" width="80px" height="80px" className="mx-auto" />
        <FastSkeleton width="200px" className="h-5 mx-auto" />
        <FastSkeleton width="300px" className="h-4 mx-auto" />
      </div>
    </div>
    
    {/* Form fields */}
    <div className="space-y-4">
      <FastSkeleton width="100px" className="h-5" />
      <FastSkeleton variant="rectangle" className="h-10" />
      
      <FastSkeleton width="100px" className="h-5" />
      <FastSkeleton variant="rectangle" className="h-32" />
      
      <div className="flex space-x-4">
        <FastSkeleton width="100px" className="h-10 rounded-full" />
        <FastSkeleton width="80px" className="h-10 rounded-full" />
      </div>
    </div>
  </div>
);

// Smart loading component that shows route-specific skeletons
export const SmartRouteLoading = ({ route }) => {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    // Show skeleton after 100ms to avoid flash for instant navigations
    const timer = setTimeout(() => setShowSkeleton(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!showSkeleton) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const skeletonMap = {
    '/home': <HomeLoadingSkeleton />,
    '/Profile': <ProfileLoadingSkeleton />,
    '/reel': <ReelsLoadingSkeleton />,
    '/message': <MessagesLoadingSkeleton />,
    '/create': <CreateLoadingSkeleton />,
  };

  return (
    <div className="animate-fade-in">
      {skeletonMap[route] || (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6">
              <FastSkeleton className="h-6 mb-4" />
              <FastSkeleton className="h-4 mb-2" />
              <FastSkeleton width="70%" className="h-4" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Instant loading indicator for super-fast transitions
export const InstantLoadingIndicator = ({ show, route }) => {
  if (!show) return null;

  const routeEmojis = {
    '/home': '🏠',
    '/Profile': '👤',
    '/reel': '🎬',
    '/create': '➕',
    '/message': '💬',
    '/dashboard': '📊',
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 animate-fade-in">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">
          {routeEmojis[route] || '🚀'}
        </div>
        <div className="text-xl font-semibold text-gray-700">
          Loading...
        </div>
        <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto mt-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 animate-loading-bar"></div>
        </div>
      </div>
    </div>
  );
};

// Floating performance indicator
export const PerformanceIndicator = ({ enabled = false }) => {
  const [metrics, setMetrics] = useState({ navigation: 0, cache: 0 });
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const updateMetrics = () => {
      // Get performance metrics (you would integrate this with your actual performance monitoring)
      setMetrics({
        navigation: Math.round(performance.now() % 1000),
        cache: Math.round(Math.random() * 100),
      });
    };

    const interval = setInterval(updateMetrics, 2000);
    setShow(true);

    return () => {
      clearInterval(interval);
      setShow(false);
    };
  }, [enabled]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white text-xs px-3 py-2 rounded-full font-mono z-40">
      <div className="flex items-center space-x-2">
        <span className="text-green-400">⚡</span>
        <span>Nav: {metrics.navigation}ms</span>
        <span className="text-blue-400">📦</span>
        <span>Cache: {metrics.cache}%</span>
      </div>
    </div>
  );
};

// CSS for animations (add to your global CSS)
export const loadingAnimationCSS = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes loading-bar {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
  
  .animate-loading-bar {
    animation: loading-bar 1.5s ease-in-out infinite;
  }
`;

export default {
  FastSkeleton,
  HomeLoadingSkeleton,
  ProfileLoadingSkeleton,
  ReelsLoadingSkeleton,
  MessagesLoadingSkeleton,
  CreateLoadingSkeleton,
  SmartRouteLoading,
  InstantLoadingIndicator,
  PerformanceIndicator,
  loadingAnimationCSS,
};
