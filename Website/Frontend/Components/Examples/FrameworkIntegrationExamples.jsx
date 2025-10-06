/**
 * @fileoverview Comprehensive Framework Integration Examples
 * @module FrameworkIntegrationExamples
 * @version 2.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * Comprehensive examples demonstrating how to integrate all frameworks together:
 * - Performance Optimization Framework
 * - Accessibility Framework
 * - Socket Provider optimizations
 * - Performance Monitoring Dashboard
 * - Real-world usage patterns and best practices
 * 
 * @example
 * ```jsx
 * // Basic integration example
 * <AccessibilityProvider>
 *   <PerformanceProvider>
 *     <SocketProvider>
 *       <OptimizedChatComponent />
 *     </SocketProvider>
 *   </PerformanceProvider>
 * </AccessibilityProvider>
 * ```
 * 
 * @requires react
 * @requires ../Performance/AdvancedPerformanceOptimizer
 * @requires ../Accessibility/AccessibilityFramework
 * @requires ../Helper/SocketProvider
 * @requires ../Performance/PerformanceMonitoringDashboard
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, memo, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Framework imports
import { 
  usePerformanceMonitoring, 
  withPerformanceOptimization, 
  PerformanceProvider,
  useOptimizedCallback,
  useOptimizedMemo
} from '../Performance/AdvancedPerformanceOptimizer';

import { 
  AccessibilityProvider,
  useAccessibility,
  AccessibleButton,
  useFocusManagement,
  useKeyboardShortcuts,
  SkipNavigation
} from '../Accessibility/AccessibilityFramework';

import { useSocket } from '../Helper/SocketProvider';
import { usePerformanceMonitoring as useDashboardPerformanceMonitoring } from '../Performance/PerformanceMonitoringDashboard';

/**
 * @component BasicIntegrationExample
 * @description Simple example showing basic framework integration
 */
export const BasicIntegrationExample = memo(() => {
  const { startRender, endRender, metrics } = usePerformanceMonitoring();
  const { announceToScreenReader } = useAccessibility();
  const { isConnected } = useSocket();

  const handleClick = useOptimizedCallback(() => {
    announceToScreenReader('Button clicked!');
    startRender();
    // Simulate some work
    setTimeout(() => endRender('BasicExample'), 10);
  }, [], { throttle: 500 });

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Basic Integration Example</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <AccessibleButton
            onClick={handleClick}
            ariaLabel="Example action button"
            variant="primary"
          >
            Click Me
          </AccessibleButton>
          
          <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500">
            Render time: {metrics.renderTime?.toFixed(2)}ms | 
            Memory: {metrics.memoryUsage?.toFixed(2)}MB
          </div>
        )}
      </div>
    </div>
  );
});

BasicIntegrationExample.displayName = 'BasicIntegrationExample';

/**
 * @component OptimizedChatExample
 * @description Advanced chat component with all frameworks integrated
 */
const OptimizedChatExample = memo(({ chatId, userId }) => {
  // Framework hooks
  const { startRender: startTracking, endRender: endTracking, metrics } = usePerformanceMonitoring();
  const { announceToScreenReader, addKeyboardShortcut } = useAccessibility();
  const { socket, isConnected, sendMessage } = useSocket();
  const { recordMetric, trackNavigation } = useDashboardPerformanceMonitoring();
  const { trapRef, trapFocus, releaseFocus } = useFocusManagement();

  // Component state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  // Optimized computed values
  const sortedMessages = useOptimizedMemo(() => {
    return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [messages], { threshold: 1, trackPerformance: true, componentName: 'OptimizedChat' });

  const unreadCount = useMemo(() => {
    return messages.filter(msg => !msg.isRead && msg.senderId !== userId).length;
  }, [messages, userId]);

  // Performance tracked handlers
  const handleSendMessage = useOptimizedCallback(() => {
    const startTime = performance.now();
    
    recordMetric('message_send_start', {
      chatId,
      messageLength: inputText.length,
      timestamp: Date.now()
    });

    if (inputText.trim()) {
      sendMessage({
        chatid: chatId,
        content: inputText.trim(),
        messageType: 'text'
      });

      setInputText('');
      announceToScreenReader('Message sent');
      
      recordMetric('message_send_complete', {
        duration: performance.now() - startTime
      });
    }
  }, [inputText, chatId, sendMessage, announceToScreenReader, recordMetric], { throttle: 100 });

  const handleTogglePanel = useOptimizedCallback(() => {
    setShowPanel(prev => {
      const newState = !prev;
      if (newState) {
        trapFocus();
        announceToScreenReader('Panel opened');
      } else {
        releaseFocus();
        announceToScreenReader('Panel closed');
      }
      return newState;
    });
  }, [trapFocus, releaseFocus, announceToScreenReader], { debounce: 200 });

  // Keyboard shortcuts
  useEffect(() => {
    const shortcuts = [
      {
        key: 'Enter',
        handler: handleSendMessage,
        description: 'Send message'
      },
      {
        key: 'Escape',
        handler: () => {
          setShowPanel(false);
          releaseFocus();
        },
        description: 'Close panel'
      }
    ];

    shortcuts.forEach(shortcut => addKeyboardShortcut(shortcut));
  }, [handleSendMessage, releaseFocus, addKeyboardShortcut]);

  // Socket event handlers with performance tracking
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (data) => {
      const timer = performance.now();
      
      setMessages(prev => [...prev, {
        id: data.id,
        content: data.content,
        senderId: data.senderId,
        timestamp: new Date(),
        isRead: false
      }]);

      if (data.senderId !== userId) {
        announceToScreenReader(`New message: ${data.content}`, 'assertive');
      }

      recordMetric('message_received', {
        processingTime: performance.now() - timer,
        messageLength: data.content?.length || 0
      });
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, isConnected, userId, announceToScreenReader, recordMetric]);

  // Performance tracking for renders
  useEffect(() => {
    startRender();
    return () => endRender('OptimizedChat');
  }, [startRender, endRender]);

  return (
    <div 
      ref={trapRef}
      className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      role="region"
      aria-label="Chat interface"
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Optimized Chat</h3>
          
          <div className="flex items-center space-x-4">
            {unreadCount > 0 && (
              <span 
                className="bg-red-500 text-white px-2 py-1 rounded-full text-xs"
                aria-label={`${unreadCount} unread messages`}
              >
                {unreadCount}
              </span>
            )}
            
            <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm sr-only">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="h-64 overflow-y-auto p-4 space-y-2"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        <AnimatePresence>
          {sortedMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-2 rounded-lg max-w-xs ${
                message.senderId === userId
                  ? 'bg-blue-500 text-white ml-auto'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <div className="text-sm">{message.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Message input"
          />
          
          <AccessibleButton
            onClick={handleSendMessage}
            disabled={!inputText.trim() || !isConnected}
            ariaLabel="Send message"
            variant="primary"
            keyboardShortcut="Enter"
          >
            Send
          </AccessibleButton>
          
          <AccessibleButton
            onClick={handleTogglePanel}
            ariaLabel={showPanel ? 'Close panel' : 'Open panel'}
            variant="secondary"
          >
            ⚙️
          </AccessibleButton>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 dark:border-gray-700 p-4"
            role="dialog"
            aria-label="Chat settings"
          >
            <div className="space-y-2">
              <h4 className="font-medium">Settings</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Typing indicator: {isTyping ? 'Active' : 'Inactive'}
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500">
                  <div>Render: {metrics.renderTime?.toFixed(2)}ms</div>
                  <div>Memory: {metrics.memoryUsage?.toFixed(2)}MB</div>
                  <div>Messages: {sortedMessages.length}</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

OptimizedChatExample.displayName = 'OptimizedChatExample';

/**
 * @component FrameworkShowcase
 * @description Complete showcase of all framework integrations
 */
export const FrameworkShowcase = () => {
  const [activeExample, setActiveExample] = useState('basic');
  const { registerShortcut } = useKeyboardShortcuts();

  // Register global shortcuts
  useEffect(() => {
    registerShortcut({
      key: 'Alt+1',
      action: () => setActiveExample('basic'),
      description: 'Switch to basic example'
    });

    registerShortcut({
      key: 'Alt+2', 
      action: () => setActiveExample('chat'),
      description: 'Switch to chat example'
    });
  }, [registerShortcut]);

  const examples = [
    { id: 'basic', label: 'Basic Integration', component: BasicIntegrationExample },
    { id: 'chat', label: 'Optimized Chat', component: OptimizedChatExample }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <SkipNavigation />
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Framework Integration Examples</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive examples showing how to integrate Performance Optimization, 
          Accessibility, Socket connections, and Monitoring frameworks.
        </p>
      </header>

      <nav className="mb-6" role="tablist" aria-label="Example navigation">
        <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
          {examples.map(example => (
            <AccessibleButton
              key={example.id}
              onClick={() => setActiveExample(example.id)}
              variant={activeExample === example.id ? 'primary' : 'secondary'}
              role="tab"
              aria-selected={activeExample === example.id}
              ariaLabel={`Switch to ${example.label} example`}
            >
              {example.label}
            </AccessibleButton>
          ))}
        </div>
      </nav>

      <main id="main-content" role="main">
        <AnimatePresence mode="wait">
          {examples.map(example => {
            if (example.id !== activeExample) return null;
            
            const Component = example.component;
            
            return (
              <motion.div
                key={example.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                role="tabpanel"
                aria-labelledby={`tab-${example.id}`}
              >
                <Component chatId="demo-chat" userId="demo-user" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

      <aside className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h3 className="font-semibold mb-2">Keyboard Shortcuts</h3>
        <ul className="text-sm space-y-1">
          <li><kbd>Alt + 1</kbd> - Basic Integration Example</li>
          <li><kbd>Alt + 2</kbd> - Optimized Chat Example</li>
          <li><kbd>Enter</kbd> - Send message (in chat)</li>
          <li><kbd>Escape</kbd> - Close panels</li>
          <li><kbd>Tab</kbd> - Navigate between elements</li>
        </ul>
      </aside>
    </div>
  );
};

/**
 * @component FrameworkProviderWrapper
 * @description Complete provider wrapper with all frameworks
 */
export const FrameworkProviderWrapper = ({ children }) => {
  return (
    <PerformanceProvider
      config={{
        enableMonitoring: process.env.NODE_ENV === 'development',
        autoOptimize: true,
        thresholds: {
          renderTime: 16, // 60fps
          memoryUsage: 100, // 100MB
          renderCount: 1000
        }
      }}
    >
      <AccessibilityProvider
        enableAnnouncements={true}
        enableKeyboardShortcuts={true}
        enableColorContrastCheck={process.env.NODE_ENV === 'development'}
      >
        {children}
      </AccessibilityProvider>
    </PerformanceProvider>
  );
};

/**
 * @function createOptimizedComponent
 * @description Helper function to create optimized components with all frameworks
 */
export const createOptimizedComponent = (Component, options = {}) => {
  const {
    memoize = true,
    monitoring = true,
    accessibility = true,
    displayName
  } = options;

  let OptimizedComponent = Component;

  // Apply performance optimization
  if (memoize) {
    OptimizedComponent = withPerformanceOptimization(OptimizedComponent, {
      memoize: true,
      monitoring,
      displayName
    });
  }

  // Add accessibility wrapper if needed
  if (accessibility) {
    OptimizedComponent = forwardRef((props, ref) => (
      <div ref={ref} role="region">
        <OptimizedComponent {...props} />
      </div>
    ));
    OptimizedComponent.displayName = `Accessible${displayName || Component.displayName || Component.name}`;
  }

  return OptimizedComponent;
};

/**
 * @constant INTEGRATION_BEST_PRACTICES
 * @description Best practices for framework integration
 */
export const INTEGRATION_BEST_PRACTICES = {
  performance: [
    "Use usePerformanceMonitoring for component monitoring",
    "Apply memoization strategically with useOptimizedMemo",
    "Throttle/debounce expensive operations with useOptimizedCallback",
    "Monitor render times and memory usage in development"
  ],
  
  accessibility: [
    "Always provide ARIA labels and descriptions",
    "Implement keyboard shortcuts for power users",
    "Announce important state changes to screen readers",
    "Use semantic HTML and proper focus management"
  ],
  
  sockets: [
    "Handle connection states gracefully",
    "Implement message queuing for offline scenarios",
    "Use connection status indicators",
    "Clean up socket listeners properly"
  ],
  
  integration: [
    "Wrap apps with FrameworkProviderWrapper",
    "Use createOptimizedComponent for new components",
    "Follow the provider hierarchy: Performance → Accessibility → Socket",
    "Test with both keyboard and screen reader navigation"
  ]
};

export default {
  FrameworkShowcase,
  FrameworkProviderWrapper,
  createOptimizedComponent,
  INTEGRATION_BEST_PRACTICES,
  BasicIntegrationExample,
  OptimizedChatExample
};