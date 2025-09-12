/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build optimization
  compress: true,
  poweredByHeader: false,
  
  // Fix workspace root warning
  outputFileTracingRoot: __dirname,
  
  // Faster image optimization
  images: {
    formats: ['image/webp'],
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
  },

  // Enhanced compiler optimizations for faster builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Webpack optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Faster builds with better caching
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };
    
    // Optimize bundle splits for faster builds
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            common: {
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Add alias for faster resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
    };
    
    // Exclude unnecessary files from compilation
    config.module.rules.push({
      test: /\.(md|txt)$/,
      use: 'raw-loader',
    });

    return config;
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
    ],
  },

  // ESLint configuration for faster builds (skip during build)
  eslint: {
    // Only run ESLint during development
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // TypeScript configuration for faster builds
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
