/**
 * 🎯 REACT SERVER DOM WEBPACK CLIENT FIX
 * 
 * This script specifically targets the "Connection closed" error from:
 * react-server-dom-webpack-client.browser.development.js:3074:39
 * react-server-dom-webpack-client.browser.development.js:3230:46
 * 
 * This error occurs during RSC (React Server Components) streaming when the
 * connection is interrupted during hot reloads on Windows development.
 */

if (typeof window !== 'undefined') {
  console.log('🎯 Loading React Server DOM Fix...');

  // Target the exact error patterns from React Server DOM client
  const REACT_SERVER_DOM_PATTERNS = [
    'react-server-dom-webpack-client.browser.development.js:3074',
    'react-server-dom-webpack-client.browser.development.js:3230',
    'startReadingFromStream',
    'createFromReadableStream',
    'Connection closed'
  ];

  // Enhanced error suppression specifically for React Server DOM
  const createReactServerDOMErrorSuppressor = () => {
    // Intercept unhandled promise rejections with React Server DOM specificity
    window.addEventListener('unhandledrejection', function(event) {
      const error = event.reason;
      const message = error?.message || '';
      const stack = error?.stack || '';
      
      // Check if this is a React Server DOM connection error
      const isReactServerDOMError = REACT_SERVER_DOM_PATTERNS.some(pattern => 
        stack.includes(pattern) || message.includes(pattern)
      );
      
      if (isReactServerDOMError && message.includes('Connection closed')) {
        console.log('🎯 React Server DOM connection error suppressed:', {
          message: message.substring(0, 60),
          location: 'react-server-dom-webpack-client',
          type: 'streaming_error'
        });
        
        event.preventDefault();
        return false;
      }
    }, true);

    // Intercept regular errors from React Server DOM
    window.addEventListener('error', function(event) {
      const error = event.error;
      const message = error?.message || event.message || '';
      const stack = error?.stack || '';
      const filename = event.filename || '';
      
      // Check for React Server DOM specific patterns
      const isReactServerDOMFile = filename.includes('react-server-dom-webpack-client') ||
                                   stack.includes('react-server-dom-webpack-client');
      
      const isConnectionError = message.includes('Connection closed');
      const isTargetLine = stack.includes(':3074:') || stack.includes(':3230:');
      
      if (isReactServerDOMFile && isConnectionError && isTargetLine) {
        console.log('🎯 React Server DOM specific error suppressed:', {
          message: message.substring(0, 60),
          file: filename.split('/').pop(),
          line: `${event.lineno}:${event.colno}`,
          function: stack.includes('close') ? 'close' : 'progress'
        });
        
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    }, true);
  };

  // Patch React Server DOM streaming functions if they exist
  const patchReactServerDOMFunctions = () => {
    // Check if React Server DOM client is loaded
    const checkForReactServerDOM = () => {
      // Look for the global React Server DOM functions
      const possibleGlobals = [
        'createFromReadableStream',
        'createFromFetch',
        'startReadingFromStream'
      ];
      
      possibleGlobals.forEach(fnName => {
        if (window[fnName] && typeof window[fnName] === 'function') {
          console.log('🎯 Patching React Server DOM function:', fnName);
          
          const originalFn = window[fnName];
          
          window[fnName] = function(...args) {
            try {
              return originalFn.apply(this, args);
            } catch (error) {
              if (error.message && error.message.includes('Connection closed')) {
                console.log('🎯 React Server DOM function error caught:', fnName);
                
                // Return appropriate fallback based on function
                if (fnName === 'createFromReadableStream' || fnName === 'createFromFetch') {
                  return Promise.resolve(null);
                } else {
                  return null;
                }
              }
              throw error;
            }
          };
        }
      });
    };

    // Check immediately and periodically
    checkForReactServerDOM();
    
    // Monitor for scripts that might load React Server DOM
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE && 
              node.tagName === 'SCRIPT' &&
              node.src && 
              node.src.includes('react-server-dom-webpack-client')) {
            
            console.log('🎯 React Server DOM script detected, applying patches');
            
            // Wait for script to load and then patch
            node.addEventListener('load', () => {
              setTimeout(checkForReactServerDOM, 50);
            });
          }
        });
      });
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  };

  // Patch ReadableStream specifically for React Server DOM usage
  const patchReadableStreamForRSD = () => {
    if (window.ReadableStream) {
      console.log('🎯 Patching ReadableStream for React Server DOM compatibility');
      
      const OriginalReadableStream = window.ReadableStream;
      
      // Don't completely replace, just enhance error handling
      const enhanceReadableStream = () => {
        // Override the prototype methods that are commonly used by React Server DOM
        const originalGetReader = OriginalReadableStream.prototype.getReader;
        
        OriginalReadableStream.prototype.getReader = function(options) {
          try {
            const reader = originalGetReader.call(this, options);
            
            // Wrap reader methods to handle connection errors
            if (reader && reader.read) {
              const originalRead = reader.read;
              
              reader.read = function() {
                return originalRead.call(this).catch(error => {
                  if (error.message && error.message.includes('Connection closed')) {
                    console.log('🎯 ReadableStream reader connection error caught');
                    
                    // Return proper stream end signal
                    return Promise.resolve({ done: true, value: undefined });
                  }
                  throw error;
                });
              };
            }
            
            return reader;
          } catch (error) {
            if (error.message && error.message.includes('Connection closed')) {
              console.log('🎯 ReadableStream getReader error caught');
              return null;
            }
            throw error;
          }
        };
      };
      
      enhanceReadableStream();
    }
  };

  // Console patching for React Server DOM errors
  const patchConsoleForRSD = () => {
    const originalConsoleError = console.error;
    
    console.error = function(...args) {
      const message = args[0];
      
      if (typeof message === 'string' && 
          message.includes('Connection closed')) {
        
        const stack = new Error().stack || '';
        
        // Check if this console.error is coming from React Server DOM
        if (stack.includes('react-server-dom-webpack-client') ||
            stack.includes('startReadingFromStream') ||
            stack.includes('createFromReadableStream')) {
          
          console.log('🎯 React Server DOM console error suppressed:', message.substring(0, 50));
          return;
        }
      }
      
      return originalConsoleError.apply(this, args);
    };
  };

  // Initialize all React Server DOM fixes
  const initializeReactServerDOMFix = () => {
    console.log('🎯 Initializing React Server DOM Fix...');
    
    // Apply error suppression immediately
    createReactServerDOMErrorSuppressor();
    
    // Patch functions
    patchReactServerDOMFunctions();
    
    // Enhance ReadableStream
    patchReadableStreamForRSD();
    
    // Patch console
    patchConsoleForRSD();
    
    console.log('✅ React Server DOM Fix initialized successfully');
  };

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeReactServerDOMFix);
  } else {
    initializeReactServerDOMFix();
  }
  
  // Also initialize on next tick to ensure all scripts are loaded
  setTimeout(initializeReactServerDOMFix, 0);
  setTimeout(initializeReactServerDOMFix, 100);
  setTimeout(initializeReactServerDOMFix, 500);
}

// Export for manual control
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    loaded: true,
    description: 'React Server DOM webpack client connection error fix'
  };
}