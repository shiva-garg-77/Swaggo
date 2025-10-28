import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import WorkerThreads from '../../utils/WorkerThreads.js'; // 🔧 WORKER THREADS #85: Import worker threads utility

class ThumbnailService {
  /**
   * Generate thumbnail for an image file using worker threads
   * @param {string} imagePath - Path to the original image file
   * @param {number} width - Width of the thumbnail
   * @param {number} height - Height of the thumbnail
   * @returns {Promise<string>} - Path to the generated thumbnail
   */
  static async generateThumbnail(imagePath, width = 200, height = 200) {
    try {
      // Check if the image file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error('Image file not found');
      }

      // Get file extension
      const ext = path.extname(imagePath).toLowerCase();
      const name = path.basename(imagePath, ext);
      
      // Create thumbnail directory if it doesn't exist
      const thumbnailDir = path.join(path.dirname(imagePath), 'thumbnails');
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }
      
      // Generate thumbnail filename
      const thumbnailPath = path.join(thumbnailDir, `${name}_${width}x${height}${ext}`);
      
      // 🔧 WORKER THREADS #85: Use worker threads for CPU-intensive image processing
      if (WorkerThreads.isMainThread()) {
        // Read image file
        const imageBuffer = await fs.promises.readFile(imagePath);
        
        // Process image in worker thread
        const result = await WorkerThreads.processImage({
          inputBuffer: imageBuffer,
          outputPath: thumbnailPath,
          width,
          height,
          quality: 80,
          format: ext.substring(1) || 'jpeg'
        });
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        // Write processed image to file
        await fs.promises.writeFile(thumbnailPath, result.buffer);
      } else {
        // Fallback to direct processing if not in main thread
        await sharp(imagePath)
          .resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
          .toFile(thumbnailPath);
      }
      
      return thumbnailPath;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  }
  
  /**
   * Generate multiple thumbnails with different sizes using worker threads
   * @param {string} imagePath - Path to the original image file
   * @param {Array} sizes - Array of size objects {width, height}
   * @returns {Promise<Array>} - Array of thumbnail paths
   */
  static async generateThumbnails(imagePath, sizes = [
    { width: 100, height: 100 },
    { width: 200, height: 200 },
    { width: 400, height: 400 }
  ]) {
    try {
      const thumbnails = [];
      
      for (const size of sizes) {
        const thumbnailPath = await this.generateThumbnail(imagePath, size.width, size.height);
        thumbnails.push({
          path: thumbnailPath,
          width: size.width,
          height: size.height
        });
      }
      
      return thumbnails;
    } catch (error) {
      console.error('Error generating thumbnails:', error);
      throw error;
    }
  }
  
  /**
   * Check if a file is an image based on its mimetype
   * @param {string} mimetype - MIME type of the file
   * @returns {boolean} - True if the file is an image
   */
  static isImage(mimetype) {
    const imageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    return imageTypes.includes(mimetype);
  }
}

export default ThumbnailService;