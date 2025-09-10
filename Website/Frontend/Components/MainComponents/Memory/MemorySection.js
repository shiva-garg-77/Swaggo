"use client";

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useTheme } from '../../Helper/ThemeProvider';
import { useAuth } from '../../Helper/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { GET_MEMORIES, CREATE_MEMORY, ADD_STORY_TO_MEMORY } from '../../../lib/graphql/profileQueries';

export default function MemorySection({ className = "" }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMemoryTitle, setNewMemoryTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // GraphQL operations
  const { data: memoriesData, loading, error, refetch } = useQuery(GET_MEMORIES, {
    variables: { profileid: user?.profileid },
    skip: !user?.profileid,
    errorPolicy: 'all'
  });

  const [createMemory] = useMutation(CREATE_MEMORY);
  const [addStoryToMemory] = useMutation(ADD_STORY_TO_MEMORY);

  const memories = memoriesData?.getMemories || [];

  // Handle file upload
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const apiUrl = `http://localhost:${process.env.NEXT_PUBLIC_PORT || 8000}/upload`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return result.fileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // Handle creating new memory
  const handleCreateMemory = useCallback(async () => {
    if (!newMemoryTitle.trim() || !user?.profileid) return;

    setIsUploading(true);
    try {
      let coverImageUrl = null;
      
      if (selectedFile) {
        coverImageUrl = await uploadFile(selectedFile);
      }

      await createMemory({
        variables: {
          profileid: user.profileid,
          title: newMemoryTitle.trim(),
          coverImage: coverImageUrl,
          postUrl: null // Can be linked to a post later
        }
      });

      setNewMemoryTitle('');
      setSelectedFile(null);
      setShowCreateForm(false);
      refetch();
    } catch (error) {
      console.error('Error creating memory:', error);
      alert('Error creating memory. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [newMemoryTitle, selectedFile, user, createMemory, refetch]);

  // Handle adding story to existing memory
  const handleAddStory = useCallback(async (memoryId, file) => {
    if (!file || !user?.profileid) return;

    setIsUploading(true);
    try {
      const mediaUrl = await uploadFile(file);
      const mediaType = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';

      await addStoryToMemory({
        variables: {
          memoryid: memoryId,
          mediaUrl,
          mediaType
        }
      });

      refetch();
    } catch (error) {
      console.error('Error adding story:', error);
      alert('Error adding story. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [user, addStoryToMemory, refetch]);

  if (!user?.profileid) {
    return null; // Don't show memories section if not logged in
  }

  return (
    <div className={`w-full mb-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Memories & Highlights
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Memory</span>
        </motion.button>
      </div>

      {/* Create Memory Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-6 p-4 rounded-lg border ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Memory Title
                </label>
                <input
                  type="text"
                  value={newMemoryTitle}
                  onChange={(e) => setNewMemoryTitle(e.target.value)}
                  placeholder="What's this memory about?"
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Cover Image (optional)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="hidden"
                    id="memory-cover-upload"
                  />
                  <label
                    htmlFor="memory-cover-upload"
                    className={`px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Choose File
                  </label>
                  {selectedFile && (
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {selectedFile.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateMemory}
                  disabled={!newMemoryTitle.trim() || isUploading}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    newMemoryTitle.trim() && !isUploading
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isUploading ? 'Creating...' : 'Create Memory'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewMemoryTitle('');
                    setSelectedFile(null);
                  }}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memories List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className={`text-center py-8 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <p>Unable to load memories</p>
        </div>
      ) : memories.length === 0 ? (
        <div className={`text-center py-8 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
          </svg>
          <p className="text-lg font-medium mb-2">No memories yet</p>
          <p className="text-sm">Create your first memory to get started!</p>
        </div>
      ) : (
        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {memories.map((memory) => (
            <MemoryCard
              key={memory.memoryid}
              memory={memory}
              onAddStory={handleAddStory}
              theme={theme}
              isUploading={isUploading}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Individual Memory Card Component
function MemoryCard({ memory, onAddStory, theme, isUploading }) {
  const [showStoryUpload, setShowStoryUpload] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onAddStory(memory.memoryid, file);
      setShowStoryUpload(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`flex-shrink-0 w-32 h-48 rounded-lg overflow-hidden cursor-pointer relative group ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
      }`}
    >
      {/* Memory Cover */}
      {memory.coverImage ? (
        <img
          src={memory.coverImage}
          alt={memory.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center ${
          theme === 'dark' ? 'bg-gradient-to-br from-purple-900 to-blue-900' : 'bg-gradient-to-br from-purple-400 to-blue-500'
        }`}>
          <svg className="w-12 h-12 text-white/70" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
          </svg>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white text-sm font-semibold truncate mb-1">
          {memory.title}
        </h3>
              <p className="text-white/70 text-xs">
                {memory.stories?.length || 0} {memory.stories?.length === 1 ? 'story' : 'stories'}
              </p>
              {memory.postUrl && (
                <p className="text-blue-300 text-xs mt-1 flex items-center">
                  <span className="mr-1">🔗</span>
                  Linked post
                </p>
              )}
      </div>

      {/* Add Story Button */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute top-2 right-2"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowStoryUpload(true);
          }}
          disabled={isUploading}
          className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </motion.div>

      {/* Hidden file input for adding stories */}
      {showStoryUpload && (
        <>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onClick={(e) => e.stopPropagation()}
          />
          <div 
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-5"
            onClick={(e) => {
              e.stopPropagation();
              setShowStoryUpload(false);
            }}
          >
            <div className="text-white text-center">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm">Click to select</p>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
