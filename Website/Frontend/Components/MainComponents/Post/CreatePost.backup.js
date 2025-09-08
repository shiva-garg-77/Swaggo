"use client";

import { useState, useRef, useContext } from 'react';
import { useMutation } from '@apollo/client';
import { useTheme } from '../../Helper/ThemeProvider';
import { AuthContext } from '../../Helper/AuthProvider';
import { CREATE_POST_MUTATION } from '../../../lib/graphql/profileQueries';

export default function CreatePost() {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  
  // Multi-step state management
  const [currentStep, setCurrentStep] = useState(1); // 1: Select, 2: Edit, 3: Details
  const [showModal, setShowModal] = useState(false);
  
  // File handling states
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Edit states
  const [editedPreview, setEditedPreview] = useState(null);
  const [filter, setFilter] = useState('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  
  // Post details states
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState([]);
  const [taggedPeople, setTaggedPeople] = useState([]);
  const [allowComments, setAllowComments] = useState(true);
  const [hideLikeCount, setHideLikeCount] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [peopleInput, setPeopleInput] = useState('');
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  
  const [createPost] = useMutation(CREATE_POST_MUTATION, {
    onCompleted: (data) => {
      console.log('Post created successfully:', data);
      alert('🎉 Post shared successfully!');
      resetForm();
      setShowModal(false);
    },
    onError: (error) => {
      console.error('Error creating post:', error);
      setIsUploading(false);
      
      if (error.message.includes('User not logged in') || 
          error.message.includes('profile ID missing') ||
          error.graphQLErrors?.some(e => e.message.includes('not logged in'))) {
        alert('❌ Authentication failed. Please refresh the page and try logging in again.');
      } else {
        alert(`❌ Failed to create post: ${error.message}`);
      }
    }
  });

  // Helper functions
  const resetForm = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setFilePreview(null);
    setEditedPreview(null);
    setFileType(null);
    setTitle('');
    setCaption('');
    setLocation('');
    setTags([]);
    setTaggedPeople([]);
    setAllowComments(true);
    setHideLikeCount(false);
    setTagInput('');
    setPeopleInput('');
    setFilter('none');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setIsUploading(false);
  };
  
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const addTaggedPerson = () => {
    if (peopleInput.trim() && !taggedPeople.includes(peopleInput.trim())) {
      setTaggedPeople([...taggedPeople, peopleInput.trim()]);
      setPeopleInput('');
    }
  };
  
  const removeTaggedPerson = (personToRemove) => {
    setTaggedPeople(taggedPeople.filter(person => person !== personToRemove));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      alert('⚠️ Please select an image or video file');
      return;
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('⚠️ File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setFileType(isVideo ? 'VIDEO' : 'IMAGE');
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
    setEditedPreview(previewUrl); // Initialize edited preview
    
    // Auto-advance to edit step
    setCurrentStep(2);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Simulate file input event
      const event = { target: { files: [file] } };
      handleFileSelect(event);
    }
  };
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handlePost = async () => {
    if (!selectedFile) {
      alert('⚠️ Please select a file to upload');
      return;
    }
    
    if (!user) {
      alert('⚠️ Please log in to create posts.');
      return;
    }
    
    if (!user.profileid) {
      alert('⚠️ Profile ID not available. Please refresh the page and try again.');
      return;
    }

    setIsUploading(true);
    
    try {
      console.log('📤 Starting post upload...');
      
      // Upload file to server first
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      console.log('📏 Uploading file to server...');
      const uploadResponse = await fetch(`http://localhost:${process.env.NEXT_PUBLIC_PORT}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }
      
      const uploadData = await uploadResponse.json();
      const fileUrl = uploadData.fileUrl;
      console.log('✅ File uploaded successfully:', fileUrl);
      
      // Prepare post data
      const postData = {
        profileid: user.profileid,
        postUrl: fileUrl,
        title: title || null,
        Description: caption || null,
        postType: fileType,
        location: location || null,
        tags: tags.length > 0 ? tags : null,
        taggedPeople: taggedPeople.length > 0 ? taggedPeople : null,
        allowComments,
        hideLikeCount
      };
      
      console.log('📨 Creating post with data:', postData);
      
      // Create post with GraphQL mutation
      await createPost({
        variables: postData
      });
      
    } catch (error) {
      console.error('❌ Error uploading post:', error);
      alert('❌ Failed to create post. Please try again.');
      setIsUploading(false);
    }
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => {
    if (!isUploading) {
      resetForm();
      setShowModal(false);
    }
  };
  
  const getStepTitle = () => {
    switch(currentStep) {
      case 1: return 'Select Photo/Video';
      case 2: return 'Edit & Enhance';
      case 3: return 'Share Your Moment';
      default: return 'Create Post';
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto">
        {/* Create Post Card */}
        <div className={`rounded-lg p-8 text-center transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border`}>
          <div className="mb-6">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <CameraIcon className={`w-10 h-10 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
            <h2 className={`text-2xl font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Create New Post
            </h2>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Share your moments with the world
            </p>
          </div>
          
          <button
            onClick={openModal}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 hover:shadow-lg"
          >
            📷 Start Creating
          </button>
        </div>
      </div>

      {/* Post Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
            onClick={closeModal}
          />
          
          {/* Modal Content */}
          <div className={`relative w-full max-w-4xl max-h-[90vh] rounded-lg overflow-hidden shadow-2xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Create new post
              </h3>
              <div className="flex items-center space-x-2">
                {selectedFile && (
                  <button
                    onClick={handlePost}
                    disabled={isUploading}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      isUploading
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-lg'
                    }`}
                  >
                    {isUploading ? 'Posting...' : 'Share'}
                  </button>
                )}
                <button
                  onClick={closeModal}
                  disabled={isUploading}
                  className={`p-2 rounded-full transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
              {/* Media Section */}
              <div className="flex-1 flex items-center justify-center min-h-[400px] lg:min-h-[600px]">
                {!selectedFile ? (
                  // File Selection Area
                  <div className="text-center p-8">
                    <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <PhotoIcon className={`w-12 h-12 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    </div>
                    <h4 className={`text-xl font-medium mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Drag photos and videos here
                    </h4>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg"
                    >
                      Select from computer
                    </button>
                  </div>
                ) : (
                  // Media Preview
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    {fileType === 'VIDEO' ? (
                      <video
                        src={filePreview}
                        controls
                        className="max-w-full max-h-full object-contain"
                        onError={() => {
                          console.error('Video preview error');
                          alert('Error loading video preview');
                        }}
                      />
                    ) : (
                      <img
                        src={filePreview}
                        alt="Post preview"
                        className="max-w-full max-h-full object-contain"
                        onError={() => {
                          console.error('Image preview error');
                          alert('Error loading image preview');
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
              
              {/* Details Section */}
              {selectedFile && (
                <div className={`w-full lg:w-80 border-l p-6 ${
                  theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                }`}>
                  {/* User Info */}
                  <div className="flex items-center space-x-3 mb-6">
                    <img
                      src={user?.profilePic || '/default-profile.svg'}
                      alt={user?.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {user?.username}
                    </span>
                  </div>
                  
                  {/* Title Input */}
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Add a title..."
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      disabled={isUploading}
                    />
                  </div>
                  
                  {/* Caption Input */}
                  <div className="mb-6">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Caption
                    </label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Write a caption..."
                      rows={4}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 resize-none transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      disabled={isUploading}
                    />
                  </div>
                  
                  {/* Change File Button */}
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                      setFileType(null);
                      fileInputRef.current?.click();
                    }}
                    disabled={isUploading}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Change file
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Icon Components
function CameraIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PhotoIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function CloseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
