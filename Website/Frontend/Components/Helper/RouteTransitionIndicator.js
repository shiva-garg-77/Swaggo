"use client";
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function RouteTransitionIndicator() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Show transition indicator when route starts changing
    setIsTransitioning(true);
    
    // Hide after a short delay to show the transition is complete
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isTransitioning) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 animate-pulse">
        <div className="h-full bg-gradient-to-r from-blue-600 to-red-600 animate-pulse" 
             style={{ 
               animation: 'progress 0.8s ease-in-out forwards',
               transform: 'translateX(-100%)',
               animationFillMode: 'forwards'
             }} />
      </div>
      <style jsx>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
}
