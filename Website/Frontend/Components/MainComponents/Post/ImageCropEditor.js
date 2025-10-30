'use client';

import { useState, useRef } from 'react';
import { Crop, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * Simple Image Crop/Edit Component (Issue 5.16)
 * Basic cropping and editing with canvas
 */
export default function ImageCropEditor({ image, onSave, onCancel }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  
  const applyEdits = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = image;
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Apply filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      // Get edited image
      const editedImage = canvas.toDataURL('image/jpeg', 0.9);
      onSave(editedImage);
    };
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-black/50">
        <h3 className="text-white font-semibold">Edit Image</h3>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-white hover:bg-white/10 rounded">
            Cancel
          </button>
          <button onClick={applyEdits} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Save
          </button>
        </div>
      </div>
      
      {/* Preview */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative max-w-2xl max-h-full">
          <img
            src={image}
            alt="Edit preview"
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              filter: `brightness(${brightness}%) contrast(${contrast}%)`
            }}
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
      
      {/* Controls */}
      <div className="p-4 bg-black/50 space-y-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-2 text-white hover:bg-white/10 rounded">
            <ZoomOut className="w-5 h-5" />
          </button>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1"
          />
          <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="p-2 text-white hover:bg-white/10 rounded">
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setRotation((rotation + 90) % 360)} className="p-2 text-white hover:bg-white/10 rounded">
            <RotateCw className="w-5 h-5" />
          </button>
          <span className="text-white text-sm">Rotation: {rotation}°</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-white text-sm">Brightness</label>
            <input
              type="range"
              min="50"
              max="150"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-white text-sm">Contrast</label>
            <input
              type="range"
              min="50"
              max="150"
              value={contrast}
              onChange={(e) => setContrast(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
