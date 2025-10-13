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
  // 🚀 CORE PERFORMANCE - SUPER FAST MODE
  reactStrictMode: false,
  compress: true, // Always compress for better performance
  poweredByHeader: false,
  
  // 🔧 PERFORMANCE FIX #38: Optimize bundle size by removing unused polyfills
  // Configure webpack chunking for optimal code splitting
  webpack: (config, { isServer, dev, webpack }) => {
    try {
      // Windows-specific development optimizations (essential only)
      if (dev && !isServer && process.platform === 'win32') {
        // Essential Windows file watching
        config.watchOptions = {
          poll: 1000, // Polling for Windows file system
          aggregateTimeout: 300,
          ignored: /node_modules/,
        };
        
        // Essential resolve aliases for better performance
        config.resolve.alias = {
          ...config.resolve.alias,
          '@': require('path').resolve(process.cwd(), './'),
          '@components': require('path').resolve(process.cwd(), './Components'),
          '@lib': require('path').resolve(process.cwd(), './lib'),
        };
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
      
      // Essential environment variables
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
          'process.env.NEXT_PUBLIC_API_URL': JSON.stringify(process.env.NEXT_PUBLIC_API_URL),
          'process.env.NEXT_PUBLIC_GRAPHQL_URL': JSON.stringify(process.env.NEXT_PUBLIC_GRAPHQL_URL),
          // 🔧 OPTIMIZATION #80: Add CDN configuration to client-side
          'process.env.NEXT_PUBLIC_ENABLE_CDN': JSON.stringify(cdnConfig.enabled),
          'process.env.NEXT_PUBLIC_CDN_BASE_URL': JSON.stringify(cdnConfig.baseUrl),
          'process.env.NEXT_PUBLIC_ASSET_VERSION': JSON.stringify(cdnConfig.assetVersion),
        })
      );

      // 🔧 ENHANCEMENT #92: Additional webpack optimizations
      if (!isServer) {
        // 🔧 ENHANCEMENT #92: Optimize module resolution
        config.resolve.modules = [
          'node_modules',
          ...config.resolve.modules || [],
        ];
        
        // 🔧 ENHANCEMENT #92: Optimize build performance
        config.cache = {
          type: 'filesystem',
          version: '1.0',
          cacheDirectory: require('path').join(process.cwd(), '.next', 'cache', 'webpack'),
          buildDependencies: {
            config: [__filename],
          },
        };
        
        // 🔧 ENHANCEMENT #92: Optimize minimization
        if (config.optimization) {
          config.optimization.minimize = true;
          config.optimization.minimizer = config.optimization.minimizer || [];
          
          // Add Terser plugin if not already present
          if (!config.optimization.minimizer.some(plugin => plugin.constructor.name === 'TerserPlugin')) {
            config.optimization.minimizer.push(
              new webpack.TerserPlugin({
                terserOptions: {
                  compress: {
                    drop_console: process.env.NODE_ENV === 'production',
                    drop_debugger: true,
                    pure_funcs: ['console.log', 'console.info', 'console.debug'],
                  },
                  mangle: true,
                  keep_fnames: false,
                },
                extractComments: false,
                parallel: true,
              })
            );
          }
        }
      }
      
      // 🔧 PERFORMANCE FIX #38: Configure code splitting optimizations
      if (!isServer) {
        // Split chunks for better caching and loading
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
        
        // Configure runtime chunk for better caching
        config.optimization.runtimeChunk = 'single';
        
        // 🔧 ENHANCEMENT #91: Improve tree shaking configuration
        config.optimization.usedExports = true;
        config.optimization.sideEffects = false;
        
        // 🔧 ENHANCEMENT #92: Add additional optimization flags
        config.optimization.concatenateModules = true;
        config.optimization.providedExports = true;
        config.optimization.flagIncludedChunks = true;
        config.optimization.moduleIds = 'deterministic';
        config.optimization.chunkIds = 'deterministic';
      }

      return config;
    } catch (error) {
      console.warn('⚠️ Webpack config error:', error.message);
      return config;
    }
  },
  
  // 🔧 PERFORMANCE FIX #38: Add dynamic imports configuration
  // Enable dynamic imports for better code splitting
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
    // 🔧 PERFORMANCE FIX #38: Enable dynamic imports
    dynamicImports: true,
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
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
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