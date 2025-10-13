/**
 * 🚀 MODERN STATE MANAGEMENT - ZUSTAND + REACT QUERY
 * Latest technologies for perfect 10/10 performance
 * 
 * DEPRECATED: Use useUnifiedStore instead
 */

import { useUnifiedStore } from './useUnifiedStore';

// 🏪 Global App Store with Zustand (Latest)
export const useAppStore = () => {
  console.warn('useAppStore is deprecated. Use useUnifiedStore instead.');
  return useUnifiedStore();
};

// 🎯 Performance selector hooks (deprecated)
export const useUser = () => {
  console.warn('useUser is deprecated. Use useCurrentUser from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.auth.user);
};

export const useAuth = () => {
  console.warn('useAuth is deprecated. Use useAuth from useUnifiedStore instead.');
  return useUnifiedStore((state) => ({
    user: state.auth.user,
    isAuthenticated: state.auth.isAuthenticated,
    setUser: state.login,
    logout: state.logout,
  }));
};

export const useTheme = () => {
  console.warn('useTheme is deprecated. Use useTheme from useUnifiedStore instead.');
  return useUnifiedStore((state) => ({
    theme: state.ui.theme,
    setTheme: state.setTheme,
  }));
};

export const useUI = () => {
  console.warn('useUI is deprecated. Use useUI from useUnifiedStore instead.');
  return useUnifiedStore((state) => ({
    sidebarOpen: !state.ui.sidebarCollapsed,
    loading: Object.values(state.ui.loadingStates).some(loading => loading),
    notifications: state.ui.notifications,
    toggleSidebar: state.toggleSidebar,
    setLoading: state.setLoading,
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
  }));
};
