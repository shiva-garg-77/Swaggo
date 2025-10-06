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

const nextConfig = {
  // 🚀 CORE PERFORMANCE - SUPER FAST MODE
  reactStrictMode: false,
  compress: true, // Always compress for better performance
  poweredByHeader: false,
  swcMinify: true, // Use super-fast SWC minifier
  
  // 🔥 BLAZING HOT RELOAD - WINDOWS OPTIMIZED
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
  
  // ⚡ ENHANCED FAST REFRESH FOR WINDOWS
  ...(process.env.NODE_ENV === 'development' && {
    // Fast Refresh optimization
    compiler: {
      removeConsole: false, // Keep console logs in development
    },
    // Add Fast Refresh boundaries for better hot reload
    reactStrictMode: false, // Keep disabled for hot reload compatibility
  }),
  
  // ⚡ TURBO OPTIMIZATIONS
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
    // Faster builds
    turbo: process.env.NODE_ENV === 'development' ? {
      resolveAlias: {
        '@': './',
        '@components': './Components',
        '@lib': './lib',
      },
    } : undefined,
  },
  
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

  // 🚀 ENHANCED WEBPACK - ESSENTIAL WINDOWS SUPPORT ONLY
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
      
      // Essential security: Remove Node.js polyfills from client bundle
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
        };
      }
      
      // Essential environment variables
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
          'process.env.NEXT_PUBLIC_API_URL': JSON.stringify(process.env.NEXT_PUBLIC_API_URL),
          'process.env.NEXT_PUBLIC_GRAPHQL_URL': JSON.stringify(process.env.NEXT_PUBLIC_GRAPHQL_URL),
        })
      );

      return config;
    } catch (error) {
      console.warn('⚠️ Webpack config error:', error.message);
      return config;
    }
  },
};

module.exports = nextConfig;
