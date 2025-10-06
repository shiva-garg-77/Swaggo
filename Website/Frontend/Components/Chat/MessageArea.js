'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useSecureAuth } from '../../context/FixedSecureAuthContext';
import { useSocket } from '../Helper/PerfectSocketProvider';
import { useTheme } from '../Helper/ThemeProvider';
import { GET_MESSAGES_BY_CHAT, SEND_MESSAGE, EDIT_MESSAGE, DELETE_MESSAGE } from './queries';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';
import ChatInfoModal from './ChatInfoModal';
import VoiceCallModal from './VoiceCallModal';
import VideoCallModal from './VideoCallModal';
import EnvCheck from './EnvCheck';

export default function MessageArea({ 
  selectedChat, 
  user,
  socket,
  isConnected
}) {
  const { theme } = useTheme();
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [allMessages, setAllMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  
  // Modal states
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState(null);
  
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch messages for the selected chat
  const { data: messagesData, loading, refetch: refetchMessages } = useQuery(GET_MESSAGES_BY_CHAT, {
    variables: { chatid: selectedChat?.chatid, limit: 50, offset: 0 },
    skip: !selectedChat?.chatid,
    onCompleted: (data) => {
      setAllMessages(data.getMessagesByChat || []);
    }
  });

  // Send message mutation
  const [sendMessageMutation] = useMutation(SEND_MESSAGE, {
    onCompleted: (data) => {
      // Message will be added via socket event
      scrollToBottom();
    },
    onError: (error) => {
      console.error('Error sending message:', error);
    }
  });

  // Edit message mutation
  const [editMessageMutation] = useMutation(EDIT_MESSAGE, {
    onCompleted: () => {
      refetchMessages();
    },
    onError: (error) => {
      console.error('Error editing message:', error);
    }
  });

  // Delete message mutation
  const [deleteMessageMutation] = useMutation(DELETE_MESSAGE, {
    onCompleted: () => {
      refetchMessages();
    },
    onError: (error) => {
      console.error('Error deleting message:', error);
    }
  });

  // Join/Leave chat when selected chat changes
  useEffect(() => {
    if (socket && selectedChat?.chatid) {
      console.log('Joining chat:', selectedChat.chatid);
      socket.emit('join_chat', selectedChat.chatid);
      
      return () => {
        console.log('Leaving chat:', selectedChat.chatid);
        socket.emit('leave_chat', selectedChat.chatid);
      };
    }
  }, [socket, selectedChat]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      console.log('📩 New message received:', data);
      if (data.chatid === selectedChat?.chatid || data.chat?.chatid === selectedChat?.chatid) {
        const message = data.message || data;
        setAllMessages(prev => {
          // Avoid duplicate messages
          if (prev.find(m => m.messageid === message.messageid)) {
            return prev;
          }
          return [...prev, message];
        });
      }
    };

    const handleUserTyping = (data) => {
      if (data.chatid === selectedChat?.chatid && data.profileid !== user.profileid) {
        setTypingUsers(prev => ({
          ...prev,
          [data.profileid]: data.isTyping ? data.username : undefined
        }));
        
        // Clear typing after 3 seconds
        if (data.isTyping) {
          setTimeout(() => {
            setTypingUsers(prev => {
              const newTyping = { ...prev };
              delete newTyping[data.profileid];
              return newTyping;
            });
          }, 3000);
        }
      }
    };

    const handleMessageDelivered = (data) => {
      console.log('✅ Message delivered:', data);
      // Update message status if needed
    };

    const handleCallIncoming = (data) => {
      console.log('📞 Incoming call:', data);
      
      // Validate incoming call data
      if (!data.callType || !data.caller) {
        console.error('❌ Invalid incoming call data:', data);
        return;
      }
      
      // Check if already in a call
      if (isInCall) {
        console.log('📞 Rejecting incoming call - already in call');
        if (socket && data.callId) {
          socket.emit('decline_call', {
            callId: data.callId,
            reason: 'busy'
          });
        }
        return;
      }
      
      // Set call state based on call type
      const callType = data.callType.toLowerCase();
      
      if (callType === 'voice') {
        setShowVoiceCall(true);
        setCallType('voice');
      } else if (callType === 'video') {
        setShowVideoCall(true);
        setCallType('video');
      } else {
        console.error('❌ Unknown call type:', data.callType);
        return;
      }
      
      setIsInCall(true);
      
      // Store call data for later use
      window.currentIncomingCall = data;
    };

    const handleCallEnded = (data) => {
      console.log('📵 Call ended:', data);
      
      // Show end reason if provided
      if (data.reason && data.reason !== 'normal' && data.reason !== 'user_ended') {
        let message = 'Call ended';
        switch (data.reason) {
          case 'no_answer':
            message = 'Call ended - No answer';
            break;
          case 'declined':
            message = 'Call declined by other party';
            break;
          case 'failed':
            message = 'Call failed due to connection issues';
            break;
          case 'timeout':
            message = 'Call ended - Connection timeout';
            break;
        }
        
        // Show brief notification
        setTimeout(() => alert(message), 500);
      }
      
      // Clean up call state
      setIsInCall(false);
      setShowVoiceCall(false);
      setShowVideoCall(false);
      setCallType(null);
      
      // Clean up stored call data
      delete window.currentIncomingCall;
    };
    
    // Handle call failure events
    const handleCallFailed = (data) => {
      console.error('📞 Call failed:', data);
      
      let errorMessage = 'Call failed';
      if (data.reason) {
        switch (data.reason) {
          case 'receiver_offline':
            errorMessage = 'User is currently offline';
            break;
          case 'network_error':
            errorMessage = 'Network connection error';
            break;
          case 'busy':
            errorMessage = 'User is currently busy';
            break;
          default:
            errorMessage = `Call failed: ${data.reason}`;
        }
      }
      
      alert(errorMessage);
      
      // Reset call state
      setIsInCall(false);
      setShowVoiceCall(false);
      setShowVideoCall(false);
      setCallType(null);
    };
    
    // Handle call timeout
    const handleCallTimeout = (data) => {
      console.log('⏰ Call timeout:', data);
      alert('Call timed out - no response from other party');
      
      // Reset call state
      setIsInCall(false);
      setShowVoiceCall(false);
      setShowVideoCall(false);
      setCallType(null);
    };

    // Register socket event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('message_received', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('typing_start', handleUserTyping);
    socket.on('typing_stop', handleUserTyping);
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('incoming_call', handleCallIncoming);
    socket.on('call_started', handleCallIncoming);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_failed', handleCallFailed);
    socket.on('call_timeout', handleCallTimeout);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_received', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('typing_start', handleUserTyping);
      socket.off('typing_stop', handleUserTyping);
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('incoming_call', handleCallIncoming);
      socket.off('call_started', handleCallIncoming);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_failed', handleCallFailed);
      socket.off('call_timeout', handleCallTimeout);
    };
  }, [socket, selectedChat, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Get chat display info
  const getChatDisplayInfo = () => {
    if (!selectedChat) return { name: '', avatar: '', subtitle: '' };
    
    // Check if participants array exists
    const participants = selectedChat.participants || [];
    
    if (selectedChat.chatType === 'group') {
      return {
        name: selectedChat.chatName || 'Group Chat',
        avatar: selectedChat.chatAvatar,
        subtitle: `${participants.length} members`
      };
    } else {
      // Direct chat - find the other participant
      const otherParticipant = participants.find(p => p.profileid !== user?.profileid);
      return {
        name: otherParticipant?.name || otherParticipant?.username || 'Unknown User',
        avatar: otherParticipant?.profilePic,
        subtitle: `@${otherParticipant?.username || 'unknown'}`
      };
    }
  };

  // Handle file upload
  const uploadFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  // Handle message sending
  const handleSendMessage = async (content, attachments = [], replyTo = null, mentions = []) => {
    if (!content.trim() && !attachments.length) return;

    console.log('📤 Sending message:', { content, attachments, chatid: selectedChat.chatid });

    try {
      // Process attachments - upload files first
      const processedAttachments = [];
      
      for (const attachment of attachments) {
        if (attachment.file) {
          try {
            // Upload the file
            const uploadResult = await uploadFile(attachment.file);
            processedAttachments.push({
              type: attachment.type,
              url: uploadResult.fileUrl,
              filename: uploadResult.originalname,
              size: uploadResult.size,
              mimetype: attachment.mimetype
            });
          } catch (uploadError) {
            console.error('File upload failed:', uploadError);
            // Continue without attachment if upload fails
          }
        } else {
          // Attachment already processed or URL-based
          processedAttachments.push(attachment);
        }
      }

      const messageData = {
        chatid: selectedChat.chatid,
        messageType: processedAttachments.length > 0 ? processedAttachments[0].type : 'text',
        content: content.trim(),
        attachments: processedAttachments,
        replyTo,
        mentions,
        clientMessageId: Date.now() + Math.random(),
        timestamp: new Date().toISOString()
      };

      // Send via Socket.io for real-time delivery (Primary method)
      if (socket && socket.connected) {
        console.log('🔌 Sending via Socket.io:', messageData);
        socket.emit('send_message', messageData, (acknowledgment) => {
          if (acknowledgment?.success) {
            console.log('✅ Message sent successfully via socket');
          } else {
            console.error('❌ Socket message send failed:', acknowledgment?.error);
            // Fallback to GraphQL if socket fails
            sendViaGraphQL(messageData);
          }
        });
      } else {
        console.log('🔌 Socket not connected, using GraphQL fallback');
        // Fallback to GraphQL if no socket connection
        await sendViaGraphQL(messageData);
      }
      
      // Optimistically add message to local state
      const optimisticMessage = {
        messageid: messageData.clientMessageId,
        messageType: messageData.messageType,
        content: messageData.content,
        attachments: messageData.attachments,
        sender: {
          profileid: user.profileid,
          username: user.username,
          profilePic: user.profilePic,
          name: user.name
        },
        replyTo: replyTo ? { messageid: replyTo, content: 'Reply' } : null,
        mentions: mentions,
        reactions: [],
        readBy: [],
        messageStatus: 'sending',
        createdAt: new Date().toISOString(),
        isOptimistic: true
      };
      
      setAllMessages(prev => [...prev, optimisticMessage]);
      scrollToBottom();
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      // Show error notification to user
      alert('Failed to send message. Please try again.');
    }
  };

  // GraphQL fallback function
  const sendViaGraphQL = async (messageData) => {
    try {
      console.log('🔍 Sending via GraphQL:', messageData);
      const result = await sendMessageMutation({
        variables: {
          chatid: messageData.chatid,
          messageType: messageData.messageType,
          content: messageData.content,
          attachments: messageData.attachments,
          replyTo: messageData.replyTo,
          mentions: messageData.mentions
        }
      });
      console.log('✅ GraphQL message sent:', result);
    } catch (error) {
      console.error('❌ GraphQL send failed:', error);
      throw error;
    }
  };

  // Handle reply to message
  const handleReplyToMessage = (message) => {
    setReplyingTo(message);
    // You could also scroll to input or focus it
  };

  // Handle edit message
  const handleEditMessage = async (message) => {
    const newContent = prompt('Edit message:', message.content);
    if (newContent !== null && newContent.trim() !== message.content) {
      try {
        await editMessageMutation({
          variables: {
            messageid: message.messageid,
            content: newContent.trim()
          }
        });
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageid) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessageMutation({
          variables: {
            messageid
          }
        });
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
  };

  // Enhanced voice call handling with acknowledgment and error handling
  const handleVoiceCall = async () => {
    if (!socket || !socket.connected) {
      alert('Connection unavailable. Please check your internet connection.');
      return;
    }
    
    if (!selectedChat || !selectedChat.participants) {
      alert('Cannot initiate call: Chat information unavailable.');
      return;
    }
    
    try {
      setCallType('voice');
      setShowVoiceCall(true);
      setIsInCall(true);
      
      // Find the other participant(s)
      const otherParticipants = selectedChat.participants.filter(p => p.profileid !== user?.profileid);
      
      if (otherParticipants.length === 0) {
        throw new Error('No other participants found in chat');
      }
      
      const receiverId = otherParticipants[0].profileid; // For 1-on-1 chats
      
      // Emit call initiation with acknowledgment
      const callInitiated = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Call initiation timeout'));
        }, 10000); // 10 second timeout
        
        socket.emit('initiate_call', {
          chatid: selectedChat.chatid,
          callType: 'voice',
          receiverId: receiverId,
          callId: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }, (acknowledgment) => {
          clearTimeout(timeout);
          if (acknowledgment && acknowledgment.success) {
            resolve(acknowledgment);
          } else {
            reject(new Error(acknowledgment?.error || 'Call initiation failed'));
          }
        });
      });
      
      console.log('✅ Voice call initiated successfully:', callInitiated);
      
    } catch (error) {
      console.error('❌ Failed to initiate voice call:', error);
      
      // Reset UI state
      setIsInCall(false);
      setShowVoiceCall(false);
      setCallType(null);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to start call. ';
      
      if (error.message.includes('timeout')) {
        errorMessage += 'Request timed out. Please try again.';
      } else if (error.message.includes('offline')) {
        errorMessage += 'The other user is currently offline.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    }
  };

  // Enhanced video call handling with acknowledgment and error handling
  const handleVideoCall = async () => {
    if (!socket || !socket.connected) {
      alert('Connection unavailable. Please check your internet connection.');
      return;
    }
    
    if (!selectedChat || !selectedChat.participants) {
      alert('Cannot initiate call: Chat information unavailable.');
      return;
    }
    
    // Check if browser supports video calls
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Video calls are not supported in your browser.');
      return;
    }
    
    try {
      // Request camera and microphone permissions first
      console.log('🎥 Requesting video call permissions...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      setCallType('video');
      setShowVideoCall(true);
      setIsInCall(true);
      
      // Find the other participant(s)
      const otherParticipants = selectedChat.participants.filter(p => p.profileid !== user?.profileid);
      
      if (otherParticipants.length === 0) {
        throw new Error('No other participants found in chat');
      }
      
      const receiverId = otherParticipants[0].profileid; // For 1-on-1 chats
      
      // Emit call initiation with acknowledgment
      const callInitiated = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Call initiation timeout'));
        }, 10000); // 10 second timeout
        
        socket.emit('initiate_call', {
          chatid: selectedChat.chatid,
          callType: 'video',
          receiverId: receiverId,
          callId: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }, (acknowledgment) => {
          clearTimeout(timeout);
          if (acknowledgment && acknowledgment.success) {
            resolve(acknowledgment);
          } else {
            reject(new Error(acknowledgment?.error || 'Call initiation failed'));
          }
        });
      });
      
      console.log('✅ Video call initiated successfully:', callInitiated);
      
    } catch (error) {
      console.error('❌ Failed to initiate video call:', error);
      
      // Reset UI state
      setIsInCall(false);
      setShowVideoCall(false);
      setCallType(null);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to start video call. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Camera and microphone access denied. Please allow permissions and try again.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'Camera or microphone not found. Please check your devices.';
      } else if (error.message.includes('timeout')) {
        errorMessage += 'Request timed out. Please try again.';
      } else if (error.message.includes('offline')) {
        errorMessage += 'The other user is currently offline.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    }
  };

  // Enhanced call ending with acknowledgment
  const handleEndCall = async () => {
    try {
      console.log('📵 Ending call...');
      
      // Emit call end event with acknowledgment if socket is available
      if (socket && socket.connected) {
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, 3000); // Don't wait more than 3 seconds
          
          socket.emit('end_call', {
            chatid: selectedChat.chatid,
            reason: 'user_ended'
          }, (acknowledgment) => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }
      
      console.log('✅ Call ended successfully');
      
    } catch (error) {
      console.error('❌ Error ending call:', error);
      // Continue with cleanup even if server communication fails
    } finally {
      // Always reset UI state
      setIsInCall(false);
      setShowVoiceCall(false);
      setShowVideoCall(false);
      setCallType(null);
    }
  };

  // Handle chat info
  const handleChatInfo = () => {
    setShowChatInfo(true);
  };

  // Format typing users
  const getTypingText = () => {
    const typingUserNames = Object.values(typingUsers);
    if (typingUserNames.length === 0) return '';
    
    if (typingUserNames.length === 1) {
      return `${typingUserNames[0]} is typing...`;
    } else if (typingUserNames.length === 2) {
      return `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`;
    } else {
      return `${typingUserNames[0]} and ${typingUserNames.length - 1} others are typing...`;
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  // Format date for display
  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Early return if no chat selected
  if (!selectedChat) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-pink-50 to-red-50 items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-200 to-red-200 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Messages</h3>
          <p className="text-gray-600 max-w-md">Select a conversation from the list to start chatting or search for someone to begin a new conversation.</p>
        </div>
      </div>
    );
  }

  const { name, avatar, subtitle } = getChatDisplayInfo();
  const messageGroups = groupMessagesByDate(allMessages);
  const typingText = getTypingText();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-pink-500 to-red-500">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-white/20 p-0.5">
            <img
              src={avatar || '/default-avatar.png'}
              alt={name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{name}</h2>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-white/80">{subtitle}</p>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`} />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Voice Call Button */}
          <button 
            onClick={handleVoiceCall}
            disabled={isInCall}
            className={`p-3 rounded-full transition-all duration-200 ${
              isInCall 
                ? 'text-white/50 cursor-not-allowed' 
                : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105'
            }`}
            title="Voice Call"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          
          {/* Video Call Button */}
          <button 
            onClick={handleVideoCall}
            disabled={isInCall}
            className={`p-3 rounded-full transition-all duration-200 ${
              isInCall 
                ? 'text-white/50 cursor-not-allowed' 
                : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105'
            }`}
            title="Video Call"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          
          {/* Chat Info Button */}
          <button 
            onClick={handleChatInfo}
            className="p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-105"
            title="Chat Information"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {/* Call Status Indicator */}
          {isInCall && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-white font-medium">
                {callType === 'voice' ? 'Voice Call' : 'Video Call'}
              </span>
              <button 
                onClick={handleEndCall}
                className="p-1 text-red-300 hover:text-red-200 rounded-full"
                title="End Call"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : messageGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No messages yet</h3>
            <p className="text-gray-500 dark:text-gray-400">Start the conversation by sending a message below</p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date Header */}
              <div className="flex items-center justify-center mb-4">
                <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-600 dark:text-gray-400">
                  {formatDateHeader(group.date)}
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-2">
                {group.messages.map((message, messageIndex) => (
                  <MessageBubble
                    key={message.messageid}
                    message={message}
                    isOwn={message.sender.profileid === user.profileid}
                    showAvatar={
                      messageIndex === 0 || 
                      group.messages[messageIndex - 1].sender.profileid !== message.sender.profileid
                    }
                    chat={selectedChat}
                    onReply={handleReplyToMessage}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {typingText && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 text-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>{typingText}</span>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <MessageInput
          onSendMessage={(content, attachments) => handleSendMessage(content, attachments, replyingTo?.messageid)}
          chatid={selectedChat?.chatid}
          placeholder={`Message ${name}...`}
          socket={socket}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
      
      {/* Modals */}
      <ChatInfoModal
        isOpen={showChatInfo}
        onClose={() => setShowChatInfo(false)}
        chat={selectedChat}
        user={user}
      />
      
      <VoiceCallModal
        isOpen={showVoiceCall}
        onClose={handleEndCall}
        chat={selectedChat}
        user={user}
        socket={socket}
      />
      
      <VideoCallModal
        isOpen={showVideoCall}
        onClose={handleEndCall}
        chat={selectedChat}
        user={user}
        socket={socket}
      />
      
      {/* Debug Components (Hidden in production) */}
      {process.env.NODE_ENV === 'development' && false && <EnvCheck />}
    </div>
  );
}
