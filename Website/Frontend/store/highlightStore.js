import { create } from 'zustand';

/**
 * Highlight Store
 * Manages story highlights state and viewer
 */
export const useHighlightStore = create((set, get) => ({
  // State
  highlights: [],
  currentHighlight: null,
  currentStoryIndex: 0,
  isPlaying: true,
  isViewerOpen: false,

  // Actions
  setHighlights: (highlights) => set({ highlights }),

  addHighlight: (highlight) => set((state) => ({
    highlights: [highlight, ...state.highlights]
  })),

  updateHighlight: (highlightid, updates) => set((state) => ({
    highlights: state.highlights.map(h =>
      h.highlightid === highlightid ? { ...h, ...updates } : h
    ),
    currentHighlight: state.currentHighlight?.highlightid === highlightid
      ? { ...state.currentHighlight, ...updates }
      : state.currentHighlight
  })),

  removeHighlight: (highlightid) => set((state) => ({
    highlights: state.highlights.filter(h => h.highlightid !== highlightid),
    currentHighlight: state.currentHighlight?.highlightid === highlightid
      ? null
      : state.currentHighlight,
    isViewerOpen: state.currentHighlight?.highlightid === highlightid
      ? false
      : state.isViewerOpen
  })),

  // Viewer controls
  openViewer: (highlight, startIndex = 0) => set({
    currentHighlight: highlight,
    currentStoryIndex: startIndex,
    isPlaying: true,
    isViewerOpen: true
  }),

  closeViewer: () => set({
    currentHighlight: null,
    currentStoryIndex: 0,
    isPlaying: true,
    isViewerOpen: false
  }),

  nextStory: () => set((state) => {
    const stories = state.currentHighlight?.stories || [];
    if (state.currentStoryIndex < stories.length - 1) {
      return { currentStoryIndex: state.currentStoryIndex + 1 };
    }
    return { isViewerOpen: false, currentHighlight: null, currentStoryIndex: 0 };
  }),

  previousStory: () => set((state) => {
    if (state.currentStoryIndex > 0) {
      return { currentStoryIndex: state.currentStoryIndex - 1 };
    }
    return {};
  }),

  setStoryIndex: (index) => set({ currentStoryIndex: index }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setPlaying: (isPlaying) => set({ isPlaying })
}));
