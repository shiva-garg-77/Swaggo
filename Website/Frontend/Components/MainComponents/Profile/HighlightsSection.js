"use client";

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTheme } from '../../Helper/ThemeProvider';
import { useSecureAuth } from '../../../context/FixedSecureAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { gql } from '@apollo/client';

// Define queries for highlights
const GET_HIGHLIGHTS = gql`
  query GetHighlights($profileid: String!) {
    getHighlights(profileid: $profileid) {
      highlightid
      title
      coverImage
      storyCount
      category
      createdAt
      stories {
        storyid
        mediaUrl
        mediaType
        caption
        originalStoryDate
        addedToHighlightAt
      }
    }
  }
`;

const GET_ACTIVE_STORIES = gql`
  query GetActiveStories {
    getActiveStories {
      storyid
      profileid
      mediaUrl
      mediaType
      caption
      savedToHighlights
      expiresAt
      createdAt
    }
  }
`;

const CREATE_HIGHLIGHT = gql`
  mutation CreateHighlight($profileid: String!, $title: String!, $coverImage: String, $category: String) {
    CreateHighlight(profileid: $profileid, title: $title, coverImage: $coverImage, category: $category) {
      highlightid
      title
      coverImage
      category
      storyCount
      createdAt
    }
  }
`;

const ADD_STORY_TO_HIGHLIGHT = gql`
  mutation AddStoryToHighlight($highlightid: String!, $storyid: String!) {
    AddStoryToHighlight(highlightid: $highlightid, storyid: $storyid) {
      highlightid
      title
      coverImage
      storyCount
      stories {
        storyid
        mediaUrl
        mediaType
        caption
        originalStoryDate
        addedToHighlightAt
      }
    }
  }
`;

export default function HighlightsSection({ 
  profileData, 
  isOwnProfile, 
  className = "" 
}) {
  const { theme } = useTheme();
  const { user } = useSecureAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [newHighlightTitle, setNewHighlightTitle] = useState('');
  const [newHighlightCategory, setNewHighlightCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showStorySelector, setShowStorySelector] = useState(false);
  const [availableStories, setAvailableStories] = useState([]);

  // GraphQL operations
  const { data: highlightsData, loading, error, refetch } = useQuery(GET_HIGHLIGHTS, {
    variables: { profileid: profileData?.profileid },
    skip: !profileData?.profileid,
    errorPolicy: 'all'
  });

  // Query for active stories (for story-to-highlight conversion)
  const { data: storiesData } = useQuery(GET_ACTIVE_STORIES, {
    skip: !isOwnProfile,
    errorPolicy: 'all'
  });

  const [createHighlight] = useMutation(CREATE_HIGHLIGHT);
  const [addStoryToHighlight] = useMutation(ADD_STORY_TO_HIGHLIGHT);

  const highlights = highlightsData?.getHighlights || [];
  const userStories = storiesData?.getActiveStories?.filter(story => 
    story.profileid === profileData?.profileid && !story.savedToHighlights
  ) || [];

  // Handle viewing highlight
  const handleViewHighlight = (highlight) => {
    setSelectedHighlight(highlight);
    setShowHighlightModal(true);
  };

  // Handle creating highlight from story
  const handleCreateFromStory = () => {
    if (userStories.length > 0) {
      setAvailableStories(userStories);
      setShowStorySelector(true);
    } else {
      setShowCreateForm(true);
    }
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

  // Handle creating new highlight
  const handleCreateHighlight = useCallback(async (selectedStory = null) => {
    if (!newHighlightTitle.trim() || !user?.profileid) return;

    setIsUploading(true);
    try {
      let coverImageUrl = null;
      
      if (selectedFile) {
        coverImageUrl = await uploadFile(selectedFile);
      } else if (selectedStory) {
        coverImageUrl = selectedStory.mediaUrl;
      }

      const newHighlight = await createHighlight({
        variables: {
          profileid: user.profileid,
          title: newHighlightTitle.trim(),
          coverImage: coverImageUrl || null,
          category: newHighlightCategory.trim() || null
        }
      });

      // If creating from a story, add the story to the highlight
      if (selectedStory) {
        await addStoryToHighlight({
          variables: {
            highlightid: newHighlight.data.CreateHighlight.highlightid,
            storyid: selectedStory.storyid
          }
        });
      }

      setNewHighlightTitle('');
      setNewHighlightCategory('');
      setSelectedFile(null);
      setShowCreateForm(false);
      setShowStorySelector(false);
      refetch();
      
      alert('✅ Highlight created successfully!');
    } catch (error) {
      console.error('❌ Error creating highlight:', error);
      const errorMessage = error.graphQLErrors?.[0]?.message || error.networkError?.message || error.message || 'Unknown error';
      alert(`Error creating highlight: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  }, [newHighlightTitle, newHighlightCategory, selectedFile, user, createHighlight, addStoryToHighlight, refetch]);
  

  // Handle adding story to existing highlight
  const handleAddStoryToHighlight = useCallback(async (highlightId, file = null, story = null) => {
    if ((!file && !story) || !user?.profileid) return;

    setIsUploading(true);
    try {
      let storyId;
      
      if (story) {
        // Adding existing story to highlight
        storyId = story.storyid;
      } else if (file) {
        // This would require creating a story first, then adding to highlight
        // For now, we'll focus on adding existing stories
        throw new Error('Creating new story and adding to highlight not implemented yet');
      }

      await addStoryToHighlight({
        variables: {
          highlightid: highlightId,
          storyid: storyId
        }
      });

      refetch();
      alert('✅ Story added to highlight!');
    } catch (error) {
      console.error('Error adding story to highlight:', error);
      alert('Error adding story. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [user, addStoryToHighlight, refetch]);

  return (
    <div className={`${className} relative`}>
      {/* Scroll Indicators (Issue 6.8) */}
      <div className="relative">
        {highlights.length > 5 && (
          <>
            <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r pointer-events-none z-10 ${
              theme === 'dark' ? 'from-gray-900' : 'from-white'
            }`} />
            <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l pointer-events-none z-10 ${
              theme === 'dark' ? 'from-gray-900' : 'from-white'
            }`} />
          </>
        )}
        <div className="flex items-center space-x-3 py-3 overflow-x-auto scrollbar-hide">
        {/* Add New Highlight (only for own profile) */}
        {isOwnProfile && (
          <div className="flex-shrink-0">
            <button
              onClick={handleCreateFromStory}
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

        {/* Show unsaved stories indicator */}
        {isOwnProfile && userStories.length > 0 && (
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowStorySelector(true)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors relative ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              }`}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {userStories.length}
              </div>
            </button>
            <p className={`text-xs text-center mt-1 max-w-[56px] truncate ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Stories
            </p>
          </div>
        )}

        {/* Existing Highlights */}
        {highlights.map((highlight) => (
          <HighlightItem
            key={highlight.highlightid}
            highlight={highlight}
            onAddStory={handleAddStoryToHighlight}
            onViewHighlight={handleViewHighlight}
            theme={theme}
            isUploading={isUploading}
            isOwnProfile={isOwnProfile}
            userStories={userStories}
          />
        ))}
        </div>
      </div>

      {/* Story Selector Modal */}
      <AnimatePresence>
        {showStorySelector && userStories.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowStorySelector(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md mx-4 p-6 rounded-2xl max-h-[80vh] overflow-y-auto ${
                theme === 'dark'
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Save Stories to Highlight
                </h2>
                <button
                  onClick={() => setShowStorySelector(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  You have {userStories.length} unsaved stories that will expire soon. Save them to highlights!
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {userStories.map((story) => {
                    const timeLeft = new Date(story.expiresAt) - new Date();
                    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                    
                    return (
                      <div
                        key={story.storyid}
                        className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                          theme === 'dark'
                            ? 'border-gray-600 hover:border-red-500'
                            : 'border-gray-200 hover:border-red-500'
                        }`}
                        onClick={() => {
                          setShowStorySelector(false);
                          setShowCreateForm(true);
                          // Pre-select this story for highlight creation
                          setNewHighlightTitle(`Highlight ${new Date().toLocaleDateString()}`);
                        }}
                      >
                        {story.mediaType === 'video' ? (
                          <video
                            src={story.mediaUrl}
                            className="w-full h-24 object-cover"
                            muted
                          />
                        ) : (
                          <img
                            src={story.mediaUrl}
                            alt="Story"
                            className="w-full h-24 object-cover"
                          />
                        )}
                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                          {hoursLeft}h left
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex-1 py-2 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    Create New Highlight
                  </button>
                  <button
                    onClick={() => setShowStorySelector(false)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    value={newHighlightTitle}
                    onChange={(e) => setNewHighlightTitle(e.target.value)}
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
                    Category (optional)
                  </label>
                  <input
                    type="text"
                    value={newHighlightCategory}
                    onChange={(e) => setNewHighlightCategory(e.target.value)}
                    placeholder="e.g., Travel, Food, Friends"
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
                    onClick={() => handleCreateHighlight()}
                    disabled={!newHighlightTitle.trim() || isUploading}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      newHighlightTitle.trim() && !isUploading
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isUploading ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewHighlightTitle('');
                      setNewHighlightCategory('');
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

      {/* Highlight Viewer Modal */}
      <AnimatePresence>
        {showHighlightModal && selectedHighlight && (
          <HighlightViewModal
            highlight={selectedHighlight}
            onClose={() => {
              setShowHighlightModal(false);
              setSelectedHighlight(null);
            }}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Highlight Viewer Modal Component
function HighlightViewModal({ highlight, onClose, theme }) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const stories = highlight.stories || [];
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
          <h3 className="text-lg font-semibold mb-2">{highlight.title}</h3>
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
          <h3 className="font-semibold">{highlight.title}</h3>
          <p className="text-sm opacity-70">
            {currentStoryIndex + 1} of {stories.length}
          </p>
          {highlight.category && (
            <p className="text-xs opacity-50">{highlight.category}</p>
          )}
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
function HighlightItem({ highlight, onAddStory, onViewHighlight, theme, isUploading, isOwnProfile, userStories }) {
  const [showStorySelector, setShowStorySelector] = useState(false);

  const handleAddStoryFromActive = (story) => {
    onAddStory(highlight.highlightid, null, story);
    setShowStorySelector(false);
  };

  return (
    <div className="flex-shrink-0 relative group">
      <div
        className={`w-14 h-14 rounded-full overflow-hidden cursor-pointer ring-2 ${
          theme === 'dark' ? 'ring-gray-600' : 'ring-gray-300'
        } hover:ring-gray-400 transition-all`}
        onClick={() => onViewHighlight(highlight)}
      >
        {highlight.coverImage ? (
          <img
            src={highlight.coverImage}
            alt={highlight.title}
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
        {highlight.title}
      </p>
      
      {/* Show story count */}
      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {highlight.storyCount || 0}
      </div>

      {/* Add Story Button - Only for own profile */}
      {isOwnProfile && userStories && userStories.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowStorySelector(true);
          }}
          disabled={isUploading}
          className="absolute bottom-6 -right-1 w-5 h-5 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs"
          title={`Add from ${userStories.length} active stories`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Story Selector Popup */}
      {showStorySelector && userStories && userStories.length > 0 && (
        <div className="absolute top-16 left-0 z-20 p-2 rounded-lg shadow-lg max-w-xs" style={{
          backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
          border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`
        }}>
          <p className={`text-xs mb-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Select story to add:
          </p>
          <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
            {userStories.map((story) => (
              <div
                key={story.storyid}
                className="relative cursor-pointer rounded overflow-hidden hover:opacity-80"
                onClick={() => handleAddStoryFromActive(story)}
              >
                {story.mediaType === 'video' ? (
                  <video
                    src={story.mediaUrl}
                    className="w-full h-12 object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={story.mediaUrl}
                    alt="Story"
                    className="w-full h-12 object-cover"
                  />
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowStorySelector(false)}
            className={`mt-2 text-xs px-2 py-1 rounded ${
              theme === 'dark'
                ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
