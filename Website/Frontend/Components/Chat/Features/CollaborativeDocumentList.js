import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Search, Filter, Users, Clock, Edit3 } from 'lucide-react';
import CollaborativeEditingService from '../../services/CollaborativeEditingService';
import CollaborativeDocumentEditor from './CollaborativeDocumentEditor';

const CollaborativeDocumentList = ({ chatId, userId, onClose }) => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [creatingDocument, setCreatingDocument] = useState(false);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [chatId]);

  // Filter and sort documents
  useEffect(() => {
    let result = [...documents];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.content.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      // Handle date sorting
      if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredDocuments(result);
  }, [documents, searchQuery, sortBy, sortOrder]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await CollaborativeEditingService.getDocumentsByChat(chatId);
      setDocuments(docs);
    } catch (error) {
      setError(error.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    setCreatingDocument(true);
    setShowEditor(true);
    setSelectedDocument(null);
  };

  const handleDocumentCreated = (doc) => {
    setDocuments(prev => [doc, ...prev]);
    setCreatingDocument(false);
  };

  const handleDocumentSelect = (doc) => {
    setSelectedDocument(doc);
    setShowEditor(true);
  };

  const handleDocumentUpdate = (updatedDoc) => {
    setDocuments(prev => 
      prev.map(doc => doc.docId === updatedDoc.docId ? updatedDoc : doc)
    );
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
        {error}
      </div>
    );
  }

  if (showEditor) {
    return (
      <CollaborativeDocumentEditor
        docId={selectedDocument?.docId || null}
        chatId={chatId}
        userId={userId}
        onClose={() => {
          setShowEditor(false);
          setSelectedDocument(null);
          loadDocuments(); // Refresh document list
        }}
        onDocumentCreated={handleDocumentCreated}
        initialTitle={creatingDocument ? 'Untitled Document' : selectedDocument?.title}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Collaborative Documents</h2>
          <button
            onClick={handleCreateDocument}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Document
          </button>
        </div>
        
        {/* Search and filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="updatedAt">Last Modified</option>
            <option value="createdAt">Created Date</option>
            <option value="title">Title</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex items-center"
          >
            <Filter className="w-4 h-4 mr-1" />
            {sortOrder === 'asc' ? 'ASC' : 'DESC'}
          </button>
        </div>
      </div>
      
      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No documents</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new collaborative document.
            </p>
            <div className="mt-6">
              <button
                onClick={handleCreateDocument}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none"
              >
                <Plus className="mr-2 -ml-1 h-5 w-5" />
                New Document
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <motion.div
                key={doc.docId}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800"
                whileHover={{ y: -2 }}
                onClick={() => handleDocumentSelect(doc)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                        {doc.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {doc.content.substring(0, 100)}{doc.content.length > 100 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    <span>{doc.collaborators?.length || 1}</span>
                  </div>
                  <div className="flex items-center">
                    <Edit3 className="w-3 h-3 mr-1" />
                    <span>v{doc.version || 1}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{formatDate(doc.updatedAt)}</span>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center">
                  <div className="flex -space-x-2">
                    {doc.collaborators?.slice(0, 3).map((collaborator, index) => (
                      <div 
                        key={index} 
                        className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs border-2 border-white dark:border-gray-800"
                      >
                        {collaborator.userId.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {doc.collaborators?.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white text-xs text-gray-700 dark:text-gray-300 border-2 border-white dark:border-gray-800">
                        +{doc.collaborators.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default CollaborativeDocumentList;