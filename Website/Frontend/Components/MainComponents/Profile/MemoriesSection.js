"use client";

import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTheme } from '../../Helper/ThemeProvider';
import { useAuth } from '../../Helper/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { gql } from '@apollo/client';
import MemoryViewer from './MemoryViewer';

// Simple memory queries (using your existing backend structure)
const GET_MEMORIES = gql`
  query GetMemories($profileid: String!) {
    getMemories(profileid: $profileid) {
      memoryid
      title
      coverImage
      stories {
        storyid
        mediaUrl
        mediaType
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

const CREATE_MEMORY = gql`
  mutation CreateMemory($profileid: String!, $title: String!, $coverImage: String!) {
    CreateMemory(profileid: $profileid, title: $title, coverImage: $coverImage) {
      memoryid
      title
      coverImage
      createdAt
    }
  }
`;

const ADD_STORY_TO_MEMORY = gql`
  mutation AddStoryToMemory($memoryid: String!, $mediaUrl: String!, $mediaType: String!) {
    AddStoryToMemory(memoryid: $memoryid, mediaUrl: $mediaUrl, mediaType: $mediaType) {
      memoryid
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

export default function MemoriesSection({ profileid, isCurrentUser = false }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMemoryTitle, setNewMemoryTitle] = useState('');
  const [newMemoryCover, setNewMemoryCover] = useState('');
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [showMemoryViewer, setShowMemoryViewer] = useState(false);

  // GraphQL queries and mutations
  const { data, loading, error, refetch } = useQuery(GET_MEMORIES, {
    variables: { profileid },
    skip: !profileid
  });

  const [createMemory] = useMutation(CREATE_MEMORY);
  const [addStoryToMemory] = useMutation(ADD_STORY_TO_MEMORY);

  const memories = data?.getMemories || [];

  // Handle create memory
  const handleCreateMemory = useCallback(async () => {
    if (!newMemoryTitle.trim() || !user?.profileid) return;

    try {
      await createMemory({
        variables: {
          profileid: user.profileid,
          title: newMemoryTitle.trim(),
          coverImage: newMemoryCover || 'https://picsum.photos/200/200?random=' + Date.now()
        }
      });

      setNewMemoryTitle('');
      setNewMemoryCover('');
      setShowCreateModal(false);
      refetch();
    } catch (error) {
      console.error('Error creating memory:', error);
      alert('Failed to create memory. Please try again.');
    }
  }, [newMemoryTitle, newMemoryCover, user, createMemory, refetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-6 w-6 border-b-2 border-red-500"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Memories
        </h3>
        {isCurrentUser && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
          >
            + Add Memory
          </motion.button>
        )}
      </div>

      {/* Memories Grid */}
      {memories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {memories.map((memory) => (
              <MemoryCard
                key={memory.memoryid}
                memory={memory}
                theme={theme}
                onAddStory={isCurrentUser ? addStoryToMemory : null}
                onRefresh={refetch}
                onOpen={() => {
                  setSelectedMemory(memory);
                  setShowMemoryViewer(true);
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center py-12 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z" />
            </svg>
          </div>
          <p className="text-lg mb-2">No memories yet</p>
          <p className="text-sm">
            {isCurrentUser ? 'Create your first memory to get started!' : 'No memories to display'}
          </p>
        </motion.div>
      )}

      {/* Create Memory Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-md mx-4 rounded-2xl p-6 ${
                theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Create New Memory
              </h3>
              
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
                    placeholder="Enter memory title..."
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Cover Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={newMemoryCover}
                    onChange={(e) => setNewMemoryCover(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateMemory}
                  disabled={!newMemoryTitle.trim()}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    newMemoryTitle.trim()
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Create Memory
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory Viewer Modal */}
      <MemoryViewer
        memory={selectedMemory}
        isOpen={showMemoryViewer}
        onClose={() => {
          setShowMemoryViewer(false);
          setSelectedMemory(null);
        }}
        isCurrentUser={isCurrentUser}
        onAddStory={isCurrentUser ? addStoryToMemory : null}
        onRefresh={refetch}
      />
    </div>
  );
}

// Memory Card Component
function MemoryCard({ memory, theme, onAddStory, onRefresh, onOpen }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-lg ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={onOpen}
      >
        <img
          src={memory.coverImage || `https://picsum.photos/200/200?random=${memory.memoryid}`}
          alt={memory.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = `https://picsum.photos/200/200?random=${memory.memoryid}`;
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
            {memory.title}
          </h4>
          <p className="text-white/80 text-xs">
            {memory.stories?.length || 0} {memory.stories?.length === 1 ? 'story' : 'stories'}
          </p>
        </div>
        
        <div className="absolute top-2 right-2">
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
            <span className="text-white text-xs font-medium">
              {new Date(memory.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
