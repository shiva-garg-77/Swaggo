"use client";

import { useState, useEffect, useRef } from 'react';
import InstagramPostModal from '../Post/InstagramPostModal';

export default function ProfileGrid({ posts, activeTab, loading, theme, currentUser, onEditDraft, onDeleteDraft, onPublishDraft }) {
  const [selectedPostIndex, setSelectedPostIndex] = useState(null);
  
  // Debug logging for posts data
  console.log('🗺 ProfileGrid Debug:');
  console.log('- activeTab:', activeTab);
  console.log('- posts received:', posts);
  console.log('- posts count:', posts?.length || 0);
  if (activeTab === 'draft') {
    console.log('- Draft data details:', posts.map(p => ({ draftid: p.draftid, title: p.title, caption: p.caption })));
  }

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
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {[...Array(9)].map((_, index) => (
          <div 
            key={index}
            className={`aspect-square rounded-lg animate-pulse shadow-sm ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          >
            {/* Skeleton content */}
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-8 h-8 rounded-full animate-spin ${
                theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
              }`}>
                <div className="w-full h-full border-2 border-transparent border-t-red-500 rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="w-full py-16">
        <div className="text-center">
          <div className={`mb-6 ${
            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            <NoPostsIcon />
          </div>
          <h3 className={`text-xl font-semibold mb-3 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {getEmptyStateTitle(activeTab)}
          </h3>
          <p className={`text-sm max-w-sm mx-auto ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {getEmptyStateSubtitle(activeTab)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full py-4">
        <div className="grid grid-cols-3 gap-1.5 md:gap-3 lg:gap-4">
          {posts.map((post, index) => {
            // Check if this is a draft post (has draftid instead of postid)
            const isDraft = !!post.draftid;
            // Ensure a stable, unique key across updates. Include index and createdAt as tiebreakers.
            const baseKey = isDraft ? (post.draftid || post.id || `draft-${index}`) : (post.postid || `post-${index}`);
            const itemKey = `${baseKey}-${index}-${post.createdAt || post.updatedAt || ''}`;
            
            return isDraft ? (
              <DraftGridItem
                key={itemKey}
                draft={post}
                theme={theme}
                onEdit={() => onEditDraft?.(post)}
                onDelete={() => onDeleteDraft?.(post.id || post.draftid)}
                onPublish={() => onPublishDraft?.(post)}
              />
            ) : (
              <PostGridItem
                key={itemKey}
                post={post}
                onClick={() => openPostModal(index)}
                theme={theme}
              />
            );
          })}
        </div>
      </div>

      {/* Post Modal */}
      {selectedPostIndex !== null && posts[selectedPostIndex] && (
        <InstagramPostModal
          post={posts[selectedPostIndex]}
          isOpen={true}
          onClose={closePostModal}
          showNavigation={true}
          onNext={() => navigatePost('next')}
          onPrevious={() => navigatePost('prev')}
          hasNext={selectedPostIndex < posts.length - 1}
          hasPrevious={selectedPostIndex > 0}
          currentIndex={selectedPostIndex + 1}
          totalCount={posts.length}
        />
      )}
    </>
  );
}

// Draft grid item component - Enhanced to be more like posts
function DraftGridItem({ draft, theme, onEdit, onDelete, onPublish }) {
  const [isInView, setIsInView] = useState(false);
  const videoRef = useRef(null);
  const createdDate = new Date(draft.createdAt || Date.now());
  const formattedDate = createdDate.toLocaleDateString();
  const timeAgo = getTimeAgo(createdDate);
  const isVideo = draft.postType === 'VIDEO' || draft.postType === 'video';
  
  // Intersection Observer for video autoplay in drafts
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(console.log);
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [isVideo]);
  
  // Render draft media preview (if available)
  const renderDraftMedia = () => {
    if (draft.postUrl || draft.mediaUrl) {
      let mediaUrl = draft.postUrl || draft.mediaUrl;
      
      // Fix URL - handle localhost port issues
      if (mediaUrl && mediaUrl.includes('localhost:3001')) {
        mediaUrl = mediaUrl.replace('localhost:3001', 'localhost:45799');
      } else if (mediaUrl && mediaUrl.startsWith('/uploads/')) {
        mediaUrl = `http://localhost:45799${mediaUrl}`;
      }
      
      if (isVideo) {
        return (
          <video
            ref={videoRef}
            src={mediaUrl}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            onError={(e) => {
              console.error('Draft video load error:', mediaUrl);
              console.error('Original URL:', draft.postUrl || draft.mediaUrl);
              
              // Try alternative URL
              const alternatives = [
                mediaUrl.replace('localhost:45799', 'localhost:3001'),
                mediaUrl.replace('45799', '3001')
              ];
              
              for (const altUrl of alternatives) {
                if (altUrl !== mediaUrl) {
                  console.log('Trying alternative draft video URL:', altUrl);
                  e.target.src = altUrl;
                  return;
                }
              }
              
              // If all alternatives fail, hide video
              e.target.style.display = 'none';
            }}
            onLoadedData={(e) => {
              e.target.currentTime = 0;
              if (isInView) {
                e.target.play().catch(() => {});
              }
            }}
            onCanPlay={(e) => {
              if (isInView) {
                e.target.play().catch(() => {});
              }
            }}
          />
        );
      } else {
        return (
          <img
            src={mediaUrl}
            alt={draft.title || 'Draft preview'}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Draft image load error:', mediaUrl);
              console.error('Original URL:', draft.postUrl || draft.mediaUrl);
              
              // Try alternative URL
              const alternatives = [
                mediaUrl.replace('localhost:45799', 'localhost:3001'),
                mediaUrl.replace('45799', '3001')
              ];
              
              for (const altUrl of alternatives) {
                if (altUrl !== mediaUrl) {
                  console.log('Trying alternative draft image URL:', altUrl);
                  e.target.src = altUrl;
                  return;
                }
              }
              
              // If all alternatives fail, hide image
              e.target.style.display = 'none';
            }}
          />
        );
      }
    }
    
    // Fallback placeholder for drafts without media
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center p-4 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <div className="text-center">
          {isVideo ? (
            <VideoIcon className={`w-10 h-10 mb-3 mx-auto ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`} />
          ) : (
            <DocumentIcon className={`w-10 h-10 mb-3 mx-auto ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`} />
          )}
          <h4 className={`text-xs font-medium mb-1 line-clamp-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {draft.title || 'Untitled Draft'}
          </h4>
          <p className={`text-xs ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          }`}>
            {timeAgo}
          </p>
        </div>
      </div>
    );
  };
  
  return (
    <div
      className={`relative aspect-square overflow-hidden cursor-pointer group rounded-lg transition-all duration-300 shadow-sm hover:shadow-md border-2 ${
        theme === 'dark' 
          ? 'bg-gray-800 hover:bg-gray-750 border-orange-500/50' 
          : 'bg-white hover:bg-gray-50 border-orange-300/50'
      }`}
    >
      {/* Draft Media/Content */}
      <div className="relative w-full h-full">
        {renderDraftMedia()}
      </div>
      
      {/* Draft Badge */}
      <div className="absolute top-2 left-2 z-10">
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          theme === 'dark' 
            ? 'bg-orange-500 text-white' 
            : 'bg-orange-500 text-white'
        }`}>
          ✨ Draft
        </div>
      </div>
      
      {/* Media type indicator */}
      {isVideo && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-black/70 backdrop-blur-sm rounded-full p-1.5">
            <VideoIcon className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
      
      {/* Draft Info Overlay - Shows draft details */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <div className="space-y-1">
            {draft.caption && (
              <p className="text-xs line-clamp-2 leading-relaxed">
                {draft.caption}
              </p>
            )}
            {draft.location && (
              <p className="text-xs opacity-80">
                📍 {draft.location}
              </p>
            )}
            {draft.tags && draft.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {draft.tags.slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
                {draft.tags.length > 3 && (
                  <span className="text-xs opacity-60">+{draft.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Draft Actions Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex items-center space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-colors shadow-lg hover:scale-105"
            title="Edit Draft"
          >
            <EditIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPublish();
            }}
            className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-colors shadow-lg hover:scale-105"
            title="Publish Draft"
          >
            <PublishIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors shadow-lg hover:scale-105"
            title="Delete Draft"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function for time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Individual post grid item
function PostGridItem({ post, onClick, theme }) {
  const [isInView, setIsInView] = useState(false);
  const videoRef = useRef(null);
  
  const isVideo = post.postType === 'VIDEO' || post.postType === 'video';
  const isImage = post.postType === 'IMAGE' || post.postType === 'image' || !post.postType;
  const likesCount = post.like?.length || 0;
  const commentsCount = post.comments?.length || 0;
  
  // Intersection Observer for video autoplay
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(console.log);
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [isVideo]);

  // Handle different media types with robust URL fixing
  const renderMedia = () => {
    // Fix URL - handle localhost port issues
    let mediaUrl = post.postUrl;
    
    // Handle different localhost port configurations
    if (mediaUrl && mediaUrl.includes('localhost:3001')) {
      mediaUrl = mediaUrl.replace('localhost:3001', 'localhost:45799');
    } else if (mediaUrl && mediaUrl.startsWith('/uploads/')) {
      mediaUrl = `http://localhost:45799${mediaUrl}`;
    }
    
    // Generate backup URLs to try on failure
    const generateBackupUrls = (url) => {
      if (!url) return [];
      const backups = [];
      
      // Try different port configurations
      if (url.includes('45799')) {
        backups.push(url.replace('45799', '3001'));
      }
      if (url.includes('3001')) {
        backups.push(url.replace('3001', '45799'));
      }
      
      // Try different protocols
      if (url.startsWith('http://')) {
        backups.push(url.replace('http://', 'https://'));
      }
      if (url.startsWith('https://')) {
        backups.push(url.replace('https://', 'http://'));
      }
      
      // Try relative path
      const pathMatch = url.match(/\/uploads\/.*/);
      if (pathMatch) {
        backups.push(`http://localhost:45799${pathMatch[0]}`);
        backups.push(`http://localhost:3001${pathMatch[0]}`);
      }
      
      return [...new Set(backups)]; // Remove duplicates
    };
    
    const backupUrls = generateBackupUrls(mediaUrl);

    if (isVideo) {
      let attemptedUrls = []; // Track URLs we've already tried
      
      return (
          <video
            ref={videoRef}
            src={mediaUrl}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            onError={(e) => {
              console.error('Video load error for URL:', mediaUrl);
              console.error('Original URL:', post.postUrl);
              
              // Try alternative URLs for localhost videos
              const alternatives = [
                mediaUrl.replace('localhost:45799', 'localhost:3001'),
                mediaUrl.replace('localhost:3001', 'localhost:45799'),
                mediaUrl.replace(':45799', ':3001'),
                mediaUrl.replace(':3001', ':45799')
              ];
              
              const currentSrc = e.target.src;
              const nextUrl = alternatives.find(url => url !== currentSrc && url !== mediaUrl);
              
              if (nextUrl && !e.target.dataset.retried) {
                console.log('Trying alternative profile video URL:', nextUrl);
                e.target.dataset.retried = 'true';
                e.target.src = nextUrl;
                return;
              }
            
            // Track attempted URLs to avoid infinite loops
            if (!attemptedUrls.includes(e.target.src)) {
              attemptedUrls.push(e.target.src);
            }
            
            // Try backup URLs one by one
            const nextBackupUrl = backupUrls.find(url => !attemptedUrls.includes(url));
            
            if (nextBackupUrl) {
              attemptedUrls.push(nextBackupUrl);
              e.target.src = nextBackupUrl;
              return;
            }
            
            // If all backup URLs fail, show error placeholder
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            if (parent && !parent.querySelector('.error-placeholder')) {
              const errorDiv = document.createElement('div');
              errorDiv.className = `error-placeholder w-full h-full flex items-center justify-center ${
                theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
              }`;
              errorDiv.innerHTML = `
                <div class="text-center">
                  <div class="text-2xl mb-2">📹</div>
                  <div class="text-xs">Video unavailable</div>
                  <div class="text-xs text-gray-500 mt-1">Check backend server</div>
                </div>
              `;
              parent.appendChild(errorDiv);
            }
          }}
            onLoadedData={(e) => {
              // Ensure video starts playing once loaded
              const video = e.target;
              video.currentTime = 0;
              setTimeout(() => {
                video.play().catch(() => {});
              }, 100);
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
            console.error('Image load error for URL:', mediaUrl);
            console.error('Original URL:', post.postUrl);
            
            // Try alternative URL before showing placeholder
            const alternatives = [
              mediaUrl.replace('localhost:3001', 'localhost:45799'),
              mediaUrl.replace('localhost:45799', 'localhost:3001')
            ];
            
            for (const altUrl of alternatives) {
              if (altUrl !== mediaUrl) {
                console.log('Trying alternative image URL:', altUrl);
                e.target.src = altUrl;
                return;
              }
            }
            
            // If all alternatives fail, show placeholder
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
      className={`relative aspect-square overflow-hidden cursor-pointer group rounded-lg transition-all duration-300 shadow-sm hover:shadow-md ${
        theme === 'dark' 
          ? 'bg-gray-800 hover:bg-gray-750' 
          : 'bg-white hover:bg-gray-50 border border-gray-100'
      }`}
    >
      {/* Post Media */}
      <div className="relative w-full h-full">
        {renderMedia()}
      </div>

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

      {/* Video indicator */}
      {isVideo && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-black/70 backdrop-blur-sm rounded-full p-1.5">
            <VideoIcon className="w-3 h-3 text-white" />
          </div>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex items-center space-x-4 text-white text-sm font-medium">
          <div className="flex items-center space-x-1">
            <HeartIcon className="w-4 h-4" />
            <span>{likesCount}</span>
          </div>
          <div className="flex items-center space-x-1">
            <CommentIcon className="w-4 h-4" />
            <span>{commentsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getEmptyStateTitle(activeTab) {
  switch (activeTab) {
    case 'saved':
      return 'No saved posts';
    case 'draft':
      return 'No drafts yet';
    case 'tagged':
      return 'Photos of you';
    case 'uploads':
    default:
      return 'Share your first post';
  }
}

function getEmptyStateSubtitle(activeTab) {
  switch (activeTab) {
    case 'saved':
      return 'Save posts you want to see again';
    case 'draft':
      return 'Save drafts to publish later';
    case 'tagged':
      return 'When people tag you in posts, they\'ll appear here';
    case 'uploads':
    default:
      return 'Posts you share will appear on your profile';
  }
}

// Icon Components
function NoPostsIcon() {
  return (
    <svg className="w-20 h-20 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function VideoIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
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

function CloseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

function DocumentIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function EditIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function PublishIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}
