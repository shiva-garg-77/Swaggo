import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix workspace root warning by explicitly setting the output file tracing root
  // This tells Next.js that the Frontend directory is the root for file tracing
  outputFileTracingRoot: __dirname,
  
  // Optimize images
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Enable experimental features if needed
  experimental: {
    // Add any experimental features here if needed
  },
  
  // Webpack configuration for better performance
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle size
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
    };
    
    return config;
  },
  
  // Removed experimental optimizeCss to fix dependency warnings
};

export default nextConfig;
