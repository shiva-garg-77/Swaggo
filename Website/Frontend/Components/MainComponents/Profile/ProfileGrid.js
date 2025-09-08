"use client";

import { useState, useEffect } from 'react';

export default function ProfileGrid({ posts, activeTab, loading, theme, currentUser }) {
  const [selectedPostIndex, setSelectedPostIndex] = useState(null);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedPostIndex(null);
      } else if (event.key === 'ArrowLeft' && selectedPostIndex !== null) {
        navigatePost('prev');
      } else if (event.key === 'ArrowRight' && selectedPostIndex !== null) {
        navigatePost('next');
      }
    };

    if (selectedPostIndex !== null) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedPostIndex]);

  const navigatePost = (direction) => {
    if (!posts || posts.length === 0) return;
    
    if (direction === 'next' && selectedPostIndex < posts.length - 1) {
      setSelectedPostIndex(selectedPostIndex + 1);
    } else if (direction === 'prev' && selectedPostIndex > 0) {
      setSelectedPostIndex(selectedPostIndex - 1);
    }
  };

  const openPostModal = (postIndex) => {
    setSelectedPostIndex(postIndex);
  };

  const closePostModal = () => {
    setSelectedPostIndex(null);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-0.5 md:gap-1">
        {[...Array(9)].map((_, index) => (
          <div 
            key={index}
            className={`aspect-square rounded-lg animate-pulse ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className={`mb-4 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <NoPostsIcon />
        </div>
        <h3 className={`text-2xl font-light mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {getEmptyStateTitle(activeTab)}
        </h3>
        <p className={`text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {getEmptyStateSubtitle(activeTab)}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5 md:gap-1">
        {posts.map((post, index) => (
          <PostGridItem
            key={post.postid}
            post={post}
            onClick={() => openPostModal(index)}
            theme={theme}
          />
        ))}
      </div>

      {/* Post Modal */}
      {selectedPostIndex !== null && posts[selectedPostIndex] && (
        <PostModal
          post={posts[selectedPostIndex]}
          currentIndex={selectedPostIndex}
          totalPosts={posts.length}
          onClose={closePostModal}
          onNavigate={navigatePost}
          theme={theme}
          currentUser={currentUser}
        />
      )}
    </>
  );
}

// Individual post grid item
function PostGridItem({ post, onClick, theme }) {
  const isVideo = post.postType === 'VIDEO' || post.postType === 'video';
  const isImage = post.postType === 'IMAGE' || post.postType === 'image' || !post.postType;
  const likesCount = post.like?.length || 0;
  const commentsCount = post.comments?.length || 0;

  // Handle different media types
  const renderMedia = () => {
    // Fix URL if it starts with localhost
    let mediaUrl = post.postUrl;
    if (mediaUrl && mediaUrl.includes('localhost:3001')) {
      mediaUrl = mediaUrl.replace('localhost:3001', 'localhost:3001');
    }

    if (isVideo) {
      return (
        <video
          src={mediaUrl}
          className="w-full h-full object-cover"
          muted
          preload="metadata"
          onError={(e) => {
            console.error('Video load error:', e, 'URL:', mediaUrl);
            // Replace with error placeholder
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            if (parent && !parent.querySelector('.error-placeholder')) {
              const errorDiv = document.createElement('div');
              errorDiv.className = `error-placeholder w-full h-full flex items-center justify-center ${
                theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
              }`;
              errorDiv.innerHTML = '<span class="text-sm">Video unavailable</span>';
              parent.appendChild(errorDiv);
            }
          }}
        />
      );
    } else if (isImage) {
      return (
        <img
          src={mediaUrl}
          alt={post.title || 'Post'}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Image load error:', e, 'URL:', mediaUrl);
            // Show placeholder on error
            e.target.src = '/default-profile.svg';
          }}
        />
      );
    } else {
      // Fallback for unknown types
      return (
        <div className={`w-full h-full flex items-center justify-center ${
          theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
        }`}>
          <span className="text-sm">Unsupported media</span>
        </div>
      );
    }
  };

  return (
    <div
      onClick={onClick}
      className="relative aspect-square overflow-hidden cursor-pointer group rounded-sm"
    >
      {/* Post Media */}
      {renderMedia()}

      {/* Video indicator */}
      {isVideo && (
        <div className="absolute top-2 right-2">
          <VideoIcon className="w-5 h-5 text-white drop-shadow-lg" />
        </div>
      )}

      {/* Multiple images indicator (if we had that data) */}
      {post.mediaCount > 1 && (
        <div className="absolute top-2 right-2">
          <MultipleImagesIcon className="w-5 h-5 text-white drop-shadow-lg" />
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex items-center space-x-6 text-white">
          <div className="flex items-center space-x-1">
            <HeartIcon className="w-6 h-6" />
            <span className="font-semibold">{likesCount}</span>
          </div>
          <div className="flex items-center space-x-1">
            <CommentIcon className="w-6 h-6" />
            <span className="font-semibold">{commentsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Instagram-style post modal
function PostModal({ post, currentIndex, totalPosts, onClose, onNavigate, theme, currentUser }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localLikeCount, setLocalLikeCount] = useState(post.like?.length || 0);
  
  const isVideo = post.postType === 'VIDEO' || post.postType === 'video';
  const isFirstPost = currentIndex === 0;
  const isLastPost = currentIndex === totalPosts - 1;

  // Check if current user has liked this post
  useEffect(() => {
    if (currentUser && post.like) {
      const userLiked = post.like.some(like => like.profile?.profileid === currentUser.profileid);
      setIsLiked(userLiked);
    }
  }, [currentUser, post.like]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleLike = () => {
    if (!currentUser) return;
    
    setIsLiked(!isLiked);
    setLocalLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    
    // TODO: Implement GraphQL mutation for liking
    console.log('Toggle like for post:', post.postid);
  };

  const handleSave = () => {
    if (!currentUser) return;
    
    setIsSaved(!isSaved);
    
    // TODO: Implement GraphQL mutation for saving
    console.log('Toggle save for post:', post.postid);
  };

  const handleShare = () => {
    // Copy post URL to clipboard
    navigator.clipboard.writeText(window.location.href + '?post=' + post.postid)
      .then(() => alert('Link copied to clipboard!'))
      .catch(() => console.error('Failed to copy link'));
  };

  const handleComment = () => {
    if (!commentText.trim() || !currentUser) return;
    
    // TODO: Implement GraphQL mutation for commenting
    console.log('Add comment:', commentText, 'to post:', post.postid);
    setCommentText('');
  };

  const renderMedia = () => {
    // Fix URL if it starts with localhost
    let mediaUrl = post.postUrl;
    if (mediaUrl && mediaUrl.includes('localhost:3001')) {
      mediaUrl = mediaUrl.replace('localhost:3001', 'localhost:3001');
    }

    if (isVideo) {
      return (
        <video
          src={mediaUrl}
          controls
          className="w-full h-full object-cover"
          style={{ aspectRatio: '1/1', maxHeight: '600px' }}
          onError={(e) => {
            console.error('Video load error in modal:', e, 'URL:', mediaUrl);
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            if (parent && !parent.querySelector('.modal-error-placeholder')) {
              const errorDiv = document.createElement('div');
              errorDiv.className = 'modal-error-placeholder w-full h-full flex items-center justify-center bg-gray-800 text-gray-400';
              errorDiv.innerHTML = '<span class="text-lg">Video could not be loaded</span>';
              parent.appendChild(errorDiv);
            }
          }}
        />
      );
    } else {
      return (
        <img
          src={mediaUrl}
          alt={post.title || 'Post'}
          className="w-full h-full object-cover"
          style={{ aspectRatio: '1/1', maxHeight: '600px' }}
          onError={(e) => {
            console.error('Image load error in modal:', e, 'URL:', mediaUrl);
            // Show fallback image
            e.target.src = '/default-profile.svg';
          }}
        />
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Blurred backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-black bg-opacity-60"
        onClick={handleBackdropClick}
      />
      
      {/* Navigation Buttons */}
      {!isFirstPost && (
        <button
          onClick={() => onNavigate('prev')}
          className="absolute left-8 top-1/2 -translate-y-1/2 z-60 p-4 rounded-full bg-white shadow-lg text-gray-700 hover:bg-gray-100 transition-all"
          aria-label="Previous post"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      )}
      
      {!isLastPost && (
        <button
          onClick={() => onNavigate('next')}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-60 p-4 rounded-full bg-white shadow-lg text-gray-700 hover:bg-gray-100 transition-all"
          aria-label="Next post"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-60 p-3 rounded-full bg-white shadow-lg text-gray-700 hover:bg-gray-100 transition-all"
        aria-label="Close modal"
      >
        <CloseIcon className="w-6 h-6" />
      </button>

      {/* Modal content */}
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex">
          {/* Media Section */}
          <div className="flex-1 bg-black flex items-center justify-center">
            {renderMedia()}
          </div>

          {/* Info Section */}
          <div className="w-96 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <img
                  src={currentUser?.profilePic || '/api/placeholder/40/40'}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{currentUser?.username}</h4>
                  <div className="text-xs text-gray-500">
                    {currentIndex + 1} of {totalPosts}
                  </div>
                </div>
              </div>
            </div>

            {/* Post content */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-start space-x-3">
                <img
                  src={currentUser?.profilePic || '/api/placeholder/32/32'}
                  alt="Profile"
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{currentUser?.username}</span>{' '}
                    {post.Description || post.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Comments section */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Show existing comments */}
              {post.comments && post.comments.length > 0 ? (
                post.comments.map((comment, index) => (
                  <div key={comment.commentid || index} className="flex items-start space-x-3">
                    <img
                      src={'/api/placeholder/32/32'}
                      alt="Commenter"
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">user{index + 1}</span>{' '}
                        Sample comment text for post
                      </p>
                      <div className="text-xs text-gray-500 mt-1">
                        <span>2h</span>
                        <button className="ml-4 hover:text-gray-700">Reply</button>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-red-500">
                      <HeartIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">No comments yet.</p>
                  <p className="text-xs">Be the first to comment!</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200">
              {/* Action buttons */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={handleLike}
                      className={`p-1 transition-colors ${
                        isLiked ? 'text-red-500' : 'text-gray-700 hover:text-red-500'
                      }`}
                    >
                      <HeartIcon className="w-6 h-6" filled={isLiked} />
                    </button>
                    <button className="p-1 text-gray-700 hover:text-blue-500 transition-colors">
                      <CommentIcon className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={handleShare}
                      className="p-1 text-gray-700 hover:text-green-500 transition-colors"
                    >
                      <ShareIcon className="w-6 h-6" />
                    </button>
                  </div>
                  <button 
                    onClick={handleSave}
                    className={`p-1 transition-colors ${
                      isSaved ? 'text-yellow-500' : 'text-gray-700 hover:text-yellow-500'
                    }`}
                  >
                    <BookmarkIcon className="w-6 h-6" filled={isSaved} />
                  </button>
                </div>
                
                {/* Like count */}
                <div className="mt-2">
                  <p className="font-semibold text-sm">{localLikeCount} likes</p>
                </div>
              </div>

              {/* Comment input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                    className="flex-1 text-sm border-none outline-none bg-transparent"
                  />
                  {commentText.trim() && (
                    <button
                      onClick={handleComment}
                      className="text-blue-500 font-semibold text-sm hover:text-blue-600"
                    >
                      Post
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getEmptyStateTitle(activeTab) {
  switch (activeTab) {
    case 'uploads':
      return 'No Posts Yet';
    case 'draft':
      return 'No Drafts';
    case 'tagged':
      return 'No Tagged Posts';
    default:
      return 'No Posts Yet';
  }
}

function getEmptyStateSubtitle(activeTab) {
  switch (activeTab) {
    case 'uploads':
      return 'When you share posts, they will appear here.';
    case 'draft':
      return 'Posts you draft will appear here.';
    case 'tagged':
      return 'When you get tagged in posts, they will appear here.';
    default:
      return 'When you share posts, they will appear here.';
  }
}

// Icon Components
function NoPostsIcon() {
  return (
    <div className="w-16 h-16 mx-auto">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

function VideoIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
    </svg>
  );
}

function HeartIcon({ className, filled = false }) {
  if (filled) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function CommentIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
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

function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function MultipleImagesIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
      <path d="M3 1a1 1 0 000 2h.01a1 1 0 100-2H3zM6 1a1 1 0 000 2h.01a1 1 0 100-2H6zM9 1a1 1 0 100 2h.01a1 1 0 100-2H9z" />
    </svg>
  );
}

function ShareIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>
  );
}

function BookmarkIcon({ className, filled = false }) {
  if (filled) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}
