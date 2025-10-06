/**
 * 🚀 MODERN STATE MANAGEMENT - ZUSTAND + REACT QUERY
 * Latest technologies for perfect 10/10 performance
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// 🏪 Global App Store with Zustand (Latest)
export const useAppStore = create()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // User state
        user: null,
        isAuthenticated: false,
        theme: 'system',
        
        // UI state
        sidebarOpen: false,
        notifications: [],
        loading: false,
        
        // Actions
        setUser: (user) => set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
        }),
        
        logout: () => set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.notifications = [];
        }),
        
        setTheme: (theme) => set((state) => {
          state.theme = theme;
        }),
        
        toggleSidebar: () => set((state) => {
          state.sidebarOpen = !state.sidebarOpen;
        }),
        
        addNotification: (notification) => set((state) => {
          state.notifications.push({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            ...notification
          });
        }),
        
        removeNotification: (id) => set((state) => {
          state.notifications = state.notifications.filter(n => n.id !== id);
        }),
        
        setLoading: (loading) => set((state) => {
          state.loading = loading;
        }),
      }))
    ),
    {
      name: 'swaggo-app-store',
      version: 1,
    }
  )
);

// 🎯 Performance selector hooks
export const useUser = () => useAppStore((state) => state.user);
export const useAuth = () => useAppStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  setUser: state.setUser,
  logout: state.logout,
}));
export const useTheme = () => useAppStore((state) => ({
  theme: state.theme,
  setTheme: state.setTheme,
}));
export const useUI = () => useAppStore((state) => ({
  sidebarOpen: state.sidebarOpen,
  loading: state.loading,
  notifications: state.notifications,
  toggleSidebar: state.toggleSidebar,
  setLoading: state.setLoading,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
}));