'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

// Ultra-smooth navigation transitions
const navigationVariants = {
  initial: { 
    opacity: 0, 
    x: 20,
    scale: 0.95,
  },
  in: { 
    opacity: 1, 
    x: 0,
    scale: 1,
  },
  out: { 
    opacity: 0, 
    x: -20,
    scale: 1.05,
  }
};

// Page-specific transitions
const getTransitionVariants = (pathname) => {
  const baseTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.15
  };

  switch (pathname) {
    case '/home':
      return {
        ...navigationVariants,
        initial: { opacity: 0, y: 10 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: -10 },
        transition: { ...baseTransition, duration: 0.1 }
      };
    
    case '/Profile':
      return {
        ...navigationVariants,
        initial: { opacity: 0, scale: 0.98 },
        in: { opacity: 1, scale: 1 },
        out: { opacity: 0, scale: 1.02 },
        transition: { ...baseTransition, duration: 0.12 }
      };
    
    case '/create':
      return {
        ...navigationVariants,
        initial: { opacity: 0, rotateY: -5 },
        in: { opacity: 1, rotateY: 0 },
        out: { opacity: 0, rotateY: 5 },
        transition: { ...baseTransition, duration: 0.13 }
      };
    
    case '/reel':
      return {
        ...navigationVariants,
        initial: { opacity: 0, x: 30, rotateX: 5 },
        in: { opacity: 1, x: 0, rotateX: 0 },
        out: { opacity: 0, x: -30, rotateX: -5 },
        transition: { ...baseTransition, duration: 0.14 }
      };
    
    case '/message':
      return {
        ...navigationVariants,
        initial: { opacity: 0, y: 15 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: -15 },
        transition: { ...baseTransition, duration: 0.11 }
      };
    
    default:
      return {
        ...navigationVariants,
        transition: baseTransition
      };
  }
};

// Ultra-fast page transition wrapper
export const UltraFastPageTransition = ({ children, className = "" }) => {
  const pathname = usePathname();
  const variants = getTransitionVariants(pathname);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={variants}
        transition={variants.transition}
        className={`will-change-transform ${className}`}
        style={{ 
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Navigation loading bar
export const NavigationLoadingBar = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    setProgress(0);

    // Start progress animation
    const startProgress = () => {
      let currentProgress = 0;
      intervalRef.current = setInterval(() => {
        currentProgress += Math.random() * 30;
        if (currentProgress > 90) currentProgress = 90;
        setProgress(currentProgress);
      }, 50);
    };

    startProgress();

    // Complete loading after a short delay
    timeoutRef.current = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 150);
    }, 200);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
      style={{
        background: `linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)`,
        width: `${progress}%`,
        transition: 'width 0.1s ease-out',
        boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
      }}
    />
  );
};

// Micro-interactions for navigation buttons
export const NavigationButton = ({ 
  children, 
  onClick, 
  onHover, 
  isActive = false, 
  className = "",
  disabled = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e) => {
    if (disabled) return;
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    onClick?.(e);
  };

  const handleMouseEnter = (e) => {
    if (disabled) return;
    setIsHovered(true);
    onHover?.(e);
  };

  return (
    <motion.button
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      animate={{
        scale: isPressed ? 0.95 : 1,
        rotateZ: isPressed ? 0.5 : 0,
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        mass: 0.8
      }}
      disabled={disabled}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-100 rounded-xl"
          initial={false}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35
          }}
        />
      )}

      {/* Hover effect */}
      <AnimatePresence>
        {isHovered && !isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-white bg-opacity-10 rounded-xl"
          />
        )}
      </AnimatePresence>

      {/* Ripple effect */}
      <AnimatePresence>
        {isPressed && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 bg-white bg-opacity-20 rounded-full"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '10px',
              height: '10px',
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        {children}
      </div>
    </motion.button>
  );
};

// Route change indicator
export const RouteChangeIndicator = () => {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 1000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname]);

  const getRouteIcon = (path) => {
    switch (path) {
      case '/home': return '🏠';
      case '/Profile': return '👤';
      case '/create': return '➕';
      case '/reel': return '🎬';
      case '/message': return '💬';
      case '/dashboard': return '📊';
      default: return '⚡';
    }
  };

  const getRouteName = (path) => {
    switch (path) {
      case '/home': return 'Home';
      case '/Profile': return 'Profile';
      case '/create': return 'Create';
      case '/reel': return 'Moments';
      case '/message': return 'Messages';
      case '/dashboard': return 'Dashboard';
      default: return 'Page';
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        duration: 0.3
      }}
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9998] bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm border border-gray-600"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="text-lg"
        >
          {getRouteIcon(pathname)}
        </motion.div>
        <span className="text-sm font-medium">{getRouteName(pathname)}</span>
      </div>
    </motion.div>
  );
};

// Smooth scroll to top on route change
export const SmoothScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Smooth scroll to top on route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [pathname]);

  return null;
};

export default {
  UltraFastPageTransition,
  NavigationLoadingBar,
  NavigationButton,
  RouteChangeIndicator,
  SmoothScrollToTop,
};
