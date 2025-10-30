"use client";

import { useState, useEffect, useRef } from 'react';
import { useMutation, useLazyQuery, useQuery } from '@apollo/client/react';
import { useTheme } from '../../Helper/ThemeProvider';
import { useFixedSecureAuth } from '../../../context/FixedSecureAuthContext';
import { CREATE_POST_MUTATION, CREATE_DRAFT_MUTATION, UPDATE_DRAFT_MUTATION, SEARCH_USERS, GET_USER_BY_USERNAME } from '../../../lib/graphql/profileQueries';
// 🔒 SECURITY: Import connection state management for secure post operations
import connectionState from '../../../lib/ConnectionState.js';
import { saveDraft, loadDraft, clearDraft } from '../../../utils/storageUtils';

export default function CreatePostModal({ isOpen, onClose, theme: propTheme, onPostSuccess, draftData }) {
  const { theme: contextTheme } = useTheme();
  const theme = propTheme || contextTheme;
  const { user, isAuthenticated } = useFixedSecureAuth();
  
  // Get user profile data for profileid
  const { data: profileData, loading: profileLoading } = useQuery(GET_USER_BY_USERNAME, {
    variables: { username: user?.username },
    skip: !user?.username,
    fetchPolicy: 'cache-first'
  });
  
  // Get profileid from GraphQL profile data instead of frontend auth context
  
  // Multi-step state management
  const [currentStep, setCurrentStep] = useState(1); // 1: Select, 2: Edit, 3: Details
  
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
  
  // Hashtag suggestions (Issue 5.18)
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  
  const trendingHashtags = ['photography', 'travel', 'food', 'nature', 'art', 'fitness', 'fashion', 'music'];
  
  const handleHashtagInput = (value) => {
    setHashtagInput(value);
    if (value.startsWith('#') && value.length > 1) {
      const query = value.slice(1).toLowerCase();
      const suggestions = trendingHashtags.filter(tag => tag.includes(query));
      setHashtagSuggestions(suggestions);
      setShowHashtagSuggestions(suggestions.length > 0);
    } else {
      setShowHashtagSuggestions(false);
    }
  };
  
  const addHashtag = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setHashtagInput('');
    setShowHashtagSuggestions(false);
  };
  const [autoPlay, setAutoPlay] = useState(false);
  const [isCloseFriendOnly, setIsCloseFriendOnly] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [peopleInput, setPeopleInput] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  
  // 🔒 SECURITY: Register component with connection state manager
  useEffect(() => {
    const componentId = 'CreatePostModal';
    connectionState.register(componentId, {
      type: 'post',
      critical: false,
      security: 'high',
      authenticated: true,
      mediaUpload: true,
      userInteraction: true
    });
    
    return () => {
      connectionState.update(componentId, { connected: false });
    };
  }, []);
  
  // Add user search functionality
  const [searchUsers, { data: searchUsersData }] = useLazyQuery(SEARCH_USERS);
  
  // Effect to handle user search results
  useEffect(() => {
    if (searchUsersData?.searchUsers) {
      setUserSearchResults(searchUsersData.searchUsers.filter(
        user => !taggedPeople.includes(user.username) && user.profileid !== user?.profileid
      ));
    }
  }, [searchUsersData, taggedPeople, user?.profileid]);
  
  // Handle people input change with debounced search (Issue 5.19)
  const handlePeopleInputChange = (e) => {
    const query = e.target.value;
    setPeopleInput(query);
    
    if (query.length > 1) {
      // Debounce search to avoid excessive API calls
      if (window.searchTimeout) clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => {
        searchUsers({ variables: { query } });
      }, 300); // 300ms debounce
      setShowUserSearch(true);
    } else {
      setShowUserSearch(false);
      setUserSearchResults([]);
    }
  };
  
  // Add user from search results
  const addUserFromSearch = (user) => {
    if (!taggedPeople.includes(user.username)) {
      setTaggedPeople([...taggedPeople, user.username]);
    }
    setPeopleInput('');
    setShowUserSearch(false);
    setUserSearchResults([]);
  };
  
  // Populate form when editing a draft
  useEffect(() => {
    if (draftData && isOpen) {
      console.log('📝 Populating form with draft data:', draftData);
      setTitle(draftData.title || '');
      setCaption(draftData.caption || '');
      setLocation(draftData.location || '');
      setTags(draftData.tags || []);
      setTaggedPeople(draftData.taggedPeople || []);
      setAllowComments(draftData.allowComments !== false);
      setHideLikeCount(draftData.hideLikeCount || false);
      setAutoPlay(draftData.autoPlay || false);
      
      // Handle media fields if they exist in the draft
      if (draftData.postUrl && draftData.postType) {
        setFilePreview(draftData.postUrl);
        setFileType(draftData.postType);
        // Start at step 3 since we have media and text content
        setCurrentStep(3);
      } else {
        // No media in draft, start at step 3 for details only
        setCurrentStep(3);
        setSelectedFile(null);
        setFilePreview(null);
        setEditedPreview(null);
        setFileType(null);
      }
    } else if (isOpen && !draftData) {
      // Reset to step 1 for new posts
      setCurrentStep(1);
    }
  }, [draftData, isOpen]);

  // Auto-save draft (Issue 5.15)
  useEffect(() => {
    if (isOpen && (title || caption || location || tags.length > 0)) {
      const draftContent = { title, caption, location, tags, taggedPeople };
      saveDraft('createPost', draftContent, 2000); // Auto-save after 2 seconds
    }
  }, [title, caption, location, tags, taggedPeople, isOpen]);
  
  // Cleanup blob URLs properly - track all created URLs
  const blobUrlsRef = useRef(new Set());
  
  useEffect(() => {
    // Add current URLs to tracking set
    if (filePreview && filePreview.startsWith('blob:')) {
      blobUrlsRef.current.add(filePreview);
    }
    if (editedPreview && editedPreview.startsWith('blob:')) {
      blobUrlsRef.current.add(editedPreview);
    }
    
    // Cleanup all tracked URLs on unmount
    return () => {
      if (!isOpen) {
        // Only revoke when modal is closing
        blobUrlsRef.current.forEach(url => {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            // Ignore errors
          }
        });
        blobUrlsRef.current.clear();
      }
    };
  }, [filePreview, editedPreview, isOpen]);

  const [createPost] = useMutation(CREATE_POST_MUTATION, {
    onCompleted: (data) => {
      console.log('Post created successfully:', data);
      alert('🎉 Post shared successfully!');
      resetForm();
      onClose();
      // Trigger profile refresh if callback provided
      if (onPostSuccess) {
        onPostSuccess();
      }
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

  const [createDraft] = useMutation(CREATE_DRAFT_MUTATION, {
    onCompleted: (data) => {
      console.log('Draft created successfully:', data);
      alert('💾 Draft saved successfully!');
      resetForm();
      onClose();
      if (onPostSuccess) {
        // Force refresh to update draft list
        setTimeout(() => {
          onPostSuccess();
          window.location.reload(); // Temporary fix for auto-refresh
        }, 100);
      }
    },
    onError: (error) => {
      console.error('Full error creating draft:', error);
      let errorMsg = 'Unknown error occurred';
      if (error.networkError) {
        errorMsg = `Network error: ${error.networkError.message}`;
      } else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMsg = error.graphQLErrors[0].message;
      } else {
        errorMsg = error.message;
      }
      alert(`❌ Failed to save draft: ${errorMsg}`);
    }
  });

  const [updateDraft] = useMutation(UPDATE_DRAFT_MUTATION, {
    onCompleted: (data) => {
      console.log('Draft updated successfully:', data);
      alert('💾 Draft updated successfully!');
      resetForm();
      onClose();
      if (onPostSuccess) {
        // Force refresh to update draft list
        setTimeout(() => {
          onPostSuccess();
          window.location.reload(); // Temporary fix for auto-refresh
        }, 100);
      }
    },
    onError: (error) => {
      console.error('Full error updating draft:', error);
      let errorMsg = 'Unknown error occurred';
      if (error.networkError) {
        errorMsg = `Network error: ${error.networkError.message}`;
      } else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMsg = error.graphQLErrors[0].message;
      } else {
        errorMsg = error.message;
      }
      alert(`❌ Failed to update draft: ${errorMsg}`);
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
    setAutoPlay(false);
    setIsCloseFriendOnly(false);
    setTagInput('');
    setPeopleInput('');
    setUserSearchResults([]);
    setShowUserSearch(false);
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

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      alert('⚠️ Please select an image or video file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('⚠️ File size must be less than 50MB');
      return;
    }

    try {
      const detectedFileType = isVideo ? 'VIDEO' : 'IMAGE';
      
      setSelectedFile(file);
      setFileType(detectedFileType);
      
      // Create preview URL with error handling
      const previewUrl = URL.createObjectURL(file);
      
      console.log('📸 File selection details:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        detectedType: detectedFileType,
        previewUrl: previewUrl,
        isImage: isImage,
        isVideo: isVideo
      });
      
      setFilePreview(previewUrl);
      setEditedPreview(previewUrl);
      
      // Auto-advance to edit step
      setCurrentStep(2);
      
      console.log('✅ File preview set successfully');
    } catch (error) {
      console.error('❌ Error processing file:', error);
      alert('❌ Error processing file. Please try again.');
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
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
    // If editing a draft, we can publish without requiring a new file
    if (!selectedFile && !draftData) {
      alert('⚠️ Please select a file to upload or start from a draft.');
      return;
    }
    
    if (!user) {
      alert('⚠️ Please log in to create posts.');
      return;
    }
    
    // Note: profileid is provided by GraphQL backend context, not frontend auth context
    // The backend GraphQL middleware will handle user authentication and provide profileid

    // Upload loading removed
    
    try {
      console.log('📤 Starting post creation...');
      
      let fileUrl = null;
      let postType = 'TEXT';
      
      // Handle file upload if we have a new file
      if (selectedFile) {
        // Apply filters to the file before uploading
        let fileToUpload = selectedFile;
        
        // If filters/adjustments have been applied, create a new file with filters (only for images)
        if ((filter !== 'none' || brightness !== 100 || contrast !== 100 || saturation !== 100) && fileType === 'IMAGE') {
          console.log('🎨 Applying filters to image before upload...');
          fileToUpload = await applyFiltersToFile(selectedFile);
        } else if (fileType === 'VIDEO') {
          console.log('🎥 Video upload - skipping filter processing');
          fileToUpload = selectedFile;
        }
        
        const formData = new FormData();
        formData.append('file', fileToUpload);
        
        console.log('📏 Uploading file to server...');
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }
        
        const uploadData = await uploadResponse.json();
        fileUrl = uploadData.fileUrl;
        postType = fileType;
        console.log('✅ File uploaded successfully:', fileUrl);
      } else if (draftData) {
        // Use existing file from draft
        fileUrl = draftData.postUrl || 'text-post-placeholder';
        postType = draftData.postType || 'TEXT';
        console.log('📝 Using existing media from draft:', fileUrl);
      }
      
      // Get profileid from GraphQL profile data
      const profileid = profileData?.getUserbyUsername?.profileid;
      
      console.log('🔍 Profile data for post creation:', {
        hasUser: !!user,
        hasProfileData: !!profileData,
        profileid: profileid,
        username: user?.username,
        isLoading: profileLoading
      });
      
      if (!profileid) {
        console.error('❌ No profileid available from GraphQL profile data');
        alert('❌ Profile information not available. Please make sure you\'re logged in and try again.');
        return;
      }
      
      const postData = {
        profileid: profileid,
        postUrl: fileUrl || 'text-post-placeholder',
        title: title || null,
        Description: caption || null,
        postType: postType,
        location: location || null,
        tags: tags.length > 0 ? tags : null,
        taggedPeople: taggedPeople.length > 0 ? taggedPeople : null,
        allowComments,
        hideLikeCount,
        autoPlay,
        isCloseFriendOnly
      };
      
      console.log('📨 Creating post with data:', postData);
      
      await createPost({
        variables: postData
      });
      
      // If we published a draft, delete it
      if (draftData && draftData.draftid) {
        console.log('🗄 Deleting published draft:', draftData.draftid);
        // This will be handled by the onPostSuccess callback
      }
      
    } catch (error) {
      console.error('❌ Error uploading post:', error);
      alert('❌ Failed to create post. Please try again.');
      // Upload loading removed
    }
  };

  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleClose = () => {
    if (true) {
      // If editing a draft and there are changes, auto-save instead of showing dialog
      if (draftData && (title || caption || location || tags.length > 0)) {
        handleSaveAsDraft();
        return;
      }
      // For new posts, show save dialog if there's content
      if (!draftData && (selectedFile || title || caption)) {
        setShowSaveDialog(true);
      } else {
        resetForm();
        onClose();
      }
    }
  };

  const handleCloseWithoutSaving = () => {
    setShowSaveDialog(false);
    resetForm();
    onClose();
  };

  const handleCloseSaveDialog = () => {
    setShowSaveDialog(false);
  };

  const handleSaveAsDraft = async () => {
    // Get profileid from GraphQL profile data
    const profileid = profileData?.getUserbyUsername?.profileid;
    
    // Save as draft functionality
    console.log('- User:', user?.username || 'NULL');
    console.log('- Profile ID from GraphQL:', profileid);
    console.log('- Selected file:', !!selectedFile);
    console.log('- File type:', fileType);
    console.log('- Title:', title);
    console.log('- Caption:', caption);
    console.log('- Draft data:', draftData ? draftData.draftid : 'NULL');
    
    if (!user || !profileid) {
      alert('⚠️ Please log in to save drafts.');
      return;
    }

    const isEditing = draftData && draftData.draftid;
    console.log(`\n🎯 ${isEditing ? 'Updating existing draft' : 'Creating new draft'}...`);

    let postUrl = filePreview || (draftData?.postUrl) || null;
    let postType = fileType || (draftData?.postType) || 'TEXT';
    
    // If we have a new file selected, upload it first
    if (selectedFile && fileType) {
      try {
        console.log('📤 Uploading media for draft...');
        // Upload loading removed
        
        // Apply filters to the file before uploading if needed
        let fileToUpload = selectedFile;
        if ((filter !== 'none' || brightness !== 100 || contrast !== 100 || saturation !== 100) && fileType === 'IMAGE') {
          console.log('🎨 Applying filters to image before upload...');
          fileToUpload = await applyFiltersToFile(selectedFile);
        }
        
        const formData = new FormData();
        formData.append('file', fileToUpload);
        
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }
        
        const uploadData = await uploadResponse.json();
        postUrl = uploadData.fileUrl;
        console.log('✅ Media uploaded successfully for draft:', postUrl);
        
      } catch (error) {
        console.error('❌ Error uploading media for draft:', error);
        alert('❌ Failed to upload media. Saving draft as text only.');
        postUrl = null;
        postType = 'TEXT';
      } finally {
        // Upload loading removed
      }
    }

    // Prepare draft variables including media fields
    const draftVariables = {
      title: title || null,
      caption: caption || null,
      location: location || null,
      tags: tags.length > 0 ? tags : [],
      taggedPeople: taggedPeople.length > 0 ? taggedPeople : [],
      allowComments,
      hideLikeCount,
      autoPlay,
      // Include media fields
      postUrl,
      postType
    };
    
    console.log('\n📋 Draft variables prepared:');
    console.log('- postUrl:', postUrl);
    console.log('- postType:', postType);
    console.log('- title:', draftVariables.title);
    console.log('- caption:', draftVariables.caption);
    console.log('- tags:', draftVariables.tags);
    
    if (isEditing) {
      // Update existing draft
      draftVariables.draftid = draftData.draftid;
      console.log('Updating draft with variables:', draftVariables);
      try {
        await updateDraft({
          variables: draftVariables
        });
        setShowSaveDialog(false);
      } catch (error) {
        console.error('Error updating draft:', error);
      }
    } else {
      // Create new draft
      draftVariables.profileid = profileid;
      console.log('Creating draft with variables:', draftVariables);
      try {
        await createDraft({
          variables: draftVariables
        });
        setShowSaveDialog(false);
      } catch (error) {
        console.error('Error creating draft:', error);
      }
    }
  };
  
  const getStepTitle = () => {
    if (draftData) {
      return 'Edit Draft';
    }
    switch(currentStep) {
      case 1: return 'Select Photo/Video';
      case 2: return 'Edit & Enhance';
      case 3: return 'Share Your Moment';
      default: return 'Create Post';
    }
  };

  const getFilterString = () => {
    let filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    
    switch(filter) {
      case 'sepia':
        filterStr += ' sepia(100%)';
        break;
      case 'grayscale':
        filterStr += ' grayscale(100%)';
        break;
      case 'vintage':
        filterStr += ' sepia(50%) contrast(120%) brightness(110%)';
        break;
      case 'warm':
        filterStr += ' sepia(20%) saturate(120%) hue-rotate(10deg)';
        break;
      case 'cool':
        filterStr += ' saturate(120%) hue-rotate(-10deg)';
        break;
      case 'none':
      default:
        break;
    }
    
    console.log('Generated filter string:', filterStr);
    return filterStr;
  };

  const applyFilter = (filterName) => {
    console.log('Applying filter:', filterName);
    setFilter(filterName);
  };
  
  const applyFiltersToFile = async (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Apply filters to canvas context
        ctx.filter = getFilterString();
        ctx.drawImage(img, 0, 0);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          const filteredFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(filteredFile);
        }, file.type);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  if (!isOpen) return null;

  // Debug: Log state before render
  console.log('🎬 CreatePostModal rendering:', {
    currentStep,
    selectedFile: selectedFile?.name,
    fileType,
    filePreview: filePreview?.substring(0, 50),
    editedPreview: editedPreview?.substring(0, 50),
    hasFile: !!selectedFile
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className={`relative w-full max-w-6xl max-h-[90vh] rounded-xl overflow-hidden shadow-2xl ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        
        {/* Modal Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-4">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className={`p-2 rounded-full transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
            )}
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {getStepTitle()}
            </h3>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-colors ${
                  step <= currentStep 
                    ? 'bg-red-500' 
                    : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {currentStep === 2 && selectedFile && (
              <button
                onClick={nextStep}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Next
              </button>
            )}
            {currentStep === 3 && (
              <button
                onClick={handlePost}
                disabled={(!selectedFile && !draftData)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  (!selectedFile && !draftData)
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-lg'
                }`}
              >
                {draftData ? '🚀 Publish Draft' : '🚀 Share Post'}
              </button>
            )}
            <div className="flex items-center gap-2">
              {/* Show Save as Draft button if we have content to save or are editing a draft */}
              {(selectedFile || title || caption || draftData) && (
                <button
                  onClick={() => {
                    console.log('💾 Save as Draft clicked');
                    console.log('- selectedFile:', !!selectedFile);
                    console.log('- title:', title);
                    console.log('- caption:', caption);
                    console.log('- user:', user ? user.username : 'NULL');
                    console.log('- currentStep:', currentStep);
                    handleSaveAsDraft();
                  }}
                  className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  title="Save your progress as a draft"
                >
                  💾 {draftData ? 'Update Draft' : 'Save as Draft'}
                </button>
              )}
              <button
                onClick={handleClose}
                className={`p-2 rounded-full transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Modal Body - Dynamic Content Based on Step */}
        <div className="flex h-[calc(90vh-80px)]">
          
          {/* STEP 1: FILE SELECTION */}
          {currentStep === 1 && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div 
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors w-full max-w-md ${
                  dragActive 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                    : theme === 'dark' 
                      ? 'border-gray-600 hover:border-gray-500' 
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDrag}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
              >
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <PhotoIcon className={`w-10 h-10 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
                
                <h4 className={`text-xl font-medium mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Drag photos and videos here
                </h4>
                
                <p className={`text-sm mb-6 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Or click to browse from your device
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
                >
                  Select from Computer
                </button>
                
                <p className={`text-xs mt-4 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Maximum file size: 50MB
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: EDIT & ENHANCE */}
          {currentStep === 2 && selectedFile && (filePreview || editedPreview) && (
            <div className="flex-1 flex">
              {/* Image Preview */}
              <div className="flex-1 flex items-center justify-center bg-black">
                {/* Debug info */}
                {console.log('🎨 Rendering preview:', { fileType, filePreview, editedPreview, selectedFile: selectedFile?.name })}
                
                {fileType === 'VIDEO' ? (
                  <video
                    src={editedPreview || filePreview}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: getFilterString()
                    }}
                    onError={(e) => {
                      console.error('Video load error:', e);
                    }}
                    onLoadedData={(e) => {
                      e.target.play().catch(() => {});
                    }}
                  />
                ) : (
                  <img
                    src={editedPreview || filePreview}
                    alt="Post preview"
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: getFilterString(),
                      display: 'block' // Ensure image is visible
                    }}
                    onError={(e) => {
                      console.error('Image load error:', {
                        src: e.target.src,
                        filePreview,
                        editedPreview,
                        naturalWidth: e.target.naturalWidth,
                        naturalHeight: e.target.naturalHeight
                      });
                    }}
                    onLoad={(e) => {
                      console.log('Image loaded successfully:', {
                        src: e.target.src,
                        width: e.target.naturalWidth,
                        height: e.target.naturalHeight
                      });
                    }}
                  />
                )}
              </div>
              
              {/* Edit Controls */}
              <div className={`w-80 p-6 border-l overflow-y-auto ${
                theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
              }`}>
                <h3 className={`text-lg font-semibold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  ✨ Enhance Your Media
                </h3>
                
                {/* Filters */}
                <div className="mb-6">
                  <h4 className={`text-sm font-medium mb-3 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    🎨 Filters
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'none', label: 'Original', icon: '✨' },
                      { name: 'sepia', label: 'Sepia', icon: '🏞️' },
                      { name: 'grayscale', label: 'B&W', icon: '⚫' },
                      { name: 'vintage', label: 'Vintage', icon: '📷' },
                      { name: 'warm', label: 'Warm', icon: '🌅' },
                      { name: 'cool', label: 'Cool', icon: '❄️' }
                    ].map((filterItem) => (
                      <button
                        key={filterItem.name}
                        onClick={() => applyFilter(filterItem.name)}
                        className={`p-3 rounded-xl text-xs transition-all duration-200 transform hover:scale-105 flex flex-col items-center space-y-1 ${
                          filter === filterItem.name
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 border-2 border-red-400'
                            : theme === 'dark'
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:shadow-md border border-gray-600'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:shadow-md'
                        }`}
                      >
                        <span className="text-lg">{filterItem.icon}</span>
                        <span className="font-medium">{filterItem.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Adjustments */}
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Brightness: {brightness}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={brightness}
                      onChange={(e) => setBrightness(e.target.value)}
                      className="w-full accent-red-500"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Contrast: {contrast}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={contrast}
                      onChange={(e) => setContrast(e.target.value)}
                      className="w-full accent-red-500"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Saturation: {saturation}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(e.target.value)}
                      className="w-full accent-red-500"
                    />
                  </div>
                </div>
                
                <div className="mt-8">
                  <button
                    onClick={() => {
                      setBrightness(100);
                      setContrast(100);
                      setSaturation(100);
                      setFilter('none');
                    }}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Reset All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: POST DETAILS */}
          {currentStep === 3 && (
            <div className="flex-1 flex">
              {/* Final Preview */}
              <div className="flex-1 flex items-center justify-center bg-black">
                {fileType === 'VIDEO' ? (
                  <video
                    src={editedPreview || filePreview}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: getFilterString()
                    }}
                    onError={(e) => {
                      console.error('Final preview video load error:', e);
                    }}
                    onLoadedData={(e) => {
                      e.target.play().catch(() => {});
                    }}
                  />
                ) : (
                  <img
                    src={editedPreview || filePreview}
                    alt="Final post preview"
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: getFilterString()
                    }}
                    onError={(e) => {
                      console.error('Final preview image load error:', e.target.error);
                    }}
                    onLoad={() => {
                      console.log('Final preview image loaded successfully');
                    }}
                  />
                )}
              </div>
              
              {/* Post Details Form */}
              <div className={`w-96 p-6 border-l overflow-y-auto ${
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
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your post a catchy title..."
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    disabled={isUploading}
                  />
                </div>
                
                {/* Caption */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Caption
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 resize-none transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    disabled={isUploading}
                  />
                </div>
                
                {/* Location */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    📍 Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Where was this taken?"
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    disabled={isUploading}
                  />
                </div>
                
                {/* Tags */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    🏷️ Tags
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      placeholder="Add a tag..."
                      className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <button
                      onClick={addTag}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      disabled={isUploading}
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-500 text-white"
                      >
                        #{tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Tagged People */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    👥 Tag People
                  </label>
                  <div className="mb-2 relative">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={peopleInput}
                        onChange={handlePeopleInputChange}
                        onKeyPress={(e) => e.key === 'Enter' && addTaggedPerson()}
                        placeholder="Search username..."
                        className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      <button
                        onClick={addTaggedPerson}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Tag
                      </button>
                    </div>
                    {showUserSearch && userSearchResults.length > 0 && (
                      <div className={`absolute z-10 mt-2 w-full rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} max-h-48 overflow-y-auto shadow-lg`}>
                        {userSearchResults.map((u) => (
                          <button
                            key={u.profileid}
                            onClick={() => addUserFromSearch(u)}
                            className={`w-full px-3 py-2 text-left flex items-center space-x-3 hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}
                          >
                            <img src={u.profilePic || '/default-profile.svg'} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <p className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{u.username}</p>
                              {u.name && <p className="text-xs text-gray-500">{u.name}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {taggedPeople.map((person, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500 text-white"
                      >
                        @{person}
                        <button
                          onClick={() => removeTaggedPerson(person)}
                          className="ml-1 hover:text-blue-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      💬 Allow Comments
                    </label>
                    <button
                      onClick={() => setAllowComments(!allowComments)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        allowComments ? 'bg-red-500' : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                      disabled={isUploading}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          allowComments ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      🙈 Hide Like Count
                    </label>
                    <button
                      onClick={() => setHideLikeCount(!hideLikeCount)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        hideLikeCount ? 'bg-red-500' : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                      disabled={isUploading}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          hideLikeCount ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {/* Auto Play Setting - Only show for videos */}
                  {fileType === 'VIDEO' && (
                    <div className="flex items-center justify-between">
                      <label className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        ▶️ Auto Play Video
                      </label>
                      <button
                        onClick={() => setAutoPlay(!autoPlay)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          autoPlay ? 'bg-red-500' : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            autoPlay ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  )}
                  
                  {/* Close Friends Only */}
                  <div className="flex items-center justify-between">
                    <label className={`text-sm font-medium flex items-center space-x-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <span>⭐ Share to Close Friends Only</span>
                      {isCloseFriendOnly && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500 text-white">
                          Close Friends
                        </span>
                      )}
                    </label>
                    <button
                      onClick={() => setIsCloseFriendOnly(!isCloseFriendOnly)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isCloseFriendOnly ? 'bg-green-500' : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                      disabled={isUploading}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isCloseFriendOnly ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Save Draft Dialog - Enhanced UI */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`w-96 rounded-2xl shadow-2xl border transform transition-all ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="p-8">
              {/* Icon */}
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <svg className={`w-8 h-8 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <h3 className={`text-xl font-bold text-center mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Save your post?
              </h3>
              <p className={`text-sm text-center mb-8 leading-relaxed ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                You have unsaved changes. Would you like to save this as a draft or discard it?
              </p>
              
              {/* Symmetric Button Layout */}
              <div className="space-y-3">
                <button
                  onClick={handleSaveAsDraft}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02]"
                >
                  💾 Save as Draft
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCloseWithoutSaving}
                    className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-md transform hover:scale-[1.02] ${
                      theme === 'dark'
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    🗑️ Discard
                  </button>
                  <button
                    onClick={handleCloseSaveDialog}
                    className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-md transform hover:scale-[1.02] border ${
                      theme === 'dark'
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    ↩️ Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon Components
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

function ArrowLeftIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}
