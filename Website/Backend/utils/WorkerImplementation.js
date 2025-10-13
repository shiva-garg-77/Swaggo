import { parentPort, workerData } from 'worker_threads';
import sharp from 'sharp';
import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';

/**
 * @fileoverview Worker Implementation for CPU-intensive operations
 * @module WorkerImplementation
 */

// Promisify zlib functions
const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);

// Worker operations
const OPERATIONS = {
  IMAGE_PROCESSING: 'image_processing',
  ENCRYPTION: 'encryption',
  COMPRESSION: 'compression',
  HASHING: 'hashing'
};

/**
 * Process image in worker thread
 * @param {Object} imageData - Image data to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processed image data
 */
async function processImage(imageData, options = {}) {
  try {
    const {
      inputBuffer,
      outputPath,
      width,
      height,
      quality = 80,
      format = 'jpeg'
    } = imageData;

    let pipeline = sharp(inputBuffer);

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
          progressive: true,
          mozjpeg: true
        });
        break;
      case 'png':
        pipeline = pipeline.png({ 
          quality: Math.floor(quality / 10),
          compressionLevel: 9,
          progressive: true
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

    // Process image
    const processedBuffer = await pipeline.toBuffer();
    
    return {
      success: true,
      buffer: processedBuffer,
      info: await sharp(processedBuffer).metadata()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Encrypt data in worker thread
 * @param {Object} encryptionData - Data to encrypt
 * @param {Object} options - Encryption options
 * @returns {Promise<Object>} Encrypted data
 */
async function encryptData(encryptionData, options = {}) {
  try {
    const {
      data,
      algorithm = 'aes-256-gcm',
      key,
      iv
    } = encryptionData;

    const keyBuffer = Buffer.from(key, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, ivBuffer);
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    return {
      success: true,
      encryptedData: encrypted,
      authTag: authTag.toString('base64')
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Compress data in worker thread
 * @param {Object} data - Data to compress
 * @param {Object} options - Compression options
 * @returns {Promise<Object>} Compressed data
 */
async function compressData(data, options = {}) {
  try {
    const {
      input,
      algorithm = 'gzip'
    } = data;

    let compressed;
    
    switch (algorithm) {
      case 'gzip':
        compressed = await gzipAsync(input);
        break;
      default:
        throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }

    return {
      success: true,
      compressedData: compressed,
      originalSize: Buffer.byteLength(input),
      compressedSize: Buffer.byteLength(compressed)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Hash data in worker thread
 * @param {Object} data - Data to hash
 * @param {Object} options - Hashing options
 * @returns {Promise<Object>} Hash result
 */
async function hashData(data, options = {}) {
  try {
    const {
      input,
      algorithm = 'sha256'
    } = data;

    const hash = crypto.createHash(algorithm).update(input).digest('hex');

    return {
      success: true,
      hash
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Main worker function
 */
async function main() {
  try {
    const { operation, data } = workerData;

    let result;
    
    switch (operation) {
      case OPERATIONS.IMAGE_PROCESSING:
        result = await processImage(data.imageData, data.options);
        break;
      case OPERATIONS.ENCRYPTION:
        result = await encryptData(data.encryptionData, data.options);
        break;
      case OPERATIONS.COMPRESSION:
        result = await compressData(data.data, data.options);
        break;
      case OPERATIONS.HASHING:
        result = await hashData(data.data, data.options);
        break;
      default:
        result = {
          success: false,
          error: `Unknown operation: ${operation}`
        };
    }

    parentPort.postMessage(result);
  } catch (error) {
    parentPort.postMessage({
      success: false,
      error: error.message
    });
  }
}

// Execute worker if we're in a worker thread
if (!workerData.isMainThread) {
  main();
}

export { 
  processImage, 
  encryptData, 
  compressData, 
  hashData,
  OPERATIONS
};