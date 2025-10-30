/**
 * IMAGE UTILITIES
 * Comprehensive image handling, optimization, and placeholder functions
 */

/**
 * Generate blur data URL for image placeholder
 * @param {number} width
 * @param {number} height
 * @returns {string} Data URL
 */
export function generateBlurDataURL(width = 10, height = 10) {
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) return '';
  
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
}

/**
 * Get optimized image URL with size parameters
 * @param {string} url - Original image URL
 * @param {object} options - { width, height, quality, format }
 * @returns {string} Optimized URL
 */
export function getOptimizedImageURL(url, options = {}) {
  if (!url) return '';
  
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // If using a CDN or image optimization service
  // Modify this based on your image service
  const params = new URLSearchParams();
  if (width) params.append('w', width);
  if (height) params.append('h', height);
  params.append('q', quality);
  params.append('f', format);
  
  return `${url}?${params.toString()}`;
}

/**
 * Create thumbnail URL
 * @param {string} url
 * @param {number} size - Thumbnail size (default 150)
 * @returns {string}
 */
export function getThumbnailURL(url, size = 150) {
  return getOptimizedImageURL(url, { width: size, height: size, quality: 70 });
}

/**
 * Lazy load image with intersection observer
 * @param {HTMLImageElement} img
 * @param {string} src
 * @param {Function} onLoad
 */
export function lazyLoadImage(img, src, onLoad) {
  if (!img || !src) return;
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = src;
          img.onload = onLoad;
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px'
    });
    
    observer.observe(img);
  } else {
    // Fallback for browsers without IntersectionObserver
    img.src = src;
    img.onload = onLoad;
  }
}

/**
 * Preload image
 * @param {string} src
 * @returns {Promise}
 */
export function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Get image dimensions
 * @param {string} src
 * @returns {Promise<{width: number, height: number}>}
 */
export async function getImageDimensions(src) {
  const img = await preloadImage(src);
  return {
    width: img.naturalWidth,
    height: img.naturalHeight
  };
}

/**
 * Compress image file
 * @param {File} file
 * @param {object} options - { maxWidth, maxHeight, quality }
 * @returns {Promise<Blob>}
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8
  } = options;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, file.type, quality);
      };
      
      img.onerror = reject;
    };
    
    reader.onerror = reject;
  });
}

/**
 * Convert image to circular crop
 * @param {string} src
 * @param {number} size
 * @returns {Promise<string>} Data URL
 */
export async function cropToCircle(src, size = 200) {
  const img = await preloadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext('2d');
  
  // Create circular clip
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  
  // Draw image
  ctx.drawImage(img, 0, 0, size, size);
  
  return canvas.toDataURL();
}

/**
 * Generate placeholder SVG
 * @param {number} width
 * @param {number} height
 * @param {string} text
 * @returns {string} SVG data URL
 */
export function generatePlaceholderSVG(width, height, text = '') {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#9ca3af" 
            text-anchor="middle" dominant-baseline="middle">
        ${text || `${width}×${height}`}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
