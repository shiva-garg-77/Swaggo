/** @type {import('next').NextConfig} */
const nextConfig = {
  // Simple performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Aggressive bundle optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Minimize bundle size
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
    };
    
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              reuseExistingChunk: true,
            },
            apollo: {
              test: /[\\/]node_modules[\\/](@apollo|graphql)[\\/]/,
              name: 'apollo',
              priority: 20,
              reuseExistingChunk: true,
            },
            framer: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer',
              priority: 20,
              reuseExistingChunk: true,
            },
            icons: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: 'icons',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Route-specific chunking for better performance
            homeRoute: {
              test: /[\\/]Components[\\/]MainComponents[\\/]Home[\\/]/,
              name: 'home-chunk',
              priority: 30,
              reuseExistingChunk: true,
            },
            profileRoute: {
              test: /[\\/]Components[\\/]MainComponents[\\/]Profile[\\/]/,
              name: 'profile-chunk',
              priority: 30,
              reuseExistingChunk: true,
            },
            reelsRoute: {
              test: /[\\/]Components[\\/]MainComponents[\\/]Reels[\\/]/,
              name: 'reels-chunk',
              priority: 30,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Bundle analyzer in development
    if (dev && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        })
      );
    }

    return config;
  },

  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Transpile packages for better compatibility
  transpilePackages: [],
  
  // Server external packages (moved from experimental)
  serverExternalPackages: [],
  
  // Turbopack configuration (moved from experimental)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Experimental features for performance
  experimental: {
    // optimizeCss: true, // Disabled due to missing critters dependency
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
    ],
    // optimizeServerReact: true, // Disabled for compatibility
  },

  // Static optimization
  output: 'standalone',
  
  // Environment variables
  env: {
    CUSTOM_KEY: 'swaggo-optimized',
  },
};

module.exports = nextConfig;
