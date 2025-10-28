"use client";
import { useEffect, useState } from 'react';

// Safe import for framer-motion to handle SSR/hydration issues
let motion, AnimatePresence;
try {
  const framer = require('framer-motion');
  motion = framer.motion;
  AnimatePresence = framer.AnimatePresence;
} catch (e) {
  console.warn('Framer-motion failed to load:', e);
  // Fallback components that render nothing
  motion = {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>
  };
  AnimatePresence = ({ children }) => <>{children}</>;
}

// A clean, symmetric splash screen that uses the site's logo and matches the theme
export default function SplashScreen({ show = true, compact = false, onComplete }) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (!show) {
      const t = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 250);
      return () => clearTimeout(t);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  // Check if motion is available
  if (!motion || !AnimatePresence) {
    console.warn('Framer-motion components not available, using fallback');
    return (
      <div className={`fixed inset-0 z-[9999] bg-white dark:bg-gray-950 flex items-center justify-center`}>
        <div className="absolute inset-0" />
        <div className="relative w-full max-w-sm px-8">
          <div className={`mx-auto flex flex-col items-center justify-center ${compact ? 'space-y-4' : 'space-y-8'}`}>
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-center">
                <img
                  src="/logo_light.png"
                  alt="Swaggo"
                  className="w-12 h-12 object-contain dark:hidden"
                />
                <img
                  src="/Logo_dark1.png"
                  alt="Swaggo"
                  className="w-12 h-12 object-contain hidden dark:block"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600"
                />
              ))}
            </div>
            {!compact && (
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Loading...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`fixed inset-0 z-[9999] bg-white dark:bg-gray-950 flex items-center justify-center`}
        >
          <div className="absolute inset-0" />
          <div className="relative w-full max-w-sm px-8">
            <div className={`mx-auto flex flex-col items-center justify-center ${compact ? 'space-y-4' : 'space-y-8'}`}>
              
              {/* Logo Container - Clean & Symmetric */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative"
              >
                <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-center">
                  <img
                    src="/logo_light.png"
                    alt="Swaggo"
                    className="w-12 h-12 object-contain dark:hidden"
                  />
                  <img
                    src="/Logo_dark1.png"
                    alt="Swaggo"
                    className="w-12 h-12 object-contain hidden dark:block"
                  />
                </div>
              </motion.div>

              {/* Loading Dots - Minimal & Clean */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex items-center space-x-2"
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="inline-block w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600"
                    animate={{
                      opacity: [0.3, 1, 0.3],
                      y: [0, -4, 0]
                    }}
                    transition={{ 
                      duration: 1.2, 
                      repeat: Infinity, 
                      delay: i * 0.15,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </motion.div>

              {/* Optional Loading Text */}
              {!compact && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-xs text-gray-500 dark:text-gray-400 font-medium"
                >
                  Loading...
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
