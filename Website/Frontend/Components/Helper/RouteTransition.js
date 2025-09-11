"use client";
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Route transition container with smooth animations
export const RouteTransitionContainer = ({ children }) => {
  const pathname = usePathname();
  const [displayLocation, setDisplayLocation] = useState(pathname);
  const [transitionStage, setTransitionStage] = useState('idle');
  
  useEffect(() => {
    if (pathname !== displayLocation) {
      setTransitionStage('exiting');
    }
  }, [pathname, displayLocation]);

  const onExitComplete = () => {
    if (transitionStage === 'exiting') {
      setTransitionStage('entering');
      setDisplayLocation(pathname);
    }
  };

  useEffect(() => {
    if (transitionStage === 'entering') {
      const timer = setTimeout(() => {
        setTransitionStage('idle');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [transitionStage]);

  // Different animation variants based on route type
  const getRouteType = (path) => {
    if (path === '/home') return 'home';
    if (path === '/Profile') return 'profile';  
    if (path === '/reel') return 'reel';
    if (path === '/create') return 'create';
    if (path === '/message') return 'message';
    return 'default';
  };

  const currentRouteType = getRouteType(displayLocation);
  const nextRouteType = getRouteType(pathname);

  // Animation variants for different route types
  const routeVariants = {
    home: {
      initial: { opacity: 0, y: 20, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -10, scale: 1.05 }
    },
    profile: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -50 }
    },
    reel: {
      initial: { opacity: 0, scale: 0.8, rotateY: 90 },
      animate: { opacity: 1, scale: 1, rotateY: 0 },
      exit: { opacity: 0, scale: 1.2, rotateY: -90 }
    },
    create: {
      initial: { opacity: 0, y: 50, rotateX: -20 },
      animate: { opacity: 1, y: 0, rotateX: 0 },
      exit: { opacity: 0, y: -30, rotateX: 20 }
    },
    message: {
      initial: { opacity: 0, x: -100, rotateZ: -5 },
      animate: { opacity: 1, x: 0, rotateZ: 0 },
      exit: { opacity: 0, x: 100, rotateZ: 5 }
    },
    default: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.1 }
    }
  };

  const transition = {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1] // Custom cubic bezier for smooth motion
  };

  return (
    <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
      <motion.div
        key={displayLocation}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={routeVariants[currentRouteType]}
        transition={transition}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%'
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Page transition indicator with route-specific styling
export const RouteTransitionIndicator = ({ variant = 'default' }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const timeoutRef = useRef(null);

  useEffect(() => {
    setIsTransitioning(true);
    setProgress(0);

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 50);

    // Complete the transition
    timeoutRef.current = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsTransitioning(false);
        clearInterval(progressInterval);
      }, 200);
    }, 400);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      clearInterval(progressInterval);
    };
  }, [pathname]);

  if (!isTransitioning) return null;

  const getIndicatorColor = () => {
    if (pathname === '/home') return 'from-blue-500 to-cyan-500';
    if (pathname === '/Profile') return 'from-purple-500 to-pink-500';
    if (pathname === '/reel') return 'from-red-500 to-orange-500';
    if (pathname === '/create') return 'from-green-500 to-emerald-500';
    if (pathname === '/message') return 'from-yellow-500 to-amber-500';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div 
        className={`h-1 bg-gradient-to-r ${getIndicatorColor()} transition-all duration-200 ease-out`}
        style={{ 
          width: `${progress}%`,
          boxShadow: `0 0 10px rgba(59, 130, 246, 0.5)`
        }}
      />
      
      {/* Route transition text indicator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm"
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Loading {pathname === '/home' ? 'Home' : pathname === '/Profile' ? 'Profile' : pathname === '/reel' ? 'Reels' : pathname === '/create' ? 'Create' : pathname === '/message' ? 'Messages' : 'Page'}...</span>
        </div>
      </motion.div>
    </div>
  );
};

// Custom hook for route transition state
export const useRouteTransition = () => {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousPath, setPreviousPath] = useState(pathname);

  useEffect(() => {
    if (pathname !== previousPath) {
      setIsTransitioning(true);
      setPreviousPath(pathname);
      
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [pathname, previousPath]);

  return {
    isTransitioning,
    currentRoute: pathname,
    previousRoute: previousPath
  };
};

export default {
  RouteTransitionContainer,
  RouteTransitionIndicator,
  useRouteTransition
};
