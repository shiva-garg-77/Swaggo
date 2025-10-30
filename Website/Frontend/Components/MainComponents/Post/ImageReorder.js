'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/**
 * Image Reorder Component (Issue 5.17)
 * Allows reordering multiple images with simple prev/next buttons
 */
export default function ImageReorder({ images, onReorder, onRemove }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const moveLeft = (index) => {
    if (index > 0) {
      const newImages = [...images];
      [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
      onReorder(newImages);
      setSelectedIndex(index - 1);
    }
  };
  
  const moveRight = (index) => {
    if (index < images.length - 1) {
      const newImages = [...images];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      onReorder(newImages);
      setSelectedIndex(index + 1);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Main Preview */}
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        <img
          src={images[selectedIndex]}
          alt={`Image ${selectedIndex + 1}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
          {selectedIndex + 1} / {images.length}
        </div>
      </div>
      
      {/* Thumbnails with Reorder Controls */}
      <div className="grid grid-cols-4 gap-2">
        {images.map((img, index) => (
          <div key={index} className="relative group">
            <img
              src={img}
              alt={`Thumbnail ${index + 1}`}
              className={`w-full aspect-square object-cover rounded cursor-pointer ${
                index === selectedIndex ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedIndex(index)}
            />
            
            {/* Reorder Controls */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
              {index > 0 && (
                <button
                  onClick={() => moveLeft(index)}
                  className="p-1 bg-white rounded-full hover:scale-110 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {index < images.length - 1 && (
                <button
                  onClick={() => moveRight(index)}
                  className="p-1 bg-white rounded-full hover:scale-110 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onRemove(index)}
                className="p-1 bg-red-500 text-white rounded-full hover:scale-110 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
