"use client";

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTheme } from '../../Helper/ThemeProvider';
import { useSecureAuth } from '../../../context/FixedSecureAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { gql } from '@apollo/client';
// 🔒 SECURITY: Import connection state management for secure upload tracking
import connectionState from '../../../lib/ConnectionState.js';

// GraphQL mutations for stories and highlights
const CREATE_STORY = gql`
  mutation CreateStory($profileid: String!, $mediaUrl: String!, $mediaType: String!, $caption: String) {
    CreateStory(profileid: $profileid, mediaUrl: $mediaUrl, mediaType: $mediaType, caption: $caption) {
      storyid
      profileid
      mediaUrl
      mediaType
      caption
      expiresAt
      createdAt
    }
  }
`;

const CREATE_STORY_WITH_HIGHLIGHT = gql`
  mutation CreateStoryWithHighlight(
    $profileid: String!
    $mediaUrl: String!
    $mediaType: String!
    $caption: String
    $highlightTitle: String!
    $highlightCategory: String
  ) {
    CreateStoryWithHighlight(
      profileid: $profileid
      mediaUrl: $mediaUrl
      mediaType: $mediaType
      caption: $caption
      highlightTitle: $highlightTitle
      highlightCategory: $highlightCategory
    ) {
      storyid
      profileid
      mediaUrl
      mediaType
      caption
      expiresAt
      savedToHighlights
      createdAt
    }
  }
`;

const ADD_STORY_TO_HIGHLIGHT = gql`
  mutation AddStoryToHighlight($highlightid: String!, $storyid: String!) {
    AddStoryToHighlight(highlightid: $highlightid, storyid: $storyid) {
      highlightid
      title
      storyCount
    }
  }
`;

const GET_HIGHLIGHTS = gql`
  query GetHighlights($profileid: String!) {
    getHighlights(profileid: $profileid) {
      highlightid
      title
      coverImage
      storyCount
    }
  }
`;

export default function StoryUploadModal({ isOpen, onClose, onStoryCreated }) {
  const { theme } = useTheme();
  const { user } = useSecureAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // 🔒 SECURITY: Register component with connection state manager
  useEffect(() => {
    const componentId = 'StoryUploadModal';
    connectionState.register(componentId, {
      type: 'upload',
      critical: false,
      security: 'high',
      authenticated: true,
      mediaUpload: true
    });
    
    return () => {
      connectionState.update(componentId, { connected: false });
    };
  }, []);
  
  // Highlight options
  const [saveToHighlight, setSaveToHighlight] = useState(false);
  const [highlightOption, setHighlightOption] = useState('none'); // 'none', 'new', 'existing'
  const [newHighlightTitle, setNewHighlightTitle] = useState('');
  const [selectedHighlight, setSelectedHighlight] = useState('');
  const [highlightCategory, setHighlightCategory] = useState('');

  // Get existing highlights
  const { data: highlightsData } = useQuery(GET_HIGHLIGHTS, {
    variables: { profileid: user?.profileid },
    skip: !user?.profileid || !isOpen,
    errorPolicy: 'all'
  });

  const highlights = highlightsData?.getHighlights || [];

  // Mutations
  const [createStory] = useMutation(CREATE_STORY);
  const [createStoryWithHighlight] = useMutation(CREATE_STORY_WITH_HIGHLIGHT);
  const [addStoryToHighlight] = useMutation(ADD_STORY_TO_HIGHLIGHT);

  // Handle file selection
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // 🔒 SECURITY-ENHANCED: Upload file to server with comprehensive security
  const uploadFile = async (file) => {
    // 🔒 SECURITY: Validate file before upload
    if (!file) {
      throw new Error('No file provided for upload');
    }
    
    // 🔒 SECURITY: Validate file size and type
    const maxFileSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 10485760; // 10MB default
    if (file.size > maxFileSize) {
      throw new Error(`File too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB`);
    }
    
    // 🔒 SECURITY: Validate file type
    const allowedTypes = process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed`);
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    // 🔒 SECURITY: Add security headers and user context
    formData.append('userId', user?.profileid || '');
    formData.append('uploadType', 'story');
    formData.append('timestamp', Date.now().toString());

    try {
      // 🔒 SECURITY: Update connection state before upload
      connectionState.update('StoryUploadModal', {
        connected: true,
        uploading: true,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      const apiUrl = `http://localhost:${process.env.NEXT_PUBLIC_PORT || 45799}/upload`;
      
      // 🔒 SECURITY: Use enhanced fetch (already wrapped by FetchManager)
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        // 🔒 SECURITY: Add security headers
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-Upload-Type': 'story',
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        // 🔒 SECURITY: Set reasonable timeout
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`);
      }

      const result = await response.json();
      
      // 🔒 SECURITY: Validate response
      if (!result.fileUrl) {
        throw new Error('Invalid upload response - missing file URL');
      }
      
      // 🔒 SECURITY: Update connection state on success
      connectionState.update('StoryUploadModal', {
        uploading: false,
        lastUpload: Date.now(),
        lastFileName: file.name,
        uploadSuccess: true
      });
      
      console.log('📷 Story file uploaded successfully:', result.fileUrl);
      return result.fileUrl;
      
    } catch (error) {
      console.error('❌ Story upload error:', error);
      
      // 🔒 SECURITY: Record error in connection state
      connectionState.recordError('StoryUploadModal', error, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadAttempt: true
      });
      
      connectionState.update('StoryUploadModal', {
        uploading: false,
        uploadSuccess: false,
        lastError: error.message
      });
      
      // 🔒 SECURITY: Provide user-friendly error messages
      if (error.name === 'AbortError') {
        throw new Error('Upload timed out. Please try again with a smaller file.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network error during upload. Please check your connection and try again.');
      } else if (error.message.includes('413')) {
        throw new Error('File too large for server. Please choose a smaller file.');
      } else if (error.message.includes('415')) {
        throw new Error('File type not supported. Please choose a different file format.');
      }
      
      throw error;
    }
  };

  // Handle story submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !user?.profileid) {
      alert('Please select a file to upload');
      return;
    }

    setIsUploading(true);

    try {
      // Upload the media file
      const mediaUrl = await uploadFile(selectedFile);
      const mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image';

      let storyResult;

      if (highlightOption === 'new' && newHighlightTitle.trim()) {
        // Create story with new highlight
        const result = await createStoryWithHighlight({
          variables: {
            profileid: user.profileid,
            mediaUrl,
            mediaType,
            caption: caption.trim() || null,
            highlightTitle: newHighlightTitle.trim(),
            highlightCategory: highlightCategory.trim() || null
          }
        });
        storyResult = result.data.CreateStoryWithHighlight;
        
      } else {
        // Create regular story
        const result = await createStory({
          variables: {
            profileid: user.profileid,
            mediaUrl,
            mediaType,
            caption: caption.trim() || null
          }
        });
        storyResult = result.data.CreateStory;

        // If adding to existing highlight
        if (highlightOption === 'existing' && selectedHighlight) {
          await addStoryToHighlight({
            variables: {
              highlightid: selectedHighlight,
              storyid: storyResult.storyid
            }
          });
        }
      }

      // Success feedback
      if (onStoryCreated) {
        onStoryCreated(storyResult);
      }

      // Reset form
      resetForm();
      onClose();
      
    } catch (error) {
      console.error('Error creating story:', error);
      alert(`Failed to create story: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setCaption('');
    setSaveToHighlight(false);
    setHighlightOption('none');
    setNewHighlightTitle('');
    setSelectedHighlight('');
    setHighlightCategory('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`w-full max-w-lg rounded-2xl ${
            theme === 'dark'
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-200'
          } max-h-[90vh] overflow-y-auto`}
        >
          {/* Header */}
          <div className={`p-6 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Create Story
              </h2>
              <button
                onClick={handleClose}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* File Upload */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Photo or Video *
              </label>
              
              {!filePreview ? (
                <label className={`border-2 border-dashed rounded-lg p-8 block cursor-pointer transition-colors ${
                  theme === 'dark'
                    ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}>
                  <div className="text-center">
                    <div className={`text-4xl mb-4 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      📷
                    </div>
                    <p className={`text-lg font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Select photo or video
                    </p>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      Stories will disappear after 24 hours
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden bg-black">
                    {selectedFile?.type.startsWith('video/') ? (
                      <video
                        src={filePreview}
                        className="w-full h-64 object-contain"
                        controls
                        muted
                      />
                    ) : (
                      <img
                        src={filePreview}
                        alt="Story preview"
                        className="w-full h-64 object-contain"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className={`text-sm px-3 py-1 rounded transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Change media
                  </button>
                </div>
              )}
            </div>

            {/* Caption */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Caption (optional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            {/* Highlight Options */}
            <div className={`p-4 rounded-lg border ${
              theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
            }`}>
              <h3 className={`text-sm font-medium mb-3 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Save to Highlights (Optional)
              </h3>
              
              <div className="space-y-3">
                {/* None option */}
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="highlightOption"
                    value="none"
                    checked={highlightOption === 'none'}
                    onChange={(e) => setHighlightOption(e.target.value)}
                    className="text-red-500 focus:ring-red-500"
                  />
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Story only (24h disappearing)
                  </span>
                </label>

                {/* New highlight option */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="highlightOption"
                      value="new"
                      checked={highlightOption === 'new'}
                      onChange={(e) => setHighlightOption(e.target.value)}
                      className="text-red-500 focus:ring-red-500"
                    />
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Create new highlight
                    </span>
                  </label>
                  
                  {highlightOption === 'new' && (
                    <div className="ml-6 space-y-2">
                      <input
                        type="text"
                        placeholder="Highlight title"
                        value={newHighlightTitle}
                        onChange={(e) => setNewHighlightTitle(e.target.value)}
                        className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Category (optional)"
                        value={highlightCategory}
                        onChange={(e) => setHighlightCategory(e.target.value)}
                        className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* Existing highlight option */}
                {highlights.length > 0 && (
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="highlightOption"
                        value="existing"
                        checked={highlightOption === 'existing'}
                        onChange={(e) => setHighlightOption(e.target.value)}
                        className="text-red-500 focus:ring-red-500"
                      />
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Add to existing highlight
                      </span>
                    </label>
                    
                    {highlightOption === 'existing' && (
                      <div className="ml-6">
                        <select
                          value={selectedHighlight}
                          onChange={(e) => setSelectedHighlight(e.target.value)}
                          className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Select highlight</option>
                          {highlights.map((highlight) => (
                            <option key={highlight.highlightid} value={highlight.highlightid}>
                              {highlight.title} ({highlight.storyCount} stories)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:bg-gray-800'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:bg-gray-100'
                } disabled:cursor-not-allowed`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile || isUploading || (highlightOption === 'new' && !newHighlightTitle.trim()) || (highlightOption === 'existing' && !selectedHighlight)}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  selectedFile && !isUploading && 
                  (highlightOption === 'none' || 
                   (highlightOption === 'new' && newHighlightTitle.trim()) ||
                   (highlightOption === 'existing' && selectedHighlight))
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isUploading ? 'Creating...' : 'Share Story'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
