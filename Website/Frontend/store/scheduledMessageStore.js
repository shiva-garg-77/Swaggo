import { create } from 'zustand';

export const useScheduledMessageStore = create((set, get) => ({
  scheduledMessages: [],
  isLoading: false,
  error: null,

  setScheduledMessages: (messages) => set({ scheduledMessages: messages }),
  
  addScheduledMessage: (message) => set((state) => ({
    scheduledMessages: [message, ...state.scheduledMessages]
  })),
  
  updateScheduledMessage: (id, updates) => set((state) => ({
    scheduledMessages: state.scheduledMessages.map(m =>
      m.scheduledMessageId === id ? { ...m, ...updates } : m
    )
  })),
  
  removeScheduledMessage: (id) => set((state) => ({
    scheduledMessages: state.scheduledMessages.filter(m => m.scheduledMessageId !== id)
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null })
}));
