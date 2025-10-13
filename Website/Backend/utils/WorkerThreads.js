import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * @fileoverview Worker Threads Utility for CPU-intensive operations
 * @module WorkerThreads
 */

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Worker thread operations
const OPERATIONS = {
  IMAGE_PROCESSING: 'image_processing',
  ENCRYPTION: 'encryption',
  COMPRESSION: 'compression',
  HASHING: 'hashing'
};

class WorkerThreads {
  /**
   * Execute image processing in a worker thread
   * @param {Object} imageData - Image data to process
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed image data
   */
  static async processImage(imageData, options = {}) {
    return this.executeWorker(OPERATIONS.IMAGE_PROCESSING, { imageData, options });
  }

  /**
   * Execute encryption in a worker thread
   * @param {Object} encryptionData - Data to encrypt
   * @param {Object} options - Encryption options
   * @returns {Promise<Object>} Encrypted data
   */
  static async encryptData(encryptionData, options = {}) {
    return this.executeWorker(OPERATIONS.ENCRYPTION, { encryptionData, options });
  }

  /**
   * Execute compression in a worker thread
   * @param {Object} data - Data to compress
   * @param {Object} options - Compression options
   * @returns {Promise<Object>} Compressed data
   */
  static async compressData(data, options = {}) {
    return this.executeWorker(OPERATIONS.COMPRESSION, { data, options });
  }

  /**
   * Execute hashing in a worker thread
   * @param {Object} data - Data to hash
   * @param {Object} options - Hashing options
   * @returns {Promise<Object>} Hash result
   */
  static async hashData(data, options = {}) {
    return this.executeWorker(OPERATIONS.HASHING, { data, options });
  }

  /**
   * Execute operation in a worker thread
   * @param {string} operation - Operation type
   * @param {Object} data - Data to process
   * @returns {Promise<Object>} Result
   */
  static async executeWorker(operation, data) {
    return new Promise((resolve, reject) => {
      // Create worker thread
      const workerPath = path.join(__dirname, 'WorkerImplementation.js');
      const worker = new Worker(workerPath, {
        workerData: { operation, data }
      });

      // Handle worker messages
      worker.on('message', (result) => {
        resolve(result);
        worker.terminate();
      });

      // Handle worker errors
      worker.on('error', (error) => {
        reject(new Error(`Worker error: ${error.message}`));
        worker.terminate();
      });

      // Handle worker exit
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  /**
   * Check if we're in the main thread
   * @returns {boolean} Whether we're in the main thread
   */
  static isMainThread() {
    return isMainThread;
  }
}

export default WorkerThreads;
export { OPERATIONS };