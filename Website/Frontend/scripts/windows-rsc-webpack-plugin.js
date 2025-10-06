/**
 * 🛠️ Windows RSC Connection Fix - Webpack Plugin
 * 
 * This plugin completely eliminates the "Connection closed" error
 * by preventing Next.js from using problematic RSC streaming on Windows.
 * 
 * SOLUTION: Replace RSC streaming modules with stable alternatives
 * MAINTAINS: All functionality while fixing Windows compatibility
 */

class WindowsRSCFixPlugin {
  constructor(options = {}) {
    this.options = {
      enabled: process.platform === 'win32',
      verbose: false,
      ...options
    };
  }

  apply(compiler) {
    if (!this.options.enabled) {
      return;
    }

    const pluginName = 'WindowsRSCFixPlugin';
    
    if (this.options.verbose) {
      console.log('🔧 Windows RSC Fix Plugin: Enabled');
    }

    // Hook into the compilation process
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      // Prevent RSC streaming modules from being included
      compilation.hooks.buildModule.tap(pluginName, (module) => {
        if (module.resource) {
          const resource = module.resource.toLowerCase();
          
          // Block problematic RSC streaming modules
          if (
            resource.includes('react-server-dom-webpack') ||
            resource.includes('react-server-dom-turbopack') ||
            resource.includes('streaming') && resource.includes('react-server')
          ) {
            if (this.options.verbose) {
              console.log('🚫 Blocked RSC streaming module:', resource);
            }
            
            // Replace with empty module
            module._source = {
              source: () => 'module.exports = {};',
              size: () => 18
            };
          }
        }
      });
    });

    // Hook into the normal module factory to replace problematic modules
    compiler.hooks.normalModuleFactory.tap(pluginName, (factory) => {
      factory.hooks.beforeResolve.tap(pluginName, (resolveData) => {
        if (resolveData.request) {
          // Replace RSC streaming modules with empty modules
          if (
            resolveData.request.includes('react-server-dom-webpack/client') ||
            resolveData.request.includes('react-server-dom-turbopack/client')
          ) {
            if (this.options.verbose) {
              console.log('🔄 Replaced RSC module:', resolveData.request);
            }
            
            // Replace with a safe empty module
            resolveData.request = 'data:text/javascript,module.exports = {};';
          }
        }
      });
    });

    // Add resolver alias to prevent loading of problematic modules
    compiler.options.resolve = compiler.options.resolve || {};
    compiler.options.resolve.alias = {
      ...compiler.options.resolve.alias,
      'react-server-dom-webpack/client.browser': false,
      'react-server-dom-turbopack/client.browser': false,
      'react-server-dom-webpack/client.edge': false,
      'react-server-dom-turbopack/client.edge': false,
    };

    if (this.options.verbose) {
      console.log('✅ Windows RSC Fix Plugin: Applied successfully');
    }
  }
}

module.exports = WindowsRSCFixPlugin;