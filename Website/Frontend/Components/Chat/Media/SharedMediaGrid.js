'use client';

import React, { useState, useCallback, useMemo } from 'react';
import cdnService from '../../../services/CDNService';

// Utility function to chunk array
const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

export default function SharedMediaGrid({ messages = [] }) {
  // Filter messages with attachments
  const mediaMessages = useMemo(() => messages.filter(message => 
    message.attachments && message.attachments.length > 0
  ), [messages]);

  // Flatten attachments from all messages
  const allAttachments = useMemo(() => mediaMessages.flatMap(message => 
    message.attachments.map(attachment => ({
      ...attachment,
      messageId: message.messageid,
      sender: message.sender,
      timestamp: message.createdAt
    }))
  ), [mediaMessages]);

  // Group attachments by type
  const groupedAttachments = useMemo(() => allAttachments.reduce((acc, attachment) => {
    if (attachment.type === 'image') {
      acc.images.push(attachment);
    } else if (attachment.type === 'video') {
      acc.videos.push(attachment);
    } else {
      acc.files.push(attachment);
    }
    return acc;
  }, { images: [], videos: [], files: [] }), [allAttachments]);

  const [activeTab, setActiveTab] = useState('images');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [visibleItems, setVisibleItems] = useState(20); // Initial visible items
  const { elementRef, hasIntersected } = useIntersectionObserver();

  // Get current attachments based on active tab
  const currentAttachments = useMemo(() => groupedAttachments[activeTab] || [], [groupedAttachments, activeTab]);

  // Progressive loading - load more items when user scrolls to bottom
  React.useEffect(() => {
    if (hasIntersected && visibleItems < currentAttachments.length) {
      const timer = setTimeout(() => {
        setVisibleItems(prev => Math.min(prev + 10, currentAttachments.length));
      }, 300); // Small delay for better UX
      
      return () => clearTimeout(timer);
    }
  }, [hasIntersected, visibleItems, currentAttachments.length]);

  // Reset visible items when tab changes
  React.useEffect(() => {
    setVisibleItems(20);
  }, [activeTab]);

  // Get visible attachments for current tab
  const visibleAttachments = useMemo(() => 
    currentAttachments.slice(0, visibleItems), 
    [currentAttachments, visibleItems]
  );

  // Chunk attachments for grid layout
  const attachmentChunks = useMemo(() => 
    chunkArray(visibleAttachments, 3), 
    [visibleAttachments]
  );

  if (allAttachments.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No shared media</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Shared photos, videos, and files will appear here
        </p>
      </div>
    );
  }

  const renderMediaItem = (media) => {
    // Optimize thumbnail URL through CDN
    const thumbnailUrl = cdnService.optimizeImage(media.url, {
      width: 300,
      quality: 'MEDIUM',
      format: 'AUTO'
    });

    if (media.type === 'image') {
      return (
        <img
          src={thumbnailUrl}
          alt={media.filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      );
    } else if (media.type === 'video') {
      return (
        <div className="relative w-full h-full">
          <img
            src={thumbnailUrl}
            alt={media.filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-gray-700">
          <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate px-1">
            {media.filename}
          </span>
        </div>
      );
    }
  };

  const renderMediaPreview = () => {
    if (!selectedMedia) return null;

    // Optimize preview URL through CDN
    const previewUrl = selectedMedia.type === 'image' 
      ? cdnService.optimizeImage(selectedMedia.url, {
          width: 800,
          quality: 'HIGH',
          format: 'AUTO'
        })
      : selectedMedia.url;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={() => setSelectedMedia(null)}
      >
        <div 
          className="relative max-w-4xl max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {selectedMedia.type === 'image' ? (
            <img
              src={previewUrl}
              alt={selectedMedia.filename || 'Image'}
              className="max-h-[80vh] max-w-full object-contain"
            />
          ) : selectedMedia.type === 'video' ? (
            <video
              src={previewUrl}
              controls
              className="max-h-[80vh] max-w-full"
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center space-x-3 mb-4">
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedMedia.filename}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedMedia.size ? formatFileSize(selectedMedia.size) : 'Unknown size'}
                  </p>
                </div>
              </div>
              <a 
                href={selectedMedia.url} 
                download={selectedMedia.filename}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-center transition-colors"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          onClick={() => setActiveTab('images')}
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'images'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Photos ({groupedAttachments.images.length})
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'videos'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Videos ({groupedAttachments.videos.length})
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'files'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Files ({groupedAttachments.files.length})
        </button>
      </div>

      {/* Media Grid */}
      {visibleAttachments.length > 0 ? (
        <div className="space-y-2">
          {attachmentChunks.map((chunk, chunkIndex) => (
            <div key={chunkIndex} className="grid grid-cols-3 gap-2">
              {chunk.map((attachment, index) => {
                const globalIndex = chunkIndex * 3 + index;
                const isLastItem = globalIndex === visibleAttachments.length - 1;
                
                return (
                  <div 
                    key={`${attachment.messageId}-${index}`}
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedMedia(attachment)}
                  >
                    {renderMediaItem(attachment)}
                    {/* Load more sentinel for last item */}
                    {isLastItem && (
                      <div ref={elementRef} className="w-full h-1" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No {activeTab}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No shared {activeTab} in this chat
          </p>
        </div>
      )}

      {/* Media Preview Modal */}
      {renderMediaPreview()}
    </div>
  );
}