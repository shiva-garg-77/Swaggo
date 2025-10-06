'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, Edit3, Trash2, Clock, Bell, Calendar, Search, 
  Filter, Star, Tag, MessageSquare, Save, AlertTriangle, 
  CheckCircle, Circle, Archive, Pin, Share2, Copy, Download,
  StickyNote, Timer, AlarmClock, Bookmark, ChevronDown, ChevronUp,
  MoreHorizontal, Palette, Type, Bold, Italic, List, Hash
} from 'lucide-react';

const REMINDER_TYPES = [
  { id: 'once', label: 'One Time', icon: '🔔' },
  { id: 'daily', label: 'Daily', icon: '📅' },
  { id: 'weekly', label: 'Weekly', icon: '📆' },
  { id: 'monthly', label: 'Monthly', icon: '🗓️' }
];

const NOTE_COLORS = [
  { name: 'Yellow', value: '#FEF3C7', text: '#92400E' },
  { name: 'Blue', value: '#DBEAFE', text: '#1E3A8A' },
  { name: 'Green', value: '#D1FAE5', text: '#065F46' },
  { name: 'Pink', value: '#FCE7F3', text: '#9D174D' },
  { name: 'Purple', value: '#E9D5FF', text: '#6B21A8' },
  { name: 'Orange', value: '#FED7AA', text: '#9A3412' },
  { name: 'Gray', value: '#F3F4F6', text: '#374151' },
  { name: 'Red', value: '#FEE2E2', text: '#991B1B' }
];

const PRIORITY_LEVELS = [
  { id: 'low', label: 'Low', color: 'text-green-600', bg: 'bg-green-100' },
  { id: 'medium', label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { id: 'high', label: 'High', color: 'text-red-600', bg: 'bg-red-100' }
];

const NotesRemindersSystem = ({ 
  chatId, 
  user, 
  isVisible, 
  onClose, 
  onAddNoteToMessage, 
  onAddReminderToMessage 
}) => {
  const [activeTab, setActiveTab] = useState('notes');
  const [notes, setNotes] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isCreatingReminder, setIsCreatingReminder] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  
  // New note/reminder form states
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    tags: [],
    color: NOTE_COLORS[0],
    priority: 'medium',
    isPinned: false,
    isArchived: false
  });
  
  const [reminderForm, setReminderForm] = useState({
    title: '',
    description: '',
    dateTime: '',
    type: 'once',
    priority: 'medium',
    isCompleted: false,
    notificationSent: false,
    tags: []
  });

  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  
  const noteInputRef = useRef(null);
  const reminderInputRef = useRef(null);

  // Load notes and reminders from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(`notes_${chatId}`);
    const savedReminders = localStorage.getItem(`reminders_${chatId}`);
    
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
    
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }
    
    // Load available tags
    const savedTags = localStorage.getItem(`tags_${chatId}`);
    if (savedTags) {
      setAvailableTags(JSON.parse(savedTags));
    }
  }, [chatId]);

  // Save to localStorage when notes or reminders change
  useEffect(() => {
    localStorage.setItem(`notes_${chatId}`, JSON.stringify(notes));
  }, [notes, chatId]);

  useEffect(() => {
    localStorage.setItem(`reminders_${chatId}`, JSON.stringify(reminders));
  }, [reminders, chatId]);

  useEffect(() => {
    localStorage.setItem(`tags_${chatId}`, JSON.stringify(availableTags));
  }, [availableTags, chatId]);

  // Check for due reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date().getTime();
      reminders.forEach(reminder => {
        if (!reminder.notificationSent && !reminder.isCompleted) {
          const reminderTime = new Date(reminder.dateTime).getTime();
          if (now >= reminderTime) {
            // Show notification
            if (Notification.permission === 'granted') {
              new Notification(`Reminder: ${reminder.title}`, {
                body: reminder.description,
                icon: '/favicon.ico'
              });
            } else {
              alert(`Reminder: ${reminder.title}\n${reminder.description}`);
            }
            
            // Mark as notification sent
            setReminders(prev => prev.map(r => 
              r.id === reminder.id ? { ...r, notificationSent: true } : r
            ));
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminders]);

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Helper functions
  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  const addTag = (tag) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !availableTags.includes(trimmedTag)) {
      setAvailableTags(prev => [...prev, trimmedTag]);
    }
  };

  const removeTag = (tagToRemove, type) => {
    if (type === 'note') {
      setNoteForm(prev => ({
        ...prev,
        tags: prev.tags.filter(tag => tag !== tagToRemove)
      }));
    } else {
      setReminderForm(prev => ({
        ...prev,
        tags: prev.tags.filter(tag => tag !== tagToRemove)
      }));
    }
  };

  // Note operations
  const createNote = () => {
    if (!noteForm.title.trim() && !noteForm.content.trim()) return;
    
    const newNote = {
      id: generateId(),
      ...noteForm,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chatId,
      userId: user?.id
    };

    setNotes(prev => [newNote, ...prev]);
    
    // Add tags to available tags
    noteForm.tags.forEach(addTag);
    
    // Reset form
    setNoteForm({
      title: '',
      content: '',
      tags: [],
      color: NOTE_COLORS[0],
      priority: 'medium',
      isPinned: false,
      isArchived: false
    });
    
    setIsCreatingNote(false);
  };

  const updateNote = (noteId, updates) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    ));
  };

  const deleteNote = (noteId) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const duplicateNote = (note) => {
    const newNote = {
      ...note,
      id: generateId(),
      title: `${note.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false
    };
    setNotes(prev => [newNote, ...prev]);
  };

  // Reminder operations
  const createReminder = () => {
    if (!reminderForm.title.trim() || !reminderForm.dateTime) return;
    
    const newReminder = {
      id: generateId(),
      ...reminderForm,
      createdAt: new Date().toISOString(),
      chatId,
      userId: user?.id
    };

    setReminders(prev => [newReminder, ...prev]);
    
    // Add tags to available tags
    reminderForm.tags.forEach(addTag);
    
    // Reset form
    setReminderForm({
      title: '',
      description: '',
      dateTime: '',
      type: 'once',
      priority: 'medium',
      isCompleted: false,
      notificationSent: false,
      tags: []
    });
    
    setIsCreatingReminder(false);
  };

  const updateReminder = (reminderId, updates) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === reminderId 
        ? { ...reminder, ...updates }
        : reminder
    ));
  };

  const deleteReminder = (reminderId) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
  };

  const toggleReminderComplete = (reminderId) => {
    updateReminder(reminderId, { 
      isCompleted: !reminders.find(r => r.id === reminderId)?.isCompleted 
    });
  };

  // Filter functions
  const filteredNotes = notes.filter(note => {
    if (note.isArchived && !showCompleted) return false;
    if (searchQuery && !note.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !note.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterTag && !note.tags.includes(filterTag)) return false;
    return true;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const filteredReminders = reminders.filter(reminder => {
    if (reminder.isCompleted && !showCompleted) return false;
    if (searchQuery && !reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !reminder.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterTag && !reminder.tags.includes(filterTag)) return false;
    return true;
  }).sort((a, b) => {
    if (a.isCompleted && !b.isCompleted) return 1;
    if (!a.isCompleted && b.isCompleted) return -1;
    return new Date(a.dateTime) - new Date(b.dateTime);
  });

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Notes & Reminders</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'notes' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <StickyNote className="w-4 h-4 inline mr-2" />
            Notes
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'reminders' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bell className="w-4 h-4 inline mr-2" />
            Reminders
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Tags</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>#{tag}</option>
            ))}
          </select>
          
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`p-2 rounded-lg transition-colors ${
              showCompleted ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}
            title={`${showCompleted ? 'Hide' : 'Show'} ${activeTab === 'notes' ? 'archived' : 'completed'}`}
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'notes' && (
          <div className="p-4">
            {/* Create Note Button */}
            <button
              onClick={() => setIsCreatingNote(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 mb-4"
            >
              <Plus className="w-5 h-5" />
              Create New Note
            </button>

            {/* Create Note Form */}
            <AnimatePresence>
              {isCreatingNote && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-4 p-4 border border-gray-200 rounded-lg"
                  style={{ backgroundColor: noteForm.color.value }}
                >
                  <input
                    ref={noteInputRef}
                    type="text"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Note title..."
                    className="w-full mb-3 p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <textarea
                    value={noteForm.content}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your note..."
                    className="w-full mb-3 p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={4}
                  />
                  
                  {/* Tag input */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {noteForm.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                        >
                          #{tag}
                          <button
                            onClick={() => removeTag(tag, 'note')}
                            className="hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          const tag = tagInput.trim().toLowerCase();
                          if (!noteForm.tags.includes(tag)) {
                            setNoteForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                          }
                          setTagInput('');
                        }
                      }}
                      placeholder="Add tags (press Enter)..."
                      className="w-full p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  
                  {/* Color picker */}
                  <div className="flex gap-2 mb-3">
                    {NOTE_COLORS.map(color => (
                      <button
                        key={color.name}
                        onClick={() => setNoteForm(prev => ({ ...prev, color }))}
                        className={`w-6 h-6 rounded-full border-2 ${
                          noteForm.color.name === color.name ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  
                  {/* Priority selector */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={noteForm.priority}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PRIORITY_LEVELS.map(level => (
                        <option key={level.id} value={level.id}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNoteForm(prev => ({ ...prev, isPinned: !prev.isPinned }))}
                        className={`p-2 rounded transition-colors ${
                          noteForm.isPinned ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                        }`}
                        title="Pin Note"
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsCreatingNote(false)}
                        className="px-3 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createNote}
                        className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        <Save className="w-4 h-4 inline mr-1" />
                        Save
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notes List */}
            <div className="space-y-3">
              {filteredNotes.map(note => (
                <motion.div
                  key={note.id}
                  layout
                  className="p-4 rounded-lg shadow-sm border relative group"
                  style={{ backgroundColor: note.color.value, color: note.color.text }}
                >
                  {note.isPinned && (
                    <Pin className="absolute top-2 right-2 w-4 h-4 text-yellow-600" />
                  )}
                  
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm pr-6">{note.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      PRIORITY_LEVELS.find(p => p.id === note.priority)?.bg
                    } ${PRIORITY_LEVELS.find(p => p.id === note.priority)?.color}`}>
                      {PRIORITY_LEVELS.find(p => p.id === note.priority)?.label}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-3 whitespace-pre-wrap">{note.content}</p>
                  
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {note.tags.map(tag => (
                        <span key={tag} className="px-1 py-0.5 bg-black bg-opacity-10 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-xs opacity-70">
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => duplicateNote(note)}
                        className="p-1 hover:bg-black hover:bg-opacity-10 rounded"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}
                        className="p-1 hover:bg-black hover:bg-opacity-10 rounded"
                        title={note.isPinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={() => updateNote(note.id, { isArchived: !note.isArchived })}
                        className="p-1 hover:bg-black hover:bg-opacity-10 rounded"
                        title={note.isArchived ? 'Unarchive' : 'Archive'}
                      >
                        <Archive className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1 hover:bg-red-200 rounded text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="p-4">
            {/* Create Reminder Button */}
            <button
              onClick={() => setIsCreatingReminder(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600 mb-4"
            >
              <Plus className="w-5 h-5" />
              Create New Reminder
            </button>

            {/* Create Reminder Form */}
            <AnimatePresence>
              {isCreatingReminder && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-4 p-4 border border-gray-200 rounded-lg bg-white"
                >
                  <input
                    ref={reminderInputRef}
                    type="text"
                    value={reminderForm.title}
                    onChange={(e) => setReminderForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Reminder title..."
                    className="w-full mb-3 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <textarea
                    value={reminderForm.description}
                    onChange={(e) => setReminderForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description (optional)..."
                    className="w-full mb-3 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                      <input
                        type="datetime-local"
                        value={reminderForm.dateTime}
                        onChange={(e) => setReminderForm(prev => ({ ...prev, dateTime: e.target.value }))}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={reminderForm.priority}
                        onChange={(e) => setReminderForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {PRIORITY_LEVELS.map(level => (
                          <option key={level.id} value={level.id}>{level.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Tag input */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {reminderForm.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                        >
                          #{tag}
                          <button
                            onClick={() => removeTag(tag, 'reminder')}
                            className="hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          const tag = tagInput.trim().toLowerCase();
                          if (!reminderForm.tags.includes(tag)) {
                            setReminderForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                          }
                          setTagInput('');
                        }
                      }}
                      placeholder="Add tags (press Enter)..."
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsCreatingReminder(false)}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createReminder}
                      className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      <Bell className="w-4 h-4 inline mr-1" />
                      Create
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reminders List */}
            <div className="space-y-3">
              {filteredReminders.map(reminder => (
                <motion.div
                  key={reminder.id}
                  layout
                  className={`p-4 rounded-lg shadow-sm border relative group ${
                    reminder.isCompleted ? 'opacity-60 bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleReminderComplete(reminder.id)}
                      className="mt-0.5 text-blue-500 hover:text-blue-700"
                    >
                      {reminder.isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-medium text-sm ${
                          reminder.isCompleted ? 'line-through' : ''
                        }`}>
                          {reminder.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          PRIORITY_LEVELS.find(p => p.id === reminder.priority)?.bg
                        } ${PRIORITY_LEVELS.find(p => p.id === reminder.priority)?.color}`}>
                          {PRIORITY_LEVELS.find(p => p.id === reminder.priority)?.label}
                        </span>
                      </div>
                      
                      {reminder.description && (
                        <p className="text-sm text-gray-600 mb-2">{reminder.description}</p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(reminder.dateTime).toLocaleString()}</span>
                        {new Date(reminder.dateTime).getTime() < Date.now() && !reminder.isCompleted && (
                          <span className="text-red-500 font-medium">Overdue</span>
                        )}
                      </div>
                      
                      {reminder.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {reminder.tags.map(tag => (
                            <span key={tag} className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NotesRemindersSystem;
