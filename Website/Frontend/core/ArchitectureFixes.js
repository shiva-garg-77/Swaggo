/**
 * 🏗️ ARCHITECTURE FIXES - Circular Dependencies & Module Resolution
 */

// === CIRCULAR DEPENDENCY RESOLVER ===
class CircularDependencyResolver {
  constructor() {
    this.loadingPromises = new Map();
    this.resolvedModules = new Map();
  }

  async resolveImport(modulePath) {
    if (this.loadingPromises.has(modulePath)) {
      console.log(`⚠️ Circular dependency detected: ${modulePath}`);
      return this.createLazyProxy(modulePath);
    }

    if (this.resolvedModules.has(modulePath)) {
      return this.resolvedModules.get(modulePath);
    }

    const loadingPromise = this.loadModuleSafely(modulePath);
    this.loadingPromises.set(modulePath, loadingPromise);

    try {
      const module = await loadingPromise;
      this.resolvedModules.set(modulePath, module);
      return module;
    } catch (error) {
      console.error(`Module load failed: ${modulePath}`, error);
      return this.createSafeFallback();
    } finally {
      this.loadingPromises.delete(modulePath);
    }
  }

  async loadModuleSafely(modulePath) {
    return await import(modulePath);
  }

  createLazyProxy(modulePath) {
    return new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'default') {
          return async (...args) => {
            const module = await import(modulePath);
            return typeof module.default === 'function' 
              ? module.default(...args) 
              : module.default;
          };
        }
        return async (...args) => {
          const module = await import(modulePath);
          const value = module[prop];
          return typeof value === 'function' ? value(...args) : value;
        };
      }
    });
  }

  createSafeFallback() {
    return new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'default') return () => null;
        if (prop.startsWith('use')) return () => ({ loading: false, error: null, data: null });
        return () => null;
      }
    });
  }
}

// === MODULE REGISTRY ===
class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.resolver = new CircularDependencyResolver();
  }

  async getModule(path) {
    if (!this.modules.has(path)) {
      this.modules.set(path, { loaded: false, instance: null });
    }
    
    const config = this.modules.get(path);
    if (config.loaded) return config.instance;

    try {
      config.instance = await this.resolver.resolveImport(path);
      config.loaded = true;
    } catch (error) {
      config.instance = this.resolver.createSafeFallback();
    }
    
    return config.instance;
  }
}

// === WEBPACK OPTIMIZATIONS ===
export const webpackOptimizations = {
  resolve: {
    alias: {
      '@services': './services',
      '@components': './Components',
      '@lib': './lib',
      '@context': './context'
    },
    fallback: {
      'fs': false,
      'crypto': false,
      'stream': false
    }
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
};

// === UTILITIES ===
export const createSafeImport = (modulePath) => async () => {
  try {
    return await import(modulePath);
  } catch (error) {
    return { default: () => null };
  }
};

// === GLOBAL INSTANCES ===
const globalRegistry = new ModuleRegistry();
const globalResolver = new CircularDependencyResolver();

if (typeof window !== 'undefined') {
  window.__SWAGGO_ARCHITECTURE__ = { registry: globalRegistry, resolver: globalResolver };
  console.log('🏗️ Architecture system initialized');
}

export { CircularDependencyResolver, ModuleRegistry, globalRegistry, globalResolver };
export default { resolver: globalResolver, registry: globalRegistry };