import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import fileUploadService, { FILE_TYPES } from '../../services/FileUploadService';
import fileSystemManager from '../../services/FileSystemManager';
import apiService from '../../services/ApiService';
import { formatFileSize } from './MediaUtils';
import { Search, Upload, Folder, File, Image, Video, Music, Archive, Filter, Grid, List, Cloud, Tag, Download, Share2, Trash2, Eye, EyeOff, Lock, Globe, Users, Clock, SortAsc, SortDesc } from 'lucide-react';

const FileSharingHub = ({ userId, onClose, onFileSelect }) => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortConfig, setSortConfig] = useState({ key: 'uploadedAt', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'shared', 'starred'
  const [cloudProviders, setCloudProviders] = useState([
    { id: 'local', name: 'Local Storage', connected: true, icon: <Folder className="w-5 h-5" /> },
    { id: 'google', name: 'Google Drive', connected: false, icon: <Cloud className="w-5 h-5" /> },
    { id: 'dropbox', name: 'Dropbox', connected: false, icon: <Cloud className="w-5 h-5" /> },
    { id: 'onedrive', name: 'OneDrive', connected: false, icon: <Cloud className="w-5 h-5" /> }
  ]);

  // Fetch user files on component mount
  useEffect(() => {
    fetchUserFiles();
    fetchTags();
  }, []);

  // Apply filters and sorting when dependencies change
  useEffect(() => {
    applyFiltersAndSorting();
  }, [files, searchQuery, fileTypeFilter, tagFilter, sortConfig, activeTab]);

  const fetchUserFiles = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from the backend
      // For now, we'll use the file system manager
      const userFiles = fileSystemManager.listUserFiles(userId, {
        limit: 100,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      });
      
      // In a real implementation, we would also fetch from cloud providers
      // This is a mock implementation for demonstration
      const mockFiles = [
        {
          id: 'file1',
          name: 'Project_Report.pdf',
          size: 2457600,
          mimeType: 'application/pdf',
          fileType: 'document',
          uploadedAt: Date.now() - 86400000,
          tags: ['work', 'important'],
          isPublic: false,
          accessCount: 12,
          lastAccessed: Date.now() - 3600000,
          cloudProvider: 'local'
        },
        {
          id: 'file2',
          name: 'Vacation_Photos.zip',
          size: 15728640,
          mimeType: 'application/zip',
          fileType: 'archive',
          uploadedAt: Date.now() - 172800000,
          tags: ['personal', 'vacation'],
          isPublic: false,
          accessCount: 8,
          lastAccessed: Date.now() - 86400000,
          cloudProvider: 'local'
        },
        {
          id: 'file3',
          name: 'Presentation.pptx',
          size: 5242880,
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          fileType: 'document',
          uploadedAt: Date.now() - 259200000,
          tags: ['work', 'presentation'],
          isPublic: true,
          accessCount: 24,
          lastAccessed: Date.now() - 172800000,
          cloudProvider: 'google'
        }
      ];
      
      setFiles(mockFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    // In a real implementation, this would fetch tags from the backend
    const mockTags = ['work', 'personal', 'important', 'presentation', 'vacation', 'documents'];
    setTags(mockTags);
  };

  const applyFiltersAndSorting = useCallback(() => {
    let result = [...files];

    // Apply active tab filter
    if (activeTab === 'shared') {
      result = result.filter(file => file.isPublic);
    } else if (activeTab === 'starred') {
      result = result.filter(file => file.tags.includes('important'));
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(file => 
        file.name.toLowerCase().includes(query) ||
        file.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply file type filter
    if (fileTypeFilter !== 'all') {
      result = result.filter(file => file.fileType === fileTypeFilter);
    }

    // Apply tag filter
    if (tagFilter) {
      result = result.filter(file => file.tags.includes(tagFilter));
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredFiles(result);
  }, [files, searchQuery, fileTypeFilter, tagFilter, sortConfig, activeTab]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    try {
      const uploadPromises = files.map(file => {
        const uploadPromise = fileUploadService.uploadFile(file, {
          generateThumbnails: true,
          compressImages: true
        });
        
        // Track upload progress
        uploadPromise.then(upload => {
          setUploadingFiles(prev => prev.filter(u => u.id !== upload.id));
        }).catch(error => {
          setUploadingFiles(prev => prev.filter(u => u.id !== upload.id));
        });
        
        return uploadPromise;
      });
      
      // Add to uploading files list
      const uploads = files.map(file => ({
        id: `upload_${Date.now()}_${Math.random()}`,
        file: file,
        progress: 0,
        status: 'uploading'
      }));
      setUploadingFiles(prev => [...prev, ...uploads]);
      
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
      
      // Refresh file list
      fetchUserFiles();
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const handleFileDownload = async (file) => {
    try {
      // In a real implementation, this would download the file
      // For now, we'll just simulate the download
      console.log(`Downloading file: ${file.name}`);
      
      // Use the file system manager to download
      const result = await fileSystemManager.downloadFile(file.id, userId);
      if (result.success) {
        console.log('File downloaded successfully');
      } else {
        console.error('Error downloading file:', result.error);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleFileDelete = async (fileId) => {
    try {
      // In a real implementation, this would delete the file from storage
      // For now, we'll just remove it from the local state
      setFiles(prev => prev.filter(file => file.id !== fileId));
      setFilteredFiles(prev => prev.filter(file => file.id !== fileId));
      
      // Also delete from file system manager
      const result = await fileSystemManager.deleteFile(fileId, userId);
      if (result.success) {
        console.log('File deleted successfully');
      } else {
        console.error('Error deleting file:', result.error);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleFileSelect = (file) => {
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image': return <Image className="w-6 h-6" />;
      case 'video': return <Video className="w-6 h-6" />;
      case 'audio': return <Music className="w-6 h-6" />;
      case 'document': return <File className="w-6 h-6" />;
      case 'archive': return <Archive className="w-6 h-6" />;
      default: return <File className="w-6 h-6" />;
    }
  };

  const getFileTypeColor = (fileType) => {
    switch (fileType) {
      case 'image': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'video': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200';
      case 'audio': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200';
      case 'document': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'archive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">File Sharing Hub</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 flex">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All Files
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'shared'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('shared')}
          >
            Shared
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'starred'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('starred')}
          >
            Starred
          </button>
        </div>

        {/* Toolbar */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search files..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* File Type Filter */}
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="document">Documents</option>
            <option value="archive">Archives</option>
          </select>

          {/* Tag Filter */}
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="">All Tags</option>
            {tags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              className={`p-2 rounded-md ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              className={`p-2 rounded-md ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 shadow'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Upload Button */}
          <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
            <input
              type="file"
              className="hidden"
              multiple
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Cloud Providers */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Cloud Storage</h3>
          <div className="flex flex-wrap gap-2">
            {cloudProviders.map(provider => (
              <div
                key={provider.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  provider.connected
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {provider.icon}
                <span>{provider.name}</span>
                {provider.connected && (
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-auto p-4">
          {viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadingFiles.map(upload => (
                <div key={upload.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center justify-center h-16 mb-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{upload.file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(upload.file.size)}</p>
                </div>
              ))}
              {filteredFiles.map(file => (
                <motion.div
                  key={file.id}
                  className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                  whileHover={{ y: -2 }}
                  onClick={() => handleFileSelect(file)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    toggleFileSelection(file.id);
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${getFileTypeColor(file.fileType)}`}>
                      {getFileIcon(file.fileType)}
                    </div>
                    <div className="flex gap-1">
                      {file.isPublic ? (
                        <Globe className="w-4 h-4 text-green-500" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-500" />
                      )}
                      {file.tags.includes('important') && (
                        <Star className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</h3>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatDate(file.uploadedAt)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {file.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {file.tags.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs rounded-full">
                        +{file.tags.length - 2}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            // List View
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="rounded"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles(filteredFiles.map(f => f.id));
                          } else {
                            setSelectedFiles([]);
                          }
                        }}
                        checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                      />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Name
                        {sortConfig.key === 'name' && (
                          sortConfig.direction === 'asc' ? <SortAsc className="w-4 h-4 ml-1" /> : <SortDesc className="w-4 h-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('fileType')}
                    >
                      <div className="flex items-center">
                        Type
                        {sortConfig.key === 'fileType' && (
                          sortConfig.direction === 'asc' ? <SortAsc className="w-4 h-4 ml-1" /> : <SortDesc className="w-4 h-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('size')}
                    >
                      <div className="flex items-center">
                        Size
                        {sortConfig.key === 'size' && (
                          sortConfig.direction === 'asc' ? <SortAsc className="w-4 h-4 ml-1" /> : <SortDesc className="w-4 h-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('uploadedAt')}
                    >
                      <div className="flex items-center">
                        Uploaded
                        {sortConfig.key === 'uploadedAt' && (
                          sortConfig.direction === 'asc' ? <SortAsc className="w-4 h-4 ml-1" /> : <SortDesc className="w-4 h-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {uploadingFiles.map(upload => (
                    <tr key={upload.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{upload.file.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Uploading...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(upload.file.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        Now
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 text-xs rounded-full">
                            uploading
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredFiles.map(file => (
                    <tr 
                      key={file.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        selectedFiles.includes(file.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg mr-3 ${getFileTypeColor(file.fileType)}`}>
                            {getFileIcon(file.fileType)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {file.cloudProvider === 'local' ? 'Local' : file.cloudProvider}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white capitalize">{file.fileType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(file.uploadedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {file.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            onClick={() => handleFileDownload(file)}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button 
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            onClick={() => handleFileDelete(file.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredFiles.length === 0 && uploadingFiles.length === 0 && (
            <div className="text-center py-12">
              <Folder className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No files found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by uploading a new file.
              </p>
              <div className="mt-6">
                <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                  <Upload className="mr-2 -ml-1 h-5 w-5" />
                  Upload Files
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredFiles.length} files • {formatFileSize(filteredFiles.reduce((acc, file) => acc + file.size, 0))}
          </div>
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FileSharingHub;