"use client";

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useTheme } from '../../Helper/ThemeProvider';
import { useAuth } from '../../Helper/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { gql } from '@apollo/client';

// Define mutations inline to avoid import issues
const GET_MEMORIES = gql`
  query GetMemories($profileid: String!) {
    getMemories(profileid: $profileid) {
      memoryid
      title
      coverImage
      postUrl
      createdAt
      stories {
        storyid
        mediaUrl
        mediaType
        createdAt
      }
    }
  }
`;

const CREATE_MEMORY = gql`
  mutation CreateMemory($profileid: String!, $title: String!, $coverImage: String, $postUrl: String) {
    CreateMemory(profileid: $profileid, title: $title, coverImage: $coverImage, postUrl: $postUrl) {
      memoryid
      title
      coverImage
      postUrl
      createdAt
    }
  }
`;

const ADD_STORY_TO_MEMORY = gql`
  mutation AddStoryToMemory($memoryid: String!, $mediaUrl: String!, $mediaType: String!) {
    AddStoryToMemory(memoryid: $memoryid, mediaUrl: $mediaUrl, mediaType: $mediaType) {
      memoryid
      title
      coverImage
      postUrl
      stories {
        storyid
        mediaUrl
        mediaType
        createdAt
      }
      updatedAt
    }
  }
`;

export default function HighlightsSection({ 
  profileData, 
  isOwnProfile, 
  className = "" 
}) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [newMemoryTitle, setNewMemoryTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // GraphQL operations
  const { data: memoriesData, loading, error, refetch } = useQuery(GET_MEMORIES, {
    variables: { profileid: profileData?.profileid },
    skip: !profileData?.profileid,
    errorPolicy: 'all'
  });

  const [createMemory] = useMutation(CREATE_MEMORY);
  const [addStoryToMemory] = useMutation(ADD_STORY_TO_MEMORY);

  const memories = memoriesData?.getMemories || [];

  // Handle viewing memory
  const handleViewMemory = (memory) => {
    setSelectedMemory(memory);
    setShowMemoryModal(true);
  };

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

  // Handle creating new memory/highlight
  const handleCreateMemory = useCallback(async (postUrl = null) => {
    if (!newMemoryTitle.trim() || !user?.profileid) return;

    setIsUploading(true);
    try {
      let coverImageUrl = null;
      
      if (selectedFile) {
        coverImageUrl = await uploadFile(selectedFile);
      }

      const finalCoverImage = coverImageUrl || null;
      
      await createMemory({
        variables: {
          profileid: user.profileid,
          title: newMemoryTitle.trim(),
          coverImage: finalCoverImage,
          postUrl: postUrl || null // Can be linked to a specific post
        }
      });

      setNewMemoryTitle('');
      setSelectedFile(null);
      setShowCreateForm(false);
      refetch();
    } catch (error) {
      console.error('❌ Full error creating memory:', {
        error: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
        variables: {
          profileid: user.profileid,
          title: newMemoryTitle.trim(),
          coverImage: coverImageUrl,
          postUrl: postUrl
        }
      });
      
      const errorMessage = error.graphQLErrors?.[0]?.message || error.networkError?.message || error.message || 'Unknown error';
      alert(`Error creating highlight: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  }, [newMemoryTitle, selectedFile, user, createMemory, refetch]);
  
  // Create memory from a post
  const createMemoryFromPost = useCallback(async (postUrl, postTitle) => {
    if (!user?.profileid) return;
    
    const title = prompt('Enter memory title:', postTitle || 'New Memory');
    if (!title?.trim()) return;
    
    setIsUploading(true);
    try {
      await createMemory({
        variables: {
          profileid: user.profileid,
          title: title.trim(),
          coverImage: postUrl || null, // Use post media as cover if present
          postUrl: postUrl || null
        }
      });
      
      refetch();
      alert('Memory created from post successfully!');
    } catch (error) {
      console.error('Error creating memory from post:', error);
      alert('Error creating memory from post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [user, createMemory, refetch]);

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

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-3 py-3 overflow-x-auto scrollbar-hide">
        {/* Add New Highlight (only for own profile) */}
        {isOwnProfile && (
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowCreateForm(true)}
              className={`w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center transition-colors ${
                theme === 'dark'
                  ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <p className={`text-xs text-center mt-1 max-w-[56px] truncate ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              New
            </p>
          </div>
        )}

        {/* Existing Highlights */}
        {memories.map((memory) => (
          <HighlightItem
            key={memory.memoryid}
            memory={memory}
            onAddStory={handleAddStory}
            onViewMemory={handleViewMemory}
            theme={theme}
            isUploading={isUploading}
            isOwnProfile={isOwnProfile}
          />
        ))}
      </div>

      {/* Create Highlight Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCreateForm(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md mx-4 p-6 rounded-2xl ${
                theme === 'dark'
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <h2 className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                New Highlight
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={newMemoryTitle}
                    onChange={(e) => setNewMemoryTitle(e.target.value)}
                    placeholder="Highlight title"
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 ${
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
                    Cover (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button
                    onClick={handleCreateMemory}
                    disabled={!newMemoryTitle.trim() || isUploading}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      newMemoryTitle.trim() && !isUploading
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isUploading ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewMemoryTitle('');
                      setSelectedFile(null);
                    }}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory Viewer Modal */}
      <AnimatePresence>
        {showMemoryModal && selectedMemory && (
          <MemoryViewModal
            memory={selectedMemory}
            onClose={() => {
              setShowMemoryModal(false);
              setSelectedMemory(null);
            }}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Memory Viewer Modal Component
function MemoryViewModal({ memory, onClose, theme }) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const stories = memory.stories || [];
  const currentStory = stories[currentStoryIndex];

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  if (stories.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div className={`p-8 rounded-lg max-w-md mx-4 text-center ${
          theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          <h3 className="text-lg font-semibold mb-2">{memory.title}</h3>
          <p className="text-gray-500 mb-4">No stories in this highlight yet</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
    >
      {/* Story Content */}
      <div className="relative w-full h-full max-w-md mx-auto">
        {/* Progress bars */}
        <div className="absolute top-4 left-4 right-4 z-10 flex space-x-1">
          {stories.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-1 rounded ${
                index <= currentStoryIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
        >
          ×
        </button>

        {/* Story header */}
        <div className="absolute top-16 left-4 right-4 z-10 text-white">
          <h3 className="font-semibold">{memory.title}</h3>
          <p className="text-sm opacity-70">
            {currentStoryIndex + 1} of {stories.length}
          </p>
        </div>

        {/* Story media */}
        <div className="w-full h-full flex items-center justify-center bg-black">
          {currentStory && (
            currentStory.mediaType === 'VIDEO' ? (
              <video
                src={currentStory.mediaUrl}
                className="w-full h-full object-contain"
                autoPlay
                loop
                muted
                onError={(e) => {
                  console.error('Video failed to load:', currentStory.mediaUrl);
                }}
              />
            ) : (
              <img
                src={currentStory.mediaUrl}
                alt="Story"
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Image failed to load:', currentStory.mediaUrl);
                }}
              />
            )
          )}
        </div>

        {/* Navigation */}
        <button
          onClick={prevStory}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/30 rounded-full flex items-center justify-center text-white text-xl"
          style={{ display: currentStoryIndex > 0 ? 'flex' : 'none' }}
        >
          ‹
        </button>
        <button
          onClick={nextStory}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/30 rounded-full flex items-center justify-center text-white text-xl"
        >
          {currentStoryIndex < stories.length - 1 ? '›' : '✓'}
        </button>
      </div>
    </motion.div>
  );
}

// Individual Highlight Item Component
function HighlightItem({ memory, onAddStory, onViewMemory, theme, isUploading, isOwnProfile }) {
  const [showStoryUpload, setShowStoryUpload] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onAddStory(memory.memoryid, file);
      setShowStoryUpload(false);
    }
  };

  return (
    <div className="flex-shrink-0 relative group">
      <div
        className={`w-14 h-14 rounded-full overflow-hidden cursor-pointer ring-2 ${
          theme === 'dark' ? 'ring-gray-600' : 'ring-gray-300'
        } hover:ring-gray-400 transition-all`}
        onClick={() => onViewMemory(memory)}
      >
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
            <svg className="w-6 h-6 text-white/70" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
            </svg>
          </div>
        )}
      </div>
      
      <p className={`text-xs text-center mt-1 truncate w-14 ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {memory.title}
      </p>
      {memory.postUrl && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
          <div className="w-1 h-1 bg-white rounded-full"></div>
        </div>
      )}

      {/* Add Story Button - Only for own profile */}
      {isOwnProfile && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowStoryUpload(true);
          }}
          disabled={isUploading}
          className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Hidden file input for adding stories */}
      {showStoryUpload && (
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
