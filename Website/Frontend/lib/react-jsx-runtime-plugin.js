/**
 * 🛠️ React JSX Runtime Webpack Plugin for Next.js 15.5.4
 * 
 * This plugin ensures perfect React JSX runtime resolution across all
 * webpack builds, including Next.js internal modules like icon-mark.js
 */

class ReactJSXRuntimePlugin {
  constructor(options = {}) {
    this.options = {
      reactPath: require.resolve('react'),
      jsxRuntimePath: require.resolve('react/jsx-runtime'),
      jsxDevRuntimePath: require.resolve('react/jsx-dev-runtime'),
      ...options
    };
  }

  apply(compiler) {
    const { NormalModuleReplacementPlugin } = compiler.webpack;
    
    // Replace all jsx-runtime imports with the correct path
    new NormalModuleReplacementPlugin(
      /^react\/jsx-runtime$/,
      this.options.jsxRuntimePath
    ).apply(compiler);
    
    new NormalModuleReplacementPlugin(
      /^react\/jsx-dev-runtime$/,
      this.options.jsxDevRuntimePath
    ).apply(compiler);
    
    // Hook into the resolve process
    compiler.hooks.normalModuleFactory.tap('ReactJSXRuntimePlugin', (factory) => {
      factory.hooks.beforeResolve.tapAsync('ReactJSXRuntimePlugin', (data, callback) => {
        if (!data) return callback();
        
        const request = data.request;
        
        // Handle jsx-runtime requests
        if (request === 'react/jsx-runtime') {
          data.request = this.options.jsxRuntimePath;
        } else if (request === 'react/jsx-dev-runtime') {
          data.request = this.options.jsxDevRuntimePath;
        }
        
        callback();
      });
    });
    
    // Add to module resolution
    compiler.hooks.afterResolvers.tap('ReactJSXRuntimePlugin', (compiler) => {
      compiler.resolverFactory.hooks.resolver
        .for('normal')
        .tap('ReactJSXRuntimePlugin', (resolver) => {
          resolver.hooks.beforeDescribed.tap('ReactJSXRuntimePlugin', (resolveData) => {
            if (resolveData.request === 'react/jsx-runtime') {
              resolveData.request = this.options.jsxRuntimePath;
            } else if (resolveData.request === 'react/jsx-dev-runtime') {
              resolveData.request = this.options.jsxDevRuntimePath;
            }
          });
        });
    });
  }
}

module.exports = ReactJSXRuntimePlugin;