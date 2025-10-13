'use client';

import React from 'react';
import { getValidImageUrl, handleImageError } from '../../utils/timeFormatter';

export default function MemberList({ chat, currentUser, onMemberClick }) {
  if (!chat || !chat.participants || chat.participants.length === 0) {
    return null;
  }

  // Filter out current user and get other participants
  const otherParticipants = chat.participants.filter(
    participant => (participant.profileid || participant.id) !== (currentUser?.profileid || currentUser?.id)
  );

  // For direct chats, show the other participant
  // For group chats, show all participants
  const membersToShow = chat.chatType === 'group' 
    ? chat.participants 
    : otherParticipants.length > 0 
      ? [otherParticipants[0]] 
      : [];

  if (membersToShow.length === 0) {
    return null;
  }

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
        {chat.chatType === 'group' ? 'Members' : 'Chat with'}
      </h3>
      <div className="flex flex-wrap gap-2">
        {membersToShow.map((member) => (
          <div 
            key={member.profileid || member.id}
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => onMemberClick && onMemberClick(member)}
          >
            <div className="relative">
              <img
                src={getValidImageUrl(member.profilePic)}
                alt={member.username}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                onError={(e) => handleImageError(e)}
              />
              {/* Online status indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800 rounded-full group-hover:bg-green-500 transition-colors"></div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate max-w-[60px]">
              {member.name || member.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}