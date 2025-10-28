'use client';

import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';

// Chat Panel Loading Skeleton
const ChatPanelSkeleton = ({ type = 'emoji' }) => {
  const skeletonVariants = {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto' },
    exit: { opacity: 0, height: 0 }
  };

  const getSkeletonContent = () => {
    switch (type) {
      case 'emoji':
        return (
          <div className="space-y-3">
            {/* Category buttons skeleton */}
            <div className="flex space-x-2">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            {/* Emoji grid skeleton */}
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        );
      
      case 'gif':
        return (
          <div className="space-y-3">
            {/* Search bar skeleton */}
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
            {/* Category buttons skeleton */}
            <div className="flex space-x-2">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
              ))}
            </div>
            {/* GIF grid skeleton */}
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        );
      
      case 'sticker':
        return (
          <div className="space-y-3">
            {/* Category buttons skeleton */}
            <div className="flex space-x-2">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
              ))}
            </div>
            {/* Sticker grid skeleton */}
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        );
    }
  };

  return (
    <motion.div
      variants={skeletonVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    >
      {getSkeletonContent()}
    </motion.div>
  );
};

// Enhanced Suspense wrapper for chat panels
const ChatPanelSuspense = ({ children, type, theme }) => {
  return (
    <Suspense 
      fallback={
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3"
        >
          <ChatPanelSkeleton type={type} theme={theme} />
        </motion.div>
      }
    >
      {children}
    </Suspense>
  );
};

// Lazy-loaded chat panel components
export const LazyEmojiPicker = lazy(() => 
  import('./EmojiPicker.jsx').then(module => ({ 
    default: module.default 
  }))
);

export const LazyGifPanel = lazy(() => 
  import('./GifPanel.jsx').then(module => ({ 
    default: module.default 
  }))
);

export const LazyStickerPanel = lazy(() => 
  import('./StickerPanel.jsx').then(module => ({ 
    default: module.default 
  }))
);

// Chat panel wrapper with lazy loading
export const ChatPanelWrapper = ({ 
  children, 
  type, 
  theme,
  show,
  className = '' 
}) => {
  if (!show) return null;

  return (
    <ChatPanelSuspense type={type} theme={theme}>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={`mt-3 ${className}`}
      >
        {children}
      </motion.div>
    </ChatPanelSuspense>
  );
};

// Factory for creating lazy chat panels
export const createLazyChatPanel = (type) => {
  let LazyComponent;
  
  switch (type) {
    case 'emoji':
      LazyComponent = LazyEmojiPicker;
      break;
    case 'gif':
      LazyComponent = LazyGifPanel;
      break;
    case 'sticker':
      LazyComponent = LazyStickerPanel;
      break;
    default:
      throw new Error(`Unknown chat panel type: ${type}`);
  }

  return (props) => (
    <ChatPanelWrapper type={type} theme={props.theme} show={props.show}>
      <LazyComponent {...props} />
    </ChatPanelWrapper>
  );
};

// Pre-configured lazy panel components
export const LazyEmojiPanel = createLazyChatPanel('emoji');
export const LazyGifPanelComponent = createLazyChatPanel('gif');
export const LazyStickerPanelComponent = createLazyChatPanel('sticker');

export default {
  LazyEmojiPicker,
  LazyGifPanel,
  LazyStickerPanel,
  ChatPanelWrapper,
  ChatPanelSkeleton,
  LazyEmojiPanel,
  LazyGifPanelComponent,
  LazyStickerPanelComponent
};