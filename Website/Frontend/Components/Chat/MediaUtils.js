'use client';

// File type validation
export const isImageFile = (file) => {
  return file && file.type.startsWith('image/');
};

export const isVideoFile = (file) => {
  return file && file.type.startsWith('video/');
};

export const isAudioFile = (file) => {
  return file && file.type.startsWith('audio/');
};

export const getFileType = (file) => {
  if (isImageFile(file)) return 'image';
  if (isVideoFile(file)) return 'video';
  if (isAudioFile(file)) return 'audio';
  return 'document';
};

// File size utilities
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isFileSizeValid = (file, maxSizeMB = 50) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Image processing utilities
export const resizeImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const generateImageThumbnail = (file, size = 200) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      
      // Calculate crop dimensions for square thumbnail
      const { width, height } = img;
      const minDim = Math.min(width, height);
      const x = (width - minDim) / 2;
      const y = (height - minDim) / 2;
      
      ctx.drawImage(img, x, y, minDim, minDim, 0, 0, size, size);
      
      canvas.toBlob(resolve, 'image/jpeg', 0.7);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Video processing utilities
export const getVideoMetadata = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: video.videoWidth / video.videoHeight
      });
      
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
};

export const generateVideoThumbnail = (file, timeInSeconds = 1) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeInSeconds, video.duration / 2);
    };
    
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(resolve, 'image/jpeg', 0.7);
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
};

// File validation
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 50, // MB
    allowedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*'],
    allowedExtensions = []
  } = options;

  const errors = [];

  // Check file size
  if (!isFileSizeValid(file, maxSize)) {
    errors.push(`File size must be less than ${maxSize}MB`);
  }

  // Check file type
  const isValidType = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.replace('/*', '/'));
    }
    return file.type === type;
  });

  if (!isValidType && allowedExtensions.length > 0) {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const isValidExtension = allowedExtensions.includes(fileExtension);
    if (!isValidExtension) {
      errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
  } else if (!isValidType) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Drag and drop utilities
export const handleFileDrop = (event, callback, options = {}) => {
  event.preventDefault();
  event.stopPropagation();

  const files = Array.from(event.dataTransfer.files);
  const validFiles = [];
  const errors = [];

  files.forEach(file => {
    const validation = validateFile(file, options);
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      errors.push({ file: file.name, errors: validation.errors });
    }
  });

  callback(validFiles, errors);
};

// URL and blob utilities
export const createFilePreview = (file) => {
  return {
    url: URL.createObjectURL(file),
    type: getFileType(file),
    name: file.name,
    size: file.size,
    formattedSize: formatFileSize(file.size)
  };
};

export const revokeFilePreview = (preview) => {
  if (preview && preview.url) {
    URL.revokeObjectURL(preview.url);
  }
};

// Media compression utilities
export const compressImage = async (file, quality = 0.8, maxDimension = 1920) => {
  if (!isImageFile(file)) {
    throw new Error('File is not an image');
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions
      if (width > height && width > maxDimension) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Apply image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// View-once utilities
export const createViewOnceWrapper = (file, onView = null) => {
  let hasBeenViewed = false;
  let viewTimeout = null;
  
  return {
    file,
    isViewOnce: true,
    hasBeenViewed,
    view: () => {
      if (hasBeenViewed) {
        throw new Error('This message has already been viewed');
      }
      
      hasBeenViewed = true;
      if (onView) {
        onView();
      }
      
      // Auto-cleanup after 30 seconds
      viewTimeout = setTimeout(() => {
        URL.revokeObjectURL(file.url);
      }, 30000);
      
      return file;
    },
    cleanup: () => {
      if (viewTimeout) {
        clearTimeout(viewTimeout);
      }
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    }
  };
};

// File download utilities
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  downloadFile(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};
