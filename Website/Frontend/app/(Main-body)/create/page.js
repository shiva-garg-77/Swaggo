"use client";

import { useState, useEffect, lazy, Suspense } from 'react';
import { useTheme } from '../../../Components/Helper/ThemeProvider';
import SplashScreen from '../../../Components/shared/SplashScreen';

// Lazy load CreatePostModal for better performance
const CreatePostModal = lazy(() => import('../../../Components/MainComponents/Post/CreatePostModal'));

export default function CreatePage() {
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);

  // Automatically show the modal when page loads
  useEffect(() => {
    setShowModal(true);
  }, []);

  const handleClose = () => {
    setShowModal(false);
    // Redirect back to home or previous page
    window.history.back();
  };

  const handleSuccess = () => {
    setShowModal(false);
    // Redirect to home after successful post creation
    window.location.href = '/home';
  };

  return (
    <>
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className={`text-center max-w-md mx-auto ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <h1 className="text-2xl font-semibold mb-4">Create New Post</h1>
          <p className={`mb-6 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Share your moments with the world
          </p>
          
          {!showModal && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Create Post
            </button>
          )}
        </div>
      </div>

      {/* Create Post Modal with Suspense */}
      <Suspense fallback={<SplashScreen compact show />}>
        <CreatePostModal
          isOpen={showModal}
          onClose={handleClose}
          theme={theme}
          onPostSuccess={handleSuccess}
        />
      </Suspense>
    </>
  )
}
