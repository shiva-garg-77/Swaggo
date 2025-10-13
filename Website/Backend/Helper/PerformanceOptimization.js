import NodeCache from 'node-cache';
import compression from 'compression';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Performance Optimization Utilities
 * Includes caching, compression, and image optimization
 */

// Cache instances for different types of data
export const caches = {
    // User data cache (30 minutes TTL)
    users: new NodeCache({ 
        stdTTL: 1800, // 30 minutes
        checkperiod: 300, // Check for expired keys every 5 minutes
        useClones: false // Better performance for objects
    }),
    
    // Posts cache (10 minutes TTL)
    posts: new NodeCache({ 
        stdTTL: 600, // 10 minutes
        checkperiod: 120 // Check every 2 minutes
    }),
    
    // File metadata cache (1 hour TTL)
    files: new NodeCache({ 
        stdTTL: 3600, // 1 hour
        checkperiod: 600 // Check every 10 minutes
    }),
    
    // GraphQL query cache (5 minutes TTL)
    graphql: new NodeCache({ 
        stdTTL: 300, // 5 minutes
        checkperiod: 60 // Check every minute
    }),
    
    // API responses cache (2 minutes TTL)
    api: new NodeCache({ 
        stdTTL: 120, // 2 minutes
        checkperiod: 30 // Check every 30 seconds
    }),

    // Session cache (24 hours TTL)
    sessions: new NodeCache({
        stdTTL: 86400, // 24 hours
        checkperiod: 3600 // Check every hour
    })
};

// Cache statistics
export const getCacheStats = () => {
    const stats = {};
    Object.keys(caches).forEach(cacheName => {
        const cache = caches[cacheName];
        stats[cacheName] = {
            keys: cache.keys().length,
            hits: cache.getStats().hits,
            misses: cache.getStats().misses,
            hitRate: cache.getStats().hits / (cache.getStats().hits + cache.getStats().misses) || 0
        };
    });
    return stats;
};

// Generic cache wrapper function
export const withCache = (cacheName, keyGenerator, ttl = null) => {
    return (target, propertyName, descriptor) => {
        const originalMethod = descriptor.value;
        
        descriptor.value = async function(...args) {
            const cache = caches[cacheName];
            if (!cache) {
                console.warn(`Cache "${cacheName}" not found`);
                return originalMethod.apply(this, args);
            }
            
            const cacheKey = keyGenerator(...args);
            
            // Try to get from cache first
            const cached = cache.get(cacheKey);
            if (cached !== undefined) {
                console.log(`Cache hit: ${cacheName}:${cacheKey}`);
                return cached;
            }
            
            // Execute original method
            const result = await originalMethod.apply(this, args);
            
            // Store in cache
            if (ttl) {
                cache.set(cacheKey, result, ttl);
            } else {
                cache.set(cacheKey, result);
            }
            
            console.log(`Cache miss: ${cacheName}:${cacheKey}`);
            return result;
        };
        
        return descriptor;
    };
};

// Cache middleware for Express routes
export const cacheMiddleware = (cacheName, keyGenerator, ttl = null) => {
    return (req, res, next) => {
        const cache = caches[cacheName];
        if (!cache) {
            return next();
        }
        
        const cacheKey = keyGenerator(req);
        const cached = cache.get(cacheKey);
        
        if (cached !== undefined) {
            console.log(`Cache hit: ${cacheName}:${cacheKey}`);
            return res.json(cached);
        }
        
        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function(data) {
            if (res.statusCode === 200 || res.statusCode === 201) {
                if (ttl) {
                    cache.set(cacheKey, data, ttl);
                } else {
                    cache.set(cacheKey, data);
                }
                console.log(`Cached response: ${cacheName}:${cacheKey}`);
            }
            return originalJson.call(this, data);
        };
        
        next();
    };
};

// Image optimization functions
export const ImageOptimizer = {
    /**
     * Optimize an image file using worker threads for CPU-intensive operations
     * @param {string} inputPath - Path to input image
     * @param {string} outputPath - Path to output image
     * @param {Object} options - Optimization options
     * @returns {Promise<Object>} - Optimization results
     */
    async optimize(inputPath, outputPath, options = {}) {
        const {
            format = 'jpeg',
            quality = 85,
            width,
            height,
            progressive = true,
            removeMetadata = true
        } = options;
        
        try {
            // 🔧 WORKER THREADS #85: Use worker threads for CPU-intensive image processing
            if (WorkerThreads.isMainThread()) {
                // Read image file
                const imageBuffer = await fs.promises.readFile(inputPath);
                
                // Process image in worker thread
                const result = await WorkerThreads.processImage({
                    inputBuffer: imageBuffer,
                    outputPath,
                    width,
                    height,
                    quality,
                    format,
                    progressive,
                    removeMetadata
                });
                
                if (!result.success) {
                    throw new Error(result.error);
                }
                
                // Write processed image to file
                await fs.promises.writeFile(outputPath, result.buffer);
                
                // Get file size comparison
                const originalStats = await fs.promises.stat(inputPath);
                const optimizedStats = await fs.promises.stat(outputPath);
                const originalSize = originalStats.size;
                const optimizedSize = optimizedStats.size;
                
                return {
                    originalSize,
                    optimizedSize,
                    savings: ((originalSize - optimizedSize) / originalSize * 100).toFixed(2) + '%',
                    compressionRatio: (optimizedSize / originalSize).toFixed(2),
                    info: result.info
                };
            } else {
                // Fallback to direct processing if not in main thread
                let pipeline = sharp(inputPath);
                
                // Remove metadata if requested
                if (removeMetadata) {
                    pipeline = pipeline.rotate(); // Auto-rotate and remove EXIF
                }
                
                // Resize if dimensions provided
                if (width || height) {
                    pipeline = pipeline.resize(width, height, {
                        fit: 'inside',
                        withoutEnlargement: true
                    });
                }
                
                // Apply format-specific optimizations
                switch (format.toLowerCase()) {
                    case 'jpeg':
                    case 'jpg':
                        pipeline = pipeline.jpeg({ 
                            quality, 
                            progressive,
                            mozjpeg: true
                        });
                        break;
                    case 'png':
                        pipeline = pipeline.png({ 
                            quality,
                            compressionLevel: 9,
                            progressive
                        });
                        break;
                    case 'webp':
                        pipeline = pipeline.webp({ 
                            quality,
                            effort: 6
                        });
                        break;
                    default:
                        throw new Error(`Unsupported format: ${format}`);
                }
                
                await pipeline.toFile(outputPath);
                
                // Get file size comparison
                const originalStats = await fs.promises.stat(inputPath);
                const optimizedStats = await fs.promises.stat(outputPath);
                const originalSize = originalStats.size;
                const optimizedSize = optimizedStats.size;
                
                return {
                    originalSize,
                    optimizedSize,
                    savings: ((originalSize - optimizedSize) / originalSize * 100).toFixed(2) + '%',
                    compressionRatio: (optimizedSize / originalSize).toFixed(2)
                };
            }
        } catch (error) {
            throw new Error(`Image optimization failed: ${error.message}`);
        }
    },
    
    // Create multiple sizes (thumbnails)
    async createThumbnails(inputPath, outputDir, sizes = []) {
        const defaultSizes = [
            { name: 'thumbnail', width: 150, height: 150 },
            { name: 'small', width: 300, height: 300 },
            { name: 'medium', width: 600, height: 600 },
            { name: 'large', width: 1200, height: 1200 }
        ];
        
        const sizesToProcess = sizes.length > 0 ? sizes : defaultSizes;
        const results = {};
        
        for (const size of sizesToProcess) {
            const outputPath = path.join(outputDir, `${size.name}_${path.basename(inputPath)}`);
            
            try {
                results[size.name] = await this.optimize(inputPath, outputPath, {
                    width: size.width,
                    height: size.height,
                    quality: size.quality || 85
                });
                results[size.name].path = outputPath;
            } catch (error) {
                console.error(`Error creating ${size.name} thumbnail:`, error);
                results[size.name] = { error: error.message };
            }
        }
        
        return results;
    },
    
    // Get image metadata
    async getMetadata(imagePath) {
        try {
            const metadata = await sharp(imagePath).metadata();
            const stats = await fs.promises.stat(imagePath);
            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: stats.size,
                hasAlpha: metadata.hasAlpha,
                channels: metadata.channels,
                density: metadata.density,
                colorspace: metadata.space,
                hasProfile: metadata.hasProfile
            };
        } catch (error) {
            throw new Error(`Failed to get image metadata: ${error.message}`);
        }
    }
};

// Compression middleware
export const compressionMiddleware = compression({
    // Only compress responses that are larger than 1kb
    threshold: 1024,
    
    // Compression level (1-9, 6 is default)
    level: 6,
    
    // Don't compress already compressed files
    filter: (req, res) => {
        const contentType = res.getHeader('Content-Type') || '';
        
        // Skip compression for already compressed formats
        if (contentType.includes('image/') || 
            contentType.includes('video/') || 
            contentType.includes('audio/') ||
            contentType.includes('application/zip') ||
            contentType.includes('application/gzip')) {
            return false;
        }
        
        return compression.filter(req, res);
    }
});

// Database query optimization helpers
export const QueryOptimizer = {
    // Pagination helper with caching
    async paginateWithCache(model, query, options = {}) {
        const {
            page = 1,
            limit = 20,
            sort = { createdAt: -1 },
            populate = null,
            select = null,
            cacheTTL = 300, // 5 minutes
            cacheKey = null
        } = options;
        
        const skip = (page - 1) * limit;
        const cache = caches.api;
        
        // Generate cache key
        const key = cacheKey || `${model.modelName}:${JSON.stringify({ query, page, limit, sort })}`;
        
        // Try cache first
        const cached = cache.get(key);
        if (cached) {
            return cached;
        }
        
        // Execute queries in parallel
        const [docs, total] = await Promise.all([
            model.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate(populate)
                .select(select)
                .lean(), // Use lean for better performance
            model.countDocuments(query)
        ]);
        
        const result = {
            docs,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
        };
        
        // Cache result
        cache.set(key, result, cacheTTL);
        
        return result;
    },
    
    // Batch loading helper to prevent N+1 queries
    createDataLoader(model, keyField = '_id') {
        const cache = new Map();
        
        return {
            async load(key) {
                if (cache.has(key)) {
                    return cache.get(key);
                }
                
                const result = await model.findOne({ [keyField]: key }).lean();
                cache.set(key, result);
                return result;
            },
            
            async loadMany(keys) {
                const results = await model.find({ [keyField]: { $in: keys } }).lean();
                const resultMap = new Map();
                results.forEach(result => resultMap.set(result[keyField].toString(), result));
                
                return keys.map(key => resultMap.get(key.toString()) || null);
            },
            
            clear() {
                cache.clear();
            }
        };
    }
};

// Performance monitoring
export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            requestTimes: new NodeCache({ stdTTL: 300 }), // 5 minutes
            slowQueries: [],
            cacheHits: 0,
            cacheMisses: 0
        };
    }
    
    // Request timing middleware
    requestTimer() {
        return (req, res, next) => {
            const startTime = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                const key = `${req.method}:${req.route?.path || req.path}`;
                
                // Store request timing
                this.metrics.requestTimes.set(key, {
                    duration,
                    timestamp: new Date(),
                    statusCode: res.statusCode
                });
                
                // Log slow requests
                if (duration > 1000) {
                    console.warn(`Slow request: ${key} took ${duration}ms`);
                }
                
                // Track extremely slow requests
                if (duration > 5000) {
                    this.metrics.slowQueries.push({
                        endpoint: key,
                        duration,
                        timestamp: new Date(),
                        query: req.query,
                        body: req.method === 'POST' ? req.body : null
                    });
                    
                    // Keep only last 10 slow queries
                    if (this.metrics.slowQueries.length > 10) {
                        this.metrics.slowQueries.shift();
                    }
                }
            });
            
            next();
        };
    }
    
    // Get performance metrics
    getMetrics() {
        const requestTimes = this.metrics.requestTimes.keys().map(key => ({
            endpoint: key,
            ...this.metrics.requestTimes.get(key)
        }));
        
        return {
            requestTimes,
            slowQueries: this.metrics.slowQueries,
            cacheStats: getCacheStats(),
            averageResponseTime: requestTimes.reduce((sum, req) => sum + req.duration, 0) / requestTimes.length || 0,
            slowRequestCount: requestTimes.filter(req => req.duration > 1000).length
        };
    }
}

// Create performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Memory usage monitoring
export const getMemoryUsage = () => {
    const usage = process.memoryUsage();
    return {
        rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(usage.external / 1024 / 1024) + ' MB',
        arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024) + ' MB'
    };
};

// Cache cleanup utility
export const cleanupCaches = () => {
    let totalCleaned = 0;
    Object.keys(caches).forEach(cacheName => {
        const beforeKeys = caches[cacheName].keys().length;
        caches[cacheName].flushAll();
        const afterKeys = caches[cacheName].keys().length;
        totalCleaned += (beforeKeys - afterKeys);
    });
    console.log(`Cleaned ${totalCleaned} cache entries`);
    return totalCleaned;
};

export default {
    caches,
    getCacheStats,
    withCache,
    cacheMiddleware,
    ImageOptimizer,
    compressionMiddleware,
    QueryOptimizer,
    PerformanceMonitor,
    performanceMonitor,
    getMemoryUsage,
    cleanupCaches
};