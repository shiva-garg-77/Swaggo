import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Users, History, Lock, Unlock, Plus, UserPlus, Settings } from 'lucide-react';
import CollaborativeEditingService from '../../services/CollaborativeEditingService';
import { useSocket } from '../../Components/Helper/PerfectSocketProvider';

const CollaborativeDocumentEditor = ({ 
  docId, 
  chatId, 
  userId, 
  onClose, 
  onDocumentCreated,
  initialTitle = 'Untitled Document'
}) => {
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState(initialTitle);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState(null);
  const [pendingChanges, setPendingChanges] = useState([]);
  
  const textareaRef = useRef(null);
  const lastContentRef = useRef('');
  const socket = useSocket();

  // Load document on mount
  useEffect(() => {
    if (docId) {
      loadDocument();
    } else {
      // Create new document
      createNewDocument();
    }
  }, [docId]);

  // Set up socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleDocumentUpdated = (data) => {
      if (data.docId === docId) {
        setContent(data.content);
        setDocument(prev => ({
          ...prev,
          content: data.content,
          version: data.version,
          metadata: data.metadata
        }));
        
        // Update active users
        if (data.activeUsers) {
          setActiveUsers(data.activeUsers);
        }
      }
    };

    const handleUserJoined = (data) => {
      if (data.docId === docId) {
        setActiveUsers(prev => [...new Set([...prev, data.userId])]);
      }
    };

    const handleUserLeft = (data) => {
      if (data.docId === docId) {
        setActiveUsers(prev => prev.filter(id => id !== data.userId));
      }
    };

    const handleDocumentLocked = (data) => {
      if (data.docId === docId) {
        setIsLocked(true);
        setLockedBy(data.userId);
      }
    };

    const handleDocumentUnlocked = (data) => {
      if (data.docId === docId) {
        setIsLocked(false);
        setLockedBy(null);
      }
    };

    socket.on('document_updated', handleDocumentUpdated);
    socket.on('user_joined_editing', handleUserJoined);
    socket.on('user_left_editing', handleUserLeft);
    socket.on('document_locked', handleDocumentLocked);
    socket.on('document_unlocked', handleDocumentUnlocked);

    // Join editing session
    if (docId && socket.connected) {
      socket.emit('join_document_session', { docId, userId });
    }

    return () => {
      socket.off('document_updated', handleDocumentUpdated);
      socket.off('user_joined_editing', handleUserJoined);
      socket.off('user_left_editing', handleUserLeft);
      socket.off('document_locked', handleDocumentLocked);
      socket.off('document_unlocked', handleDocumentUnlocked);
      
      // Leave editing session
      if (docId && socket.connected) {
        socket.emit('leave_document_session', { docId, userId });
      }
    };
  }, [socket, docId, userId]);

  // Track content changes for real-time collaboration
  useEffect(() => {
    if (!document) return;

    const handleChange = () => {
      if (!textareaRef.current) return;
      
      const newContent = textareaRef.current.value;
      const oldContent = lastContentRef.current;
      
      if (newContent !== oldContent) {
        // Calculate changes
        const changes = calculateChanges(oldContent, newContent);
        if (changes.length > 0) {
          setPendingChanges(changes);
          sendChanges(changes);
        }
        
        lastContentRef.current = newContent;
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('input', handleChange);
      return () => textarea.removeEventListener('input', handleChange);
    }
  }, [document]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const doc = await CollaborativeEditingService.getDocument(docId);
      setDocument(doc);
      setContent(doc.content);
      setTitle(doc.title);
      lastContentRef.current = doc.content;
      
      // Load history
      const historyData = await CollaborativeEditingService.getDocumentHistory(docId);
      setHistory(historyData);
    } catch (error) {
      setError(error.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const createNewDocument = async () => {
    try {
      setLoading(true);
      const docData = {
        title: initialTitle,
        content: '',
        chatId,
        createdBy: userId
      };
      
      const doc = await CollaborativeEditingService.createDocument(docData);
      setDocument(doc);
      setContent(doc.content);
      setTitle(doc.title);
      lastContentRef.current = doc.content;
      
      // Notify parent
      if (onDocumentCreated) {
        onDocumentCreated(doc);
      }
    } catch (error) {
      setError(error.message || 'Failed to create document');
    } finally {
      setLoading(false);
    }
  };

  const calculateChanges = (oldContent, newContent) => {
    // Simple diff algorithm - in a real implementation, you'd use a more sophisticated approach
    const changes = [];
    
    // For simplicity, we'll just send the entire content as a change
    // A real implementation would calculate the actual diff
    if (oldContent !== newContent) {
      changes.push({
        type: 'insert',
        position: 0,
        text: newContent,
        length: newContent.length
      });
    }
    
    return changes;
  };

  const sendChanges = async (changes) => {
    if (!docId || changes.length === 0) return;
    
    try {
      // Send changes via socket for real-time updates
      if (socket && socket.connected) {
        socket.emit('document_change', {
          docId,
          changes,
          userId
        });
      }
      
      // Also send to backend for persistence
      await CollaborativeEditingService.applyChanges(docId, changes);
    } catch (error) {
      console.error('Error sending changes:', error);
      setError('Failed to save changes');
    }
  };

  const handleSave = async () => {
    if (!document || saving) return;
    
    setSaving(true);
    setError('');
    
    try {
      // Update document title if changed
      if (document.title !== title && title.trim()) {
        const updatedDoc = await CollaborativeEditingService.updateDocument(docId, {
          title: title.trim()
        });
        setDocument(updatedDoc);
      }
      
      console.log('Document saved successfully');
    } catch (error) {
      setError(error.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCollaborator = async () => {
    // In a real implementation, this would open a modal to add collaborators
    console.log('Add collaborator functionality would go here');
  };

  const loadHistory = async () => {
    try {
      const historyData = await CollaborativeEditingService.getDocumentHistory(docId);
      setHistory(historyData);
      setShowHistory(true);
    } catch (error) {
      setError(error.message || 'Failed to load history');
    }
  };

  const revertToVersion = async (version) => {
    try {
      const updatedDoc = await CollaborativeEditingService.revertToVersion(docId, version);
      setDocument(updatedDoc);
      setContent(updatedDoc.content);
      lastContentRef.current = updatedDoc.content;
      setShowHistory(false);
    } catch (error) {
      setError(error.message || 'Failed to revert to version');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-center text-gray-600 dark:text-gray-400">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl max-w-md w-full mx-4">
          <div className="text-red-500 text-center">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold mt-4 text-gray-900 dark:text-white">Error</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={onClose}
              className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 dark:text-white"
              placeholder="Document title"
            />
            {isLocked && (
              <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                <Lock className="w-4 h-4 mr-1" />
                <span className="text-sm">Locked</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Active users */}
            <div className="flex items-center">
              <Users className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
              <span className="text-sm text-gray-500 dark:text-gray-400">{activeUsers.length}</span>
            </div>
            
            {/* Action buttons */}
            <button
              onClick={handleAddCollaborator}
              className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
              title="Add collaborators"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            
            <button
              onClick={loadHistory}
              className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
              title="View history"
            >
              <History className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 disabled:opacity-50"
              title="Save"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
            </button>
            
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Main editor */}
          <div className="flex-1 flex flex-col">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 p-6 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-none focus:outline-none resize-none"
              placeholder="Start writing your document..."
              disabled={isLocked && lockedBy !== userId}
            />
            
            {/* Status bar */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
              <div>
                {document && (
                  <span>
                    Words: {document.metadata?.wordCount || 0} • 
                    Characters: {document.metadata?.characterCount || 0} •
                    Version: {document.version || 1}
                  </span>
                )}
              </div>
              <div>
                {isLocked && lockedBy !== userId && (
                  <span className="text-yellow-600 dark:text-yellow-400">
                    Locked by another user
                  </span>
                )}
                {pendingChanges.length > 0 && (
                  <span className="text-blue-500">Saving...</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <AnimatePresence>
            {showCollaborators && (
              <motion.div 
                className="w-64 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 256, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Collaborators</h3>
                    <button 
                      onClick={() => setShowCollaborators(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {document?.collaborators?.map((collaborator) => (
                      <div key={collaborator.userId} className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                          {collaborator.userId.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            User {collaborator.userId}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {collaborator.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button className="w-full mt-4 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center">
                    <Plus className="w-4 h-4 mr-1" />
                    Add People
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Document History</h3>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {history.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No history available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                              {entry.userId.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              User {entry.userId}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {entry.changes.length} change{entry.changes.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => revertToVersion(index + 1)}
                          className="mt-3 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          Revert to this version
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CollaborativeDocumentEditor;