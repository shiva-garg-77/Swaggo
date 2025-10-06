'use client';

import React, { useState } from 'react';
import { Phone, Video, PhoneCall, PhoneIncoming, PhoneMissed, Clock, Calendar, User, Search, Filter, MoreVertical, Trash2, Info } from 'lucide-react';
import { useTheme } from '../Helper/ThemeProvider';

const CallHistory = ({ 
  callHistory = [], 
  onCallBack, 
  onDeleteCall, 
  onCallInfo,
  currentUser 
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'incoming', 'outgoing', 'missed'
  const [selectedCalls, setSelectedCalls] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filter and search calls
  const filteredCalls = callHistory.filter(call => {
    // Search filter
    const matchesSearch = !searchQuery || 
      call.participants?.some(p => 
        p.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Type filter
    const matchesType = filterType === 'all' || 
      (filterType === 'missed' && call.status === 'missed') ||
      (filterType === 'incoming' && call.direction === 'incoming' && call.status !== 'missed') ||
      (filterType === 'outgoing' && call.direction === 'outgoing');

    return matchesSearch && matchesType;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const callTime = new Date(timestamp);
    const diffInHours = (now - callTime) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return callTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return callTime.toLocaleDateString([], { weekday: 'short' });
    } else {
      return callTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getCallIcon = (call) => {
    if (call.status === 'missed') {
      return <PhoneMissed className="w-5 h-5 text-red-500" />;
    } else if (call.direction === 'incoming') {
      return <PhoneIncoming className="w-5 h-5 text-green-500" />;
    } else {
      return <PhoneCall className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCallTypeIcon = (type) => {
    return type === 'video' ? 
      <Video className="w-4 h-4" /> : 
      <Phone className="w-4 h-4" />;
  };

  const handleSelectCall = (callId) => {
    setSelectedCalls(prev => 
      prev.includes(callId) 
        ? prev.filter(id => id !== callId)
        : [...prev, callId]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedCalls.length > 0) {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    selectedCalls.forEach(callId => {
      if (onDeleteCall) onDeleteCall(callId);
    });
    setSelectedCalls([]);
    setShowDeleteConfirm(false);
  };

  const getCallStatusText = (call) => {
    if (call.status === 'missed') {
      return call.direction === 'incoming' ? 'Missed call' : 'Call not answered';
    } else if (call.duration > 0) {
      return formatDuration(Math.floor(call.duration / 1000));
    } else {
      return 'Call ended';
    }
  };

  return (
    <div className={`flex flex-col h-full ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Call History</h2>
          {selectedCalls.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete ({selectedCalls.length})</span>
            </button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-2 mb-3">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
          >
            <option value="all">All Calls</option>
            <option value="missed">Missed</option>
            <option value="incoming">Incoming</option>
            <option value="outgoing">Outgoing</option>
          </select>
        </div>

        {/* Filter Stats */}
        <div className="flex space-x-4 text-sm">
          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Total: {filteredCalls.length}
          </span>
          <span className="text-red-500">
            Missed: {filteredCalls.filter(c => c.status === 'missed').length}
          </span>
          <span className="text-green-500">
            Answered: {filteredCalls.filter(c => c.status === 'completed' && c.duration > 0).length}
          </span>
        </div>
      </div>

      {/* Call List */}
      <div className="flex-1 overflow-y-auto">
        {filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <Phone className={`w-16 h-16 mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-lg font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {searchQuery || filterType !== 'all' ? 'No matching calls' : 'No calls yet'}
            </h3>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Your call history will appear here'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCalls.map((call, index) => {
              const participant = call.participants?.[0];
              const isSelected = selectedCalls.includes(call.id);
              
              return (
                <div
                  key={call.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Selection Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectCall(call.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />

                    {/* Call Direction Icon */}
                    <div className="flex-shrink-0">
                      {getCallIcon(call)}
                    </div>

                    {/* Participant Avatar */}
                    <img
                      src={participant?.profilePic || '/default-avatar.png'}
                      alt={participant?.username || 'Unknown'}
                      className="w-12 h-12 rounded-full"
                    />

                    {/* Call Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium truncate">
                            {participant?.username || 'Unknown'}
                          </h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            {getCallTypeIcon(call.type)}
                            <span>{getCallStatusText(call)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTime(call.timestamp)}
                          </span>
                          
                          {/* Call Actions */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => onCallBack?.(call.chatId, call.type, participant?.profileid)}
                              className={`p-1.5 rounded-full transition-colors ${
                                theme === 'dark'
                                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                              }`}
                              title={`Call ${participant?.username} back`}
                            >
                              {call.type === 'video' ? (
                                <Video className="w-4 h-4" />
                              ) : (
                                <Phone className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              onClick={() => onCallInfo?.(call)}
                              className={`p-1.5 rounded-full transition-colors ${
                                theme === 'dark'
                                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                              }`}
                              title="Call info"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Call Quality Indicator */}
                      {call.quality && call.status === 'completed' && (
                        <div className="flex items-center space-x-2 mt-1">
                          <div className={`flex space-x-1`}>
                            {[1, 2, 3, 4, 5].map(i => (
                              <div
                                key={i}
                                className={`w-1 h-3 rounded-full ${
                                  i <= (call.quality === 'excellent' ? 5 : 
                                        call.quality === 'good' ? 4 :
                                        call.quality === 'fair' ? 3 : 2)
                                    ? 'bg-green-500'
                                    : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {call.quality} quality
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-sm w-full mx-4 ${
            theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <h3 className="text-lg font-semibold mb-2">Delete Calls</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete {selectedCalls.length} call{selectedCalls.length > 1 ? 's' : ''}? 
              This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallHistory;
