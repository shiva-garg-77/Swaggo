/**
 * Video utility functions for safe play/pause operations
 * Prevents AbortError warnings by properly handling video promises
 */

/**
 * Safely play a video element
 * @param {HTMLVideoElement} videoElement - The video element to play
 * @param {Function} onSuccess - Callback when play succeeds
 * @param {Function} onError - Callback when play fails
 * @returns {Promise|undefined} - The play promise if supported
 */
export const safeVideoPlay = async (videoElement, onSuccess = null, onError = null) => {
  if (!videoElement) return;

  try {
    const playPromise = videoElement.play();
    
    if (playPromise !== undefined) {
      await playPromise;
      onSuccess?.();
    }
  } catch (error) {
    // Handle common video play errors gracefully
    if (error.name === 'AbortError' || error.message.includes('interrupted')) {
      // Don't log interruption errors as they're normal behavior
      // console.log('Video play was interrupted');
    } else if (error.name === 'NotAllowedError') {
      console.log('Video play was prevented by browser policy');
    } else {
      console.log('Video play failed:', error.message);
    }
    onError?.(error);
  }
};

/**
 * Safely pause a video element
 * @param {HTMLVideoElement} videoElement - The video element to pause
 * @param {Function} onPause - Callback when pause completes
 */
export const safeVideoPause = (videoElement, onPause = null) => {
  if (!videoElement) return;

  try {
    videoElement.pause();
    onPause?.();
  } catch (error) {
    console.log('Video pause failed:', error.message);
  }
};

/**
 * Toggle video play/pause state safely
 * @param {HTMLVideoElement} videoElement - The video element
 * @param {boolean} isPlaying - Current playing state
 * @param {Function} onPlay - Callback when play starts
 * @param {Function} onPause - Callback when pause occurs
 */
export const toggleVideoPlayPause = (videoElement, isPlaying, onPlay = null, onPause = null) => {
  if (!videoElement) return;

  if (isPlaying) {
    safeVideoPause(videoElement, onPause);
  } else {
    safeVideoPlay(videoElement, onPlay, (error) => {
      console.log('Video play toggle failed:', error.message);
    });
  }
};

/**
 * Set video volume safely
 * @param {HTMLVideoElement} videoElement - The video element
 * @param {number} volume - Volume level (0-1)
 */
export const setVideoVolume = (videoElement, volume) => {
  if (!videoElement) return;
  
  try {
    videoElement.volume = Math.max(0, Math.min(1, volume));
  } catch (error) {
    console.log('Video volume change failed:', error.message);
  }
};

/**
 * Set video mute state safely
 * @param {HTMLVideoElement} videoElement - The video element
 * @param {boolean} muted - Mute state
 */
export const setVideoMuted = (videoElement, muted) => {
  if (!videoElement) return;
  
  try {
    videoElement.muted = muted;
  } catch (error) {
    console.log('Video mute change failed:', error.message);
  }
};
