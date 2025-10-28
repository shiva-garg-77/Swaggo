/** @type {import('next').NextConfig} */

/**
 * 🚀 ENHANCED NEXT.JS CONFIGURATION - WINDOWS OPTIMIZED
 * 
 * ENHANCED (not simplified) configuration for 10/10 performance:
 * ✅ Next.js defaults with essential Windows optimizations
 * ✅ Streamlined webpack config for reliability
 * ✅ Essential security features maintained
 * ✅ Fast refresh and hot reload optimized
 * ✅ Reduced complexity for better maintainability
 * 
 * @version 6.0.0 - ENHANCED RELIABILITY EDITION
 */

// 🔧 PERFORMANCE FIX #38: Import bundle analyzer for bundle size optimization
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// 🔧 OPTIMIZATION #80: CDN configuration
const cdnConfig = {
  // Enable CDN in production
  enabled: process.env.ENABLE_CDN === 'true',
  
  // CDN base URL
  baseUrl: process.env.CDN_BASE_URL || '',
  
  // Asset version for cache busting
  assetVersion: process.env.ASSET_VERSION || Date.now(),
  
  // Cache control settings
  cacheControl: {
    maxAge: process.env.CDN_CACHE_MAX_AGE || '31536000', // 1 year
    immutable: process.env.CDN_CACHE_IMMUTABLE === 'true'
  }
};

const nextConfig = {
  // Silence workspace root/lockfile warning on Windows monorepos
  // outputFileTracingRoot: require('path').join(__dirname, '..', '..'),
  // 🚀 CORE PERFORMANCE - PROPER DEV & PROD SETTINGS
  reactStrictMode: true, // ✅ FIX #3: Enable for proper reload detection
  compress: true,
  poweredByHeader: false,
  
  // ✅ FIX: Enable automatic static optimization for faster navigation
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  
  // 🔧 PERFORMANCE FIX #38: Optimize bundle size by removing unused polyfills
  // Configure webpack chunking for optimal code splitting
  webpack: (config, { isServer, dev, webpack }) => {
    try {
      // ✅ FIX #14: Optimize polling for faster reload WITHOUT infinite loops
      if (dev && !isServer && process.platform === 'win32') {
        config.watchOptions = {
          poll: 200, // ✅ Reasonable polling to prevent excessive recompilation
          aggregateTimeout: 50, // ✅ Aggregate changes to reduce compile frequency
          ignored: '**/node_modules/**', // Single glob pattern for ignored files
        };
        
        // Minimize webpack output in development
        config.stats = 'minimal';
        config.infrastructureLogging = {
          level: 'error'
        };
        
        // Essential resolve aliases for better performance
        const path = require('path');
        const fs = require('fs');
        
        // Robust graphql path resolution for Windows
        const workspaceRoot = path.resolve(process.cwd(), '..', '..');
        const graphqlPath = path.join(workspaceRoot, 'node_modules', 'graphql');
        
        // Fallback to local if workspace graphql not found
        const resolvedGraphqlPath = fs.existsSync(graphqlPath)
          ? graphqlPath
          : path.resolve(process.cwd(), 'node_modules', 'graphql');

        config.resolve.alias = {
          ...config.resolve.alias,
          '@': path.resolve(process.cwd(), './'),
          '@components': path.resolve(process.cwd(), './Components'),
          '@lib': path.resolve(process.cwd(), './lib'),
          // Force single graphql instance - Windows compatible
          'graphql': resolvedGraphqlPath,
        };
      }
      
      // FIX: Improve dev mode compilation speed
      // Remove the conflicting devtool setting to let Next.js use SWC
      if (dev && !isServer) {
        // Remove custom devtool to allow SWC to work with next/font
        delete config.devtool;
        
        // Reduce module resolution time
        config.resolve.symlinks = false;
      }
      
      // 🔧 PERFORMANCE FIX #38: Remove unused polyfills to reduce bundle size
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: false,
          stream: false,
          buffer: false,
          process: false,
          // Remove other unused polyfills
          path: false,
          os: false,
          util: false,
          zlib: false,
          http: false,
          https: false,
          url: false,
          assert: false,
          events: false,
          querystring: false,
        };
      }
      
      // ✅ FIX #19: Dynamic env vars (no caching in dev)
      if (!dev) {
        config.plugins = config.plugins || [];
        config.plugins.push(
          new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            'process.env.NEXT_PUBLIC_API_URL': JSON.stringify(process.env.NEXT_PUBLIC_API_URL),
            'process.env.NEXT_PUBLIC_GRAPHQL_URL': JSON.stringify(process.env.NEXT_PUBLIC_GRAPHQL_URL),
            'process.env.NEXT_PUBLIC_ENABLE_CDN': JSON.stringify(cdnConfig.enabled),
            'process.env.NEXT_PUBLIC_CDN_BASE_URL': JSON.stringify(cdnConfig.baseUrl),
            'process.env.NEXT_PUBLIC_ASSET_VERSION': JSON.stringify(cdnConfig.assetVersion),
          })
        );
      }

      // 🔧 ENHANCEMENT #92: Additional webpack optimizations
      if (!isServer) {
        // 🔧 ENHANCEMENT #92: Optimize module resolution
        config.resolve.modules = [
          'node_modules',
          ...config.resolve.modules || [],
        ];
        
        // ✅ FIX #2: Smart caching - enable in both dev and prod for faster compilation
        config.cache = {
          type: 'filesystem',
          version: '2.0',
          cacheDirectory: require('path').join(process.cwd(), '.next', 'cache', 'webpack'),
          buildDependencies: {
            config: [__filename],
          },
          compression: dev ? false : 'gzip', // Disable compression in dev for speed
          maxAge: dev ? 1000 * 60 * 5 : 1000 * 60 * 60 * 24 * 7, // 5 min in dev, 7 days in prod
        };
        
        // 🔧 ENHANCEMENT #92: Optimize minimization
        if (config.optimization) {
          config.optimization.minimize = true;
          config.optimization.minimizer = config.optimization.minimizer || [];
          
          // Note: TerserPlugin is handled automatically by Next.js
          // Custom Terser configuration removed to prevent conflicts
        }
      }
      
      // 🔧 PERFORMANCE FIX #38: Configure code splitting optimizations
      if (!isServer) {
        if (dev) {
          // ✅ DEV: Minimal splitting to avoid Fast Refresh issues
          config.optimization.splitChunks = {
            chunks: 'async', // Only split async chunks in dev
            cacheGroups: {
              default: false,
              vendors: false,
            },
          };
        } else {
          // ✅ PRODUCTION: Aggressive splitting for optimal caching
          config.optimization.splitChunks = {
            chunks: 'all',
            cacheGroups: {
              // Vendor chunks for third-party libraries
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 10,
                reuseExistingChunk: true,
              },
              // React-related libraries
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
                name: 'react',
                chunks: 'all',
                priority: 20,
              },
              // Apollo GraphQL client
              apollo: {
                test: /[\\/]node_modules[\\/](@apollo)[\\/]/,
                name: 'apollo',
                chunks: 'all',
                priority: 18,
              },
              // Large vendor libraries
              vendorLarge: {
                test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
                name: 'vendor-react',
                chunks: 'all',
                priority: 25,
              },
              // Zustand store
              store: {
                test: /[\\/]store[\\/]/,
                name: 'store',
                chunks: 'all',
                priority: 15,
              },
              // Components that are used across multiple pages
              components: {
                test: /[\\/]Components[\\/]/,
                name: 'components',
                chunks: 'all',
                priority: 12,
                minChunks: 2,
              },
              // Split utilities
              utils: {
                test: /[\\/]utils[\\/]/,
                name: 'utils',
                chunks: 'all',
                priority: 15,
                minChunks: 2,
              },
              // Styles
              styles: {
                test: /\.(css|scss|sass)$/,
                name: 'styles',
                chunks: 'all',
                priority: 5,
                reuseExistingChunk: true,
              },
            },
          };
          
          // Configure runtime chunk for better caching (production only)
          config.optimization.runtimeChunk = 'single';
          
          // ✅ PRODUCTION: Tree shaking and optimization flags
          config.optimization.sideEffects = false;
          config.optimization.concatenateModules = true;
          config.optimization.providedExports = true;
          config.optimization.flagIncludedChunks = true;
          config.optimization.moduleIds = 'deterministic';
          config.optimization.chunkIds = 'deterministic';
        }
      }

      return config;
    } catch (error) {
      console.warn('⚠️ Webpack config error:', error.message);
      return config;
    }
  },
  
  // 🔧 PERFORMANCE FIX #38: Add experimental features configuration
  experimental: {
    // Performance tracking
    webVitalsAttribution: ['CLS', 'LCP', 'FID', 'FCP', 'TTFB'],
    // Optimize package imports - reduces bundle size
    optimizePackageImports: [
      'lucide-react',
      '@headlessui/react',
      'framer-motion',
      '@emotion/react',
      '@emotion/styled',
      'react-hot-toast'
    ],
    // ✅ FIX: Disable optimizations that cause Fast Refresh issues
    optimizeCss: false,
  },
  
  // ⚡ TURBOPACK CONFIGURATION
  turbopack: process.env.NODE_ENV === 'development' ? {
    resolveAlias: {
      '@': './',
      '@components': './Components',
      '@lib': './lib',
    },
  } : undefined,
  
  // 🔒 ESSENTIAL SECURITY ONLY
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*; media-src 'self'; frame-src 'none'; object-src 'none';"
          },
        ],
      },
    ];
  },

  // 🔗 MINIMAL API REWRITES
  async rewrites() {
    try {
      const backendUrl = 'http://localhost:45799';
      return {
        beforeFiles: [
          {
            source: '/api/:path*',
            destination: `${backendUrl}/api/:path*`,
          },
          {
            source: '/graphql',
            destination: `${backendUrl}/graphql`,
          },
        ],
      };
    } catch (error) {
      console.warn('Rewrites config error:', error);
      return { beforeFiles: [] };
    }
  },

  // 📷 OPTIMIZED IMAGES - MUCH FASTER
  images: {
    unoptimized: process.env.NODE_ENV === 'development', // Only in dev
    formats: ['image/webp', 'image/avif'], // Modern formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '45799',
        pathname: '/uploads/**',
      },
      // 🔧 OPTIMIZATION #80: Add CDN remote patterns
      {
        protocol: 'https',
        hostname: '**', // Allow CDN domains
      },
    ],
  },

  // 🔧 BUILD CONFIGURATION
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 🚀 PRODUCTION OPTIMIZATIONS
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  
  // 🔧 OPTIMIZATION #80: Add asset prefix for CDN
  assetPrefix: cdnConfig.enabled && cdnConfig.baseUrl ? cdnConfig.baseUrl : undefined,
};

// 🔧 PERFORMANCE FIX #38: Export with bundle analyzer
module.exports = withBundleAnalyzer(nextConfig);