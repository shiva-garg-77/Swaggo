'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '../../../lib/apollo-client-hooks';
import { GET_MESSAGES_BY_CHAT, SEND_MESSAGE, EDIT_MESSAGE, DELETE_MESSAGE } from '../Messaging/queries';
import { useSocket } from '../../../Components/Helper/PerfectSocketProvider';
import { useSecureAuth } from '../../../context/FixedSecureAuthContext';
import MessageInput from '../Messaging/MessageInput';
import TypingIndicator from './TypingIndicator';
import EditMessageModal from '../Messaging/EditMessageModal';
import DeleteMessageModal from '../Messaging/DeleteMessageModal';
import ChatInfoModal from './ChatInfoModal';
import CallHistory from '../Voice/CallHistory';
import MemberList from './MemberList';
import SharedMediaGrid from '../Media/SharedMediaGrid';
import VirtualMessageList from './VirtualMessageList';
import { uploadFile } from '../../../services/FileUploadService';
// import { exportChatConversation } from '../../../services/ChatExportService';
import enhancedSearchService from '../../../services/EnhancedSearchService';
import { debounceApiRequest } from '../../../utils/apiOptimizationUtils'; // 🔧 PERFORMANCE FIX #81: Import API optimization utilities
import VoiceCallModal from '../Voice/VoiceCallModal';
import VideoCallModal from '../Voice/VideoCallModal';
import ErrorBoundary from '../../common/ErrorBoundary';



// Function to extract URLs from text
const extractUrls = (text) => {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
};

function MessageAreaContent({ selectedChat, user }) {

  const { socket } = useSocket();
  const [allMessages, setAllMessages] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [endCursor, setEndCursor] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // 🔧 FIX #45: Message batching implementation
  const messageBatchRef = useRef([]);
  const batchTimeoutRef = useRef(null);

  // State for chat settings
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false); // 🔧 NEW: State for chat info modal
  const [showCallHistory, setShowCallHistory] = useState(false); // 🔧 NEW: State for call history panel
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  // Add search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef(null);
  const searchInputRef = useRef(null);
  const messagesContainerRef = useRef(null); // 🔧 NEW: Ref for scroll container
  const [isLoadingMore, setIsLoadingMore] = useState(false); // 🔧 NEW: Loading state for pagination
  const [isDragging, setIsDragging] = useState(false); // 🎯 NEW: Drag & drop state
  // 🔧 NEW: Ref for search debounce
  const searchTimeoutRef = useRef(null);
  
  // 🔧 NEW: Call state variables
  const [isInCall, setIsInCall] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [callType, setCallType] = useState(null);
  // 🔧 ENHANCED: State for call quality and stats
  const [callQuality, setCallQuality] = useState('unknown');
  const [callStats, setCallStats] = useState({});

  // Fetch messages for the selected chat
  const { loading, fetchMore } = useQuery(GET_MESSAGES_BY_CHAT, {
    variables: { chatid: selectedChat?.chatid, limit: 50 },
    skip: !selectedChat?.chatid,
    onCompleted: (data) => {
      if (data?.getMessagesByChat) {
        setAllMessages(data.getMessagesByChat.messages || []);
        setHasMoreMessages(data.getMessagesByChat.pageInfo?.hasNextPage || false);
        setEndCursor(data.getMessagesByChat.pageInfo?.endCursor || null);
      }
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

  // 🔧 FIX #45: Batch message sending
  const sendBatchedMessages = useCallback(() => {
    if (messageBatchRef.current.length === 0 || !socket || !socket.connected) return;

    const batch = [...messageBatchRef.current];
    messageBatchRef.current = [];

    // Send batch via socket
    socket.emit('send_message_batch', batch, (acknowledgments) => {
      console.log('📬 Received batch acknowledgment:', acknowledgments);
      
      if (acknowledgments && Array.isArray(acknowledgments)) {
        acknowledgments.forEach((ack, index) => {
          if (ack?.success) {
            console.log(`✅ Message ${index} sent successfully via socket`);
            // Update optimistic message with real message from server
            setAllMessages(prev => prev.map(msg => 
              msg.messageid === batch[index].clientMessageId
                ? { ...ack.message, messageStatus: 'sent', isOptimistic: false }
                : msg
            ));
          } else {
            console.error(`❌ Socket message ${index} send failed:`, ack?.error);
            // Update message status to 'failed'
            updateMessageStatus(batch[index].clientMessageId, 'failed');
            // Show error to user
            alert(`Failed to send message: ${ack?.error || 'Unknown error'}`);
          }
        });
      }
    });
  }, [socket]);

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
      
      // 🔧 FIX: Mark chat as read when opened (Issue #16)
      socket.emit('mark_chat_as_read', { chatid: selectedChat.chatid });
      
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
          // Check if this is an update to an existing optimistic message
          const existingIndex = prev.findIndex(m => m.messageid === message.clientMessageId);
          if (existingIndex !== -1) {
            // Update the existing optimistic message with server data
            const updatedMessages = [...prev];
            updatedMessages[existingIndex] = {
              ...message,
              messageStatus: 'sent', // Set status to 'sent' when server confirms
              isOptimistic: false
            };
            return updatedMessages;
          }
          
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
      // Update message status to 'delivered'
      if (data.messageid) {
        updateMessageStatus(data.messageid, 'delivered');
      }
    };

    const handleMessageRead = (data) => {
      console.log('✅ Message read:', data);
      // Update message status to 'read'
      if (data.messageid) {
        updateMessageStatus(data.messageid, 'read');
      }
    };

    const handleMessageStatusUpdate = (data) => {
      console.log('🔄 Message status update:', data);
      // Update message status based on the data received
      if (data.messageid && data.status) {
        updateMessageStatus(data.messageid, data.status);
      }
    };

    const handleMessageEdited = (data) => {
      console.log('✏️ Message edited:', data);
      if (data.chatid === selectedChat?.chatid) {
        setAllMessages(prev => {
          return prev.map(message => {
            if (message.messageid === data.messageid) {
              return {
                ...message,
                content: data.content,
                isEdited: data.isEdited,
                editHistory: data.editHistory,
                updatedAt: data.updatedAt
              };
            }
            return message;
          });
        });
      }
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
      
      // Show notification for incoming call
      notificationService.incomingCall(data.caller, data.callType);
      
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
      
      // Show notification for call ended
      if (data.caller && data.duration) {
        notificationService.callEnded(data.caller, data.duration);
      } else if (data.reason && data.reason !== 'normal' && data.reason !== 'user_ended') {
        // Show notification for missed calls
        notificationService.missedCall(data.caller || { username: 'Unknown' });
      }
      
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
      
      // Show error notification
      notificationService.error('Call Failed', errorMessage);
      
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
    
    // Handle call decline
    const handleCallDecline = (data) => {
      console.log('📞 Call declined:', data);
      setShowIncomingCall(false);
    };
    
    // Handle message reaction
    const handleMessageReaction = (data) => {
      console.log('❤️ Message reaction received:', data);
      
      // Update the message with the new reactions
      setAllMessages(prevMessages => {
        return prevMessages.map(message => {
          if (message.messageid === data.messageid) {
            // Update the message with the new reactions
            return {
              ...message,
              reactions: data.allReactions || message.reactions
            };
          }
          return message;
        });
      });
    };
    
    // Handle call events
    const handleCallEvent = (event, data) => {
      console.log('📞 Call event:', event, data);
      switch (event) {
        case 'ended':
          handleCallEnded(data);
          break;
        case 'failed':
          handleCallFailed(data);
          break;
        case 'timeout':
          handleCallTimeout(data);
          break;
        default:
          console.warn('📞 Unknown call event:', event);
      }
    };
    
    // Handle incoming call
    const handleIncomingCall = (data) => {
      console.log('📞 Incoming call:', data);
      window.currentIncomingCall = data;
      setShowIncomingCall(true);
    };
    
    // Handle call answer
    const handleCallAnswer = (data) => {
      console.log('📞 Call answered:', data);
      setIsInCall(true);
      setShowIncomingCall(false);
      setCallType(data.type);
    };
    


    // Register socket event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('message_received', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('typing_start', handleUserTyping);
    socket.on('typing_stop', handleUserTyping);
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('message_read', handleMessageRead);
    socket.on('message_status_update', handleMessageStatusUpdate);
    socket.on('message_edited', handleMessageEdited); // Add edited message listener
    socket.on('incoming_call', handleCallIncoming);
    socket.on('call_started', handleCallIncoming);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_failed', handleCallFailed);
    socket.on('call_timeout', handleCallTimeout);
    socket.on('call_declined', handleCallDecline);
    socket.on('message_reaction', handleMessageReaction); // Add reaction listener

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_received', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('typing_start', handleUserTyping);
      socket.off('typing_stop', handleUserTyping);
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('message_read', handleMessageRead);
      socket.off('message_status_update', handleMessageStatusUpdate);
      socket.off('message_edited', handleMessageEdited); // Clean up edited message listener
      socket.off('incoming_call', handleCallIncoming);
      socket.off('call_started', handleCallIncoming);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_failed', handleCallFailed);
      socket.off('call_timeout', handleCallTimeout);
      socket.off('call_declined', handleCallDecline);
      socket.off('message_reaction', handleMessageReaction); // Clean up reaction listener
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

  // Handle file upload with progress tracking
  const uploadFile = async (file, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      });
      
      // Handle response
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });
      
      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });
      
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });
      
      // Setup and send request
      const formData = new FormData();
      formData.append('file', file);
      
      xhr.open('POST', '/upload');
      xhr.send(formData);
    });
  };

  // 🔧 FIXED: Handle message sending - Support both old format (string + attachments) and new format (structured message data)
  const handleSendMessage = async (contentOrMessageData, attachments = [], replyTo = null, mentions = []) => {
    console.log('📤 handleSendMessage called with:', { contentOrMessageData, attachments, type: typeof contentOrMessageData });
    
    let messageData;
    let content = '';
    let processedAttachments = [];
    
    // ✅ DETECT FORMAT: Check if we received structured message data (from media components) or old format (text)
    if (typeof contentOrMessageData === 'object' && contentOrMessageData !== null && contentOrMessageData.messageType) {
      // ✅ NEW FORMAT: Structured message data from voice/gif/sticker components
      console.log('✅ Received structured message data:', contentOrMessageData);
      
      messageData = {
        chatid: selectedChat.chatid,
        messageType: contentOrMessageData.messageType,
        content: contentOrMessageData.content || '',
        clientMessageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        replyTo: replyingTo ? replyingTo.messageid : null,
        mentions: [],
        // ✅ PASS THROUGH MEDIA DATA: voiceData, gifData, stickerData, fileData
        ...(contentOrMessageData.voiceData && { voiceData: contentOrMessageData.voiceData }),
        ...(contentOrMessageData.gifData && { gifData: contentOrMessageData.gifData }),
        ...(contentOrMessageData.stickerData && { stickerData: contentOrMessageData.stickerData }),
        ...(contentOrMessageData.fileData && { fileData: contentOrMessageData.fileData })
      };
      
      content = contentOrMessageData.content || '';
      
    } else {
      // ✅ OLD FORMAT: Text message or attachments
      content = typeof contentOrMessageData === 'string' ? contentOrMessageData : '';
      
      if (!content.trim() && !attachments.length) {
        console.warn('⚠️ Empty message, not sending');
        return;
      }

      console.log('📤 Sending text/attachment message:', { content, attachments, chatid: selectedChat.chatid });

      try {
        // Process attachments - upload files first
        for (const attachment of attachments) {
          if (attachment.file) {
            try {
              // Create optimistic attachment with progress tracking
              const optimisticAttachment = {
                ...attachment,
                uploadProgress: 0,
                uploadStatus: 'uploading'
              };
              
              // Upload the file with progress tracking
              const uploadResult = await uploadFile(attachment.file, (progress) => {
                console.log(`📈 Upload progress: ${progress}%`);
              });
              
              // Update with final attachment data - use file reference
              processedAttachments.push({
                type: attachment.type,
                fileData: uploadResult.fileReference,
                url: uploadResult.fileUrl,
                thumbnailUrl: uploadResult.thumbnailUrl,
                filename: uploadResult.originalname,
                size: uploadResult.size,
                mimetype: attachment.mimetype,
                uploadStatus: 'completed'
              });
            } catch (uploadError) {
              console.error('❌ File upload failed:', uploadError);
              alert(`Failed to upload ${attachment.filename}: ${uploadError.message}`);
              return; // Don't send message if upload fails
            }
          } else {
            // Attachment already processed or URL-based
            processedAttachments.push(attachment);
          }
        }

        // Extract URLs from message content for link preview
        const urls = extractUrls(content);
        
        messageData = {
          chatid: selectedChat.chatid,
          messageType: processedAttachments.length > 0 ? processedAttachments[0].type : 'text',
          content: content.trim(),
          attachments: processedAttachments,
          replyTo: replyingTo ? replyingTo.messageid : null,
          mentions: mentions || [],
          urls,
          clientMessageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          // Add fileData for media messages
          ...(processedAttachments.length > 0 && processedAttachments[0].fileData && {
            fileData: processedAttachments[0].fileData
          })
        };
      } catch (error) {
        console.error('❌ Failed to process message:', error);
        alert('Failed to send message. Please try again.');
        return;
      }
    }
    
    // ✅ SEND MESSAGE: Via Socket.io for real-time delivery (Primary method)
    try {
      console.log('📤 Final message data to send:', messageData);
      
      // ✅ CREATE OPTIMISTIC MESSAGE: Add to UI immediately for instant feedback
      const optimisticMessage = {
        messageid: messageData.clientMessageId,
        messageType: messageData.messageType,
        content: messageData.content,
        attachments: messageData.attachments || [],
        sender: {
          profileid: user.profileid,
          username: user.username,
          profilePic: user.profilePic,
          name: user.name
        },
        replyTo: messageData.replyTo ? { messageid: messageData.replyTo, content: 'Reply' } : null,
        mentions: messageData.mentions || [],
        reactions: [],
        readBy: [],
        messageStatus: 'sending', // 🔄 LOADING STATE: Show as 'sending'
        createdAt: new Date().toISOString(),
        isOptimistic: true,
        // ✅ INCLUDE MEDIA DATA: For proper display while sending
        ...(messageData.voiceData && { voiceData: messageData.voiceData }),
        ...(messageData.gifData && { gifData: messageData.gifData }),
        ...(messageData.stickerData && { stickerData: messageData.stickerData }),
        ...(messageData.fileData && { fileData: messageData.fileData })
      };
      
      setAllMessages(prev => [...prev, optimisticMessage]);
      scrollToBottom();
      
      // 🔧 FIX #45: Add message to batch instead of sending immediately
      messageBatchRef.current.push(messageData);
      
      // Clear any existing timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      
      // Set timeout to send batch after 50ms
      batchTimeoutRef.current = setTimeout(() => {
        sendBatchedMessages();
      }, 50);
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      // Update message status to 'failed' if it exists
      updateMessageStatus(messageData.clientMessageId, 'failed');
      alert('Failed to send message. Please try again.');
    }
  };

  // Function to update message status
  const updateMessageStatus = (clientMessageId, status) => {
    setAllMessages(prev => {
      return prev.map(message => {
        if (message.messageid === clientMessageId) {
          return {
            ...message,
            messageStatus: status
          };
        }
        return message;
      });
    });
  };

  // Function to retry sending a failed message
  const retrySendMessage = async (message) => {
    // Update status to 'sending'
    updateMessageStatus(message.messageid, 'sending');
    
    try {
      // Prepare message data
      const messageData = {
        chatid: selectedChat.chatid,
        messageType: message.messageType,
        content: message.content,
        attachments: message.attachments,
        replyTo: message.replyTo ? message.replyTo.messageid : null,
        mentions: message.mentions,
        clientMessageId: message.messageid,
        timestamp: message.createdAt,
        // Add fileData for media messages
        ...(message.attachments.length > 0 && message.attachments[0].fileData && {
          fileData: message.attachments[0].fileData
        })
      };

      // Send via Socket.io
      if (socket && socket.connected) {
        socket.emit('send_message', messageData, (acknowledgment) => {
          if (acknowledgment?.success) {
            console.log('✅ Message resent successfully via socket');
            // Update message status to 'sent'
            updateMessageStatus(message.messageid, 'sent');
          } else {
            console.error('❌ Socket message resend failed:', acknowledgment?.error);
            // Update message status to 'failed'
            updateMessageStatus(message.messageid, 'failed');
          }
        });
      } else {
        // Fallback to GraphQL if no socket connection
        console.log('🔍 Falling back to GraphQL for message edit');
        await sendViaGraphQL(messageData);
      }
    } catch (error) {
      console.error('❌ Failed to retry sending message:', error);
      // Update message status to 'failed'
      updateMessageStatus(message.messageid, 'failed');
      alert('Failed to resend message. Please try again.');
    }
  };

  // GraphQL fallback function
  const sendViaGraphQL = async (messageData) => {
    try {
      console.log('🔍 Sending via GraphQL:', messageData);
      const result = await sendMessageMutation({
        variables: {
          input: {
            chatid: messageData.chatid,
            messageType: messageData.messageType,
            content: messageData.content,
            attachments: messageData.attachments,
            replyTo: messageData.replyTo,
            mentions: messageData.mentions
          }
        }
      });
      console.log('✅ GraphQL message sent:', result);
      // Update message status to 'sent'
      if (result.data?.sendMessage?.success) {
        updateMessageStatus(messageData.clientMessageId, 'sent');
      } else {
        updateMessageStatus(messageData.clientMessageId, 'failed');
      }
    } catch (error) {
      console.error('❌ GraphQL send failed:', error);
      // Update message status to 'failed'
      updateMessageStatus(messageData.clientMessageId, 'failed');
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
    setEditingMessage(message);
    setShowEditModal(true);
  };

  // 🔧 FIXED: Use socket for message editing to ensure real-time broadcast
  const handleSaveEdit = async (newContent) => {
    if (editingMessage && newContent !== editingMessage.content) {
      try {
        if (socket && socket.connected) {
          // ✅ Use socket for real-time editing
          socket.emit('edit_message', {
            messageid: editingMessage.messageid,
            chatid: selectedChat.chatid,
            content: newContent
          }, (response) => {
            if (response?.success) {
              console.log('✅ Message edited successfully via socket');
            } else {
              console.error('❌ Socket edit failed:', response?.error);
              alert('Failed to edit message. Please try again.');
            }
          });
        } else {
          // Fallback to GraphQL if socket is not connected
          console.log('🔄 Falling back to GraphQL for message edit');
          await editMessageMutation({
            variables: {
              messageid: editingMessage.messageid,
              content: newContent
            }
          });
        }
      } catch (error) {
        console.error('❌ Failed to edit message:', error);
        alert('Failed to edit message. Please try again.');
      }
    }
    setShowEditModal(false);
    setEditingMessage(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingMessage(null);
  };

  // Handle delete message
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  
  const handleDeleteMessage = async (message) => {
    setMessageToDelete(message);
    setShowDeleteModal(true);
  };
  
  const handleDeleteForMe = async (messageid) => {
    try {
      // Send delete request to backend with deleteForEveryone = false
      if (socket && socket.connected) {
        socket.emit('delete_message', {
          messageid,
          chatid: selectedChat.chatid,
          deleteForEveryone: false
        });
      }
      
      // Optimistically update UI
      const message = allMessages.find(msg => msg.messageid === messageid);
      if (message) {
        const updatedMessage = { ...message, isDeleted: true, deletedForMe: true };
        setAllMessages(prev => prev.map(msg => 
          msg.messageid === messageid ? updatedMessage : msg
        ));
      }
    } catch (error) {
      console.error('Failed to delete message for me:', error);
    }
  };
  
  const handleDeleteForEveryone = async (messageid) => {
    try {
      // Send delete request to backend with deleteForEveryone = true
      if (socket && socket.connected) {
        socket.emit('delete_message', {
          messageid,
          chatid: selectedChat.chatid,
          deleteForEveryone: true
        });
      }
      
      // Optimistically update UI
      const message = allMessages.find(msg => msg.messageid === messageid);
      if (message) {
        const updatedMessage = { ...message, isDeleted: true, deletedForEveryone: true };
        setAllMessages(prev => prev.map(msg => 
          msg.messageid === messageid ? updatedMessage : msg
        ));
      }
    } catch (error) {
      console.error('Failed to delete message for everyone:', error);
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
      setCallQuality('unknown'); // Reset quality indicator
      setCallStats({}); // Reset stats
      
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
      setCallQuality('unknown');
      setCallStats({});
      
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

  // Enhanced video call handling with quality monitoring
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
      setCallQuality('unknown'); // Reset quality indicator
      setCallStats({}); // Reset stats
      
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
      setCallQuality('unknown');
      setCallStats({});
      
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
      setCallQuality('unknown');
      setCallStats({});
    }
  };

  // Handle chat info
  const handleChatInfo = () => {
    setShowChatInfo(true);
  };

  // Handle typing start
  const handleTypingStart = () => {
    if (socket && selectedChat?.chatid) {
      socket.emit('typing_start', {
        chatid: selectedChat.chatid,
        profileid: user.profileid,
        username: user.username
      });
    }
  };

  // Handle typing stop
  const handleTypingStop = () => {
    if (socket && selectedChat?.chatid) {
      socket.emit('typing_stop', {
        chatid: selectedChat.chatid,
        profileid: user.profileid,
        username: user.username
      });
    }
  };

  // Handle message reaction
  const handleReactToMessage = (messageid, emoji) => {
    if (socket && selectedChat?.chatid) {
      socket.emit('react_to_message', {
        chatid: selectedChat.chatid,
        messageid,
        emoji
      });
    }
  };

  // Toggle message selection for multi-select mode
  const toggleMessageSelection = (messageId) => {
    if (selectedMessages.includes(messageId)) {
      setSelectedMessages(selectedMessages.filter(id => id !== messageId));
    } else {
      setSelectedMessages([...selectedMessages, messageId]);
    }
  };

  // Enter multi-select mode
  const enterMultiSelectMode = () => {
    setIsMultiSelectMode(true);
  };

  // Exit multi-select mode
  const exitMultiSelectMode = () => {
    setIsMultiSelectMode(false);
    setSelectedMessages([]);
  };

  // Select all messages
  const selectAllMessages = () => {
    const allMessageIds = allMessages.map(msg => msg.messageid);
    setSelectedMessages(allMessageIds);
  };

  // Bulk delete selected messages
  const bulkDeleteMessages = async () => {
    if (selectedMessages.length === 0) return;
    
    try {
      // Show confirmation dialog
      const confirmed = window.confirm(`Are you sure you want to delete ${selectedMessages.length} message(s)? This action cannot be undone.`);
      if (!confirmed) return;
      
      // Use socket for real-time deletion if available
      if (socket && socket.connected && selectedChat?.chatid) {
        // Emit bulk delete event
        socket.emit('bulk_delete_messages', {
          messageIds: selectedMessages,
          chatid: selectedChat.chatid
        }, (response) => {
          if (response?.success) {
            console.log('✅ Bulk delete successful via socket');
            // Optimistically update UI
            setAllMessages(prev => prev.filter(msg => !selectedMessages.includes(msg.messageid)));
            // Exit multi-select mode
            exitMultiSelectMode();
            // Show success message
            alert(`${selectedMessages.length} message(s) deleted successfully.`);
          } else {
            console.error('❌ Socket bulk delete failed:', response?.error);
            alert('Failed to delete messages. Please try again.');
          }
        });
      } else {
        // Fallback to GraphQL if socket is not connected
        console.log('🔌 Socket not connected, using GraphQL fallback for bulk delete');
        
        // Delete each selected message
        for (const messageId of selectedMessages) {
          await deleteMessageMutation({
            variables: {
              messageid: messageId
            }
          });
        }
        
        // Exit multi-select mode
        exitMultiSelectMode();
        
        // Show success message
        alert(`${selectedMessages.length} message(s) deleted successfully.`);
      }
    } catch (error) {
      console.error('Error deleting messages:', error);
      alert('Failed to delete messages. Please try again.');
    }
  };

  // Forward selected messages
  const forwardMessages = () => {
    if (selectedMessages.length === 0) return;
    
    // Get the actual message objects
    const messagesToForward = allMessages.filter(msg => selectedMessages.includes(msg.messageid));
    
    // Here you would implement the forward functionality
    // For now, we'll just show an alert
    alert(`Forwarding ${selectedMessages.length} message(s). This feature would be implemented in a real app.`);
    
    // Exit multi-select mode
    exitMultiSelectMode();
  };

  // 🔧 ENHANCED: Load more messages when scrolling to top with proper state management
  const loadMoreMessages = async () => {
    if (!hasMoreMessages || loading || isLoadingMore || !selectedChat?.chatid || !endCursor) {
      console.log('⏸️ Skipping loadMoreMessages:', { hasMoreMessages, loading, isLoadingMore, endCursor });
      return;
    }
    
    console.log('📜 Loading more messages with cursor:', endCursor);
    setIsLoadingMore(true);
    
    try {
      // Store current scroll position to restore after loading
      const container = messagesContainerRef.current;
      const previousScrollHeight = container?.scrollHeight || 0;
      
      const result = await fetchMore({
        variables: {
          chatid: selectedChat?.chatid,
          limit: 50,
          cursor: endCursor
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          
          return {
            getMessagesByChat: {
              ...fetchMoreResult.getMessagesByChat,
              messages: [
                ...prev.getMessagesByChat.messages,
                ...fetchMoreResult.getMessagesByChat.messages
              ]
            }
          };
        }
      });
      
      if (result?.data?.getMessagesByChat) {
        const newMessages = result.data.getMessagesByChat.messages;
        const pageInfo = result.data.getMessagesByChat.pageInfo;
        


        console.log('✅ Loaded', newMessages.length, 'older messages');
        console.log('📊 Pagination info:', { hasNextPage: pageInfo?.hasNextPage, newCursor: pageInfo?.endCursor });
        
        setAllMessages(prevMessages => {
          // Append older messages to the end of the array (since we're loading older messages)
          const updatedMessages = [...prevMessages, ...newMessages];
          return updatedMessages;
        });
        
        setHasMoreMessages(pageInfo?.hasNextPage || false);
        setEndCursor(pageInfo?.endCursor || null);
        
        // Restore scroll position after adding messages
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error('❌ Error loading more messages:', error);
      
      // Check if it's an authorization error
      if (error.message && error.message.includes('Unauthorized')) {
        console.log('🔐 Authorization error, rejoining chat...');
        // Try to rejoin the chat
        if (socket && selectedChat?.chatid) {
          socket.emit('join_chat', selectedChat.chatid);
        }
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 🔧 FIXED: Add scroll event listener for infinite scroll
  const handleScroll = useCallback((e) => {
    const messagesContainer = e.target;
    
    if (!messagesContainer) return;
    
    // Check if user scrolled to the top (for loading older messages)
    // Trigger when scroll position is within 200px from top
    if (messagesContainer.scrollTop <= 200 && hasMoreMessages && !isLoadingMore) {
      console.log('🔝 Near top, loading more messages...');
      loadMoreMessages();
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  // Search messages function with improved functionality
  const searchMessages = useCallback((query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    // Use enhanced search service for better search capabilities
    const filters = {
      messageTypes: [],
      senders: [],
      dateRange: 'all',
      sentiment: 'all',
      importance: 'all',
      hasAttachments: false,
      hasReactions: false,
      isEdited: false,
      priority: 'all'
    };
    
    const results = enhancedSearchService.search(allMessages, query, filters);
    
    setSearchResults(results);
    setIsSearching(false);
  }, [allMessages]);

  // Handle search input change with debounce
  // 🔧 PERFORMANCE FIX #81: Enhanced debouncing with caching
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    // 🔧 PERFORMANCE FIX #81: Use debounced API request with caching
    debounceApiRequest(
      `message-search-${selectedChat?.chatid}-${query}`,
      () => {
        const filters = {
          messageTypes: [],
          senders: [],
          dateRange: 'all',
          sentiment: 'all',
          importance: 'all',
          hasAttachments: false,
          hasReactions: false,
          isEdited: false,
          priority: 'all'
        };
        
        return Promise.resolve(enhancedSearchService.search(allMessages, query, filters));
      },
      300, // 300ms debounce
      10000 // 10 second cache
    ).then((results) => {
      setSearchResults(results);
      setIsSearching(false);
    }).catch((error) => {
      console.error('Search failed:', error);
      setSearchResults([]);
      setIsSearching(false);
    });
  }, [allMessages, selectedChat?.chatid, setSearchResults, setIsSearching]);

  // Function to scroll to a specific message with highlighting
  const scrollToMessage = useCallback((messageId) => {
    if (!messageId) return;
    
    // First, try to find the message in the current view
    const messageElement = document.getElementById(`message-${messageId}`);
    
    if (messageElement) {
      // Message is visible, scroll to it
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Highlight the message
      messageElement.classList.add('bg-yellow-100', 'dark:bg-yellow-900/30', 'ring-2', 'ring-yellow-400', 'rounded-lg');
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/30', 'ring-2', 'ring-yellow-400', 'rounded-lg');
      }, 3000);
    } else {
      // Message is not visible, we need to load it
      // In a real implementation, we would fetch the message and scroll to it
      console.log(`Message ${messageId} not found in current view`);
      alert('Jumping to message... This would load the message in a full implementation.');
    }
  }, []);
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };
  
  // 🎯 NEW: Drag & Drop File Upload Handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only hide if we're leaving the messages container completely
    if (e.target === messagesContainerRef.current) {
      setIsDragging(false);
    }
  }, []);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) return;
    
    console.log('📥 Files dropped:', files);
    
    // Filter valid file types
    const validFiles = files.filter(file => {
      const validTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm',
        'application/pdf',
        'text/plain'
      ];
      return validTypes.includes(file.type);
    });
    
    if (validFiles.length === 0) {
      alert('No valid files. Please drop images, videos, PDFs, or text files.');
      return;
    }
    
    if (validFiles.length > 10) {
      alert('Maximum 10 files at a time.');
      return;
    }
    
    // Process files for upload
    try {
      const processedAttachments = [];
      
      for (const file of validFiles) {
        // Check file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          alert(`File "${file.name}" is too large. Maximum size is 50MB.`);
          continue;
        }
        
        // Upload file
        const uploadResult = await uploadFile(file, (progress) => {
          console.log(`📈 Upload progress for ${file.name}: ${progress}%`);
        });
        
        // Determine message type based on file type
        let messageType = 'file';
        if (file.type.startsWith('image/')) messageType = 'image';
        else if (file.type.startsWith('video/')) messageType = 'video';
        
        processedAttachments.push({
          type: messageType,
          fileData: uploadResult.fileReference,
          url: uploadResult.fileUrl,
          thumbnailUrl: uploadResult.thumbnailUrl,
          filename: file.name,
          size: file.size,
          mimetype: file.type
        });
      }
      
      // Send message with attachments
      if (processedAttachments.length > 0) {
        const messageData = {
          chatid: selectedChat.chatid,
          messageType: processedAttachments[0].type,
          content: processedAttachments.length > 1 
            ? `Sent ${processedAttachments.length} files` 
            : '',
          attachments: processedAttachments,
          clientMessageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString()
        };
        
        handleSendMessage(messageData);
      }
    } catch (error) {
      console.error('❌ File drop upload failed:', error);
      alert('Failed to upload files. Please try again.');
    }
  }, [selectedChat, uploadFile, handleSendMessage]);

  // Handle export conversation
  const handleExportConversation = (format) => {
    try {
      exportChatConversation(selectedChat, allMessages, user, format);
    } catch (error) {
      console.error('Error exporting conversation:', error);
      alert('Failed to export conversation. Please try again.');
    }
  };

  // Handle delete conversation
  const handleDeleteConversation = () => {
    // Confirm with user before deleting
    const confirmed = window.confirm('Are you sure you want to delete this conversation? This action cannot be undone and all messages will be permanently removed.');
    
    if (confirmed) {
      try {
        // Emit socket event to delete conversation
        if (socket && socket.connected && selectedChat?.chatid) {
          socket.emit('delete_conversation', {
            chatid: selectedChat.chatid,
            profileid: user?.profileid
          }, (response) => {
            if (response?.success) {
              // Close chat settings panel
              setShowChatSettings(false);
              // Show success message
              alert('Conversation deleted successfully.');
              // Navigate back to chat list or refresh UI
              window.location.hash = '#/chats'; // Redirect to chat list
              window.location.reload(); // Refresh to update the UI
            } else {
              console.error('Failed to delete conversation:', response?.error);
              alert('Failed to delete conversation. Please try again.');
            }
          });
        } else {
          alert('Unable to delete conversation. Please check your connection and try again.');
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
        alert('An error occurred while deleting the conversation. Please try again.');
      }
    }
  };

  // Component removed: MessageRow (no longer using react-window virtual list)

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.relative')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  // Keyboard shortcut for search (Ctrl+F or Cmd+F)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if Ctrl+F or Cmd+F is pressed
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        // Show search bar and focus it
        if (searchInputRef.current) {
          // Show search bar first
          setSearchQuery(' '); // Trigger the search bar to show
          setTimeout(() => {
            searchInputRef.current?.focus();
            setSearchQuery(''); // Clear the temporary space
          }, 10);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {isMultiSelectMode ? (
          // Multi-select mode header
          <div className="flex items-center w-full">
            <button 
              onClick={exitMultiSelectMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 mr-2 transition-colors duration-200"
              aria-label="Exit multi-select mode"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedMessages.length} selected
              </h2>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={selectAllMessages}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors duration-200"
                aria-label={selectedMessages.length === allMessages.length ? "Deselect all" : "Select all"}
                title={selectedMessages.length === allMessages.length ? "Deselect all" : "Select all"}
              >
                {selectedMessages.length === allMessages.length ? (
                  // Deselect all icon
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  // Select all icon
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <button 
                onClick={forwardMessages}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors duration-200"
                aria-label="Forward messages"
                disabled={selectedMessages.length === 0}
                title="Forward messages"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
              <button 
                onClick={bulkDeleteMessages}
                className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors duration-200"
                aria-label="Delete messages"
                disabled={selectedMessages.length === 0}
                title="Delete messages"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ) : searchQuery ? (
          // Search results header
          <div className="flex items-center w-full">
            <button 
              onClick={clearSearch}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 mr-2"
              aria-label="Back to chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
              </h2>
            </div>
            <button 
              onClick={clearSearch}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              aria-label="Clear search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          // Normal chat header with search
          <>
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {selectedChat.chatName?.charAt(0) || selectedChat.participants?.[0]?.username?.charAt(0) || 'C'}
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedChat.chatName || selectedChat.participants?.find(p => p.profileid !== user?.profileid)?.username || 'Chat'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedChat.participants?.length > 0 ? `${selectedChat.participants.length} participants` : 'Loading...'}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {/* Search button */}
              <button 
                onClick={() => searchInputRef.current?.focus()}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                aria-label="Search messages"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              <button 
                onClick={enterMultiSelectMode}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                aria-label="Select messages"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>
              <button 
                onClick={handleVoiceCall}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                aria-label="Voice call"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              
              <button 
                onClick={handleVideoCall}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                aria-label="Video call"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              
              {/* Chat settings button */}
              <button 
                onClick={() => setShowChatSettings(!showChatSettings)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                aria-label="Chat settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Member list */}
      {selectedChat && !isMultiSelectMode && !searchQuery && (
        <MemberList 
          chat={selectedChat} 
          currentUser={user} 
          onMemberClick={(member) => console.log('Member clicked:', member)} 
        />
      )}
      
      {/* Search bar */}
      {!isMultiSelectMode && (
        <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 ${searchQuery ? 'block' : 'hidden'}`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search messages..."
              className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {isSearching && (
              <div className="absolute inset-y-0 right-8 pr-2 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat settings panel */}
      {showChatSettings && !isMultiSelectMode && !searchQuery && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Chat Settings</h3>
            <button 
              onClick={() => setShowChatSettings(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Settings options */}
          <div className="p-4 space-y-3">
            <button className="flex items-center w-full p-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm text-gray-700 dark:text-gray-300">Mute Notifications</span>
            </button>
            <button className="flex items-center w-full p-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="text-sm text-gray-700 dark:text-gray-300">Archive Chat</span>
            </button>
            {/* Call History Button */}
            <button 
              onClick={() => {
                setShowChatSettings(false);
                setShowCallHistory(true);
              }}
              className="flex items-center w-full p-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-sm text-gray-700 dark:text-gray-300">Call History</span>
            </button>
            {/* Export Chat Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="flex items-center w-full p-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">Export Chat</span>
                <svg className={`w-4 h-4 ml-auto text-gray-500 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Export options dropdown */}
              {showExportDropdown && (
                <div className="absolute left-0 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
                  <button 
                    onClick={() => {
                      handleExportConversation('json');
                      setShowExportDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export as JSON
                  </button>
                  <button 
                    onClick={() => {
                      handleExportConversation('txt');
                      setShowExportDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export as Text
                  </button>
                  <button 
                    onClick={() => {
                      handleExportConversation('html');
                      setShowExportDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export as HTML
                  </button>
                </div>
              )}
            </div>
            {/* Delete Conversation Button */}
            <button 
              onClick={handleDeleteConversation}
              className="flex items-center w-full p-2 text-left rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
            >
              <svg className="w-5 h-5 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-sm">Delete Conversation</span>
            </button>
          </div>
          
          {/* Shared Media Section */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Shared Media</h4>
              <SharedMediaGrid messages={allMessages} />
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800 relative"
        onScroll={handleScroll}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* 🎯 NEW: Drag & Drop Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/20 dark:bg-blue-600/20 backdrop-blur-sm border-4 border-dashed border-blue-500 dark:border-blue-400 rounded-lg">
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
              <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Drop Files Here
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload images, videos, PDFs, or text files
                <br />
                <span className="text-xs">(Max 10 files, 50MB each)</span>
              </p>
            </div>
          </div>
        )}
        
        {/* 🔧 NEW: Loading spinner for pagination at top */}
        {isLoadingMore && hasMoreMessages && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className="text-sm">Loading older messages...</span>
            </div>
          </div>
        )}
        
        {/* Initial loading */}
        {loading && !hasMoreMessages && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Search results */}
        {searchQuery && searchResults.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 px-2">
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </div>
            {searchResults.map((message) => (
              <div 
                key={`search-${message.messageid}`}
                className="p-4 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={() => {
                  clearSearch();
                  setTimeout(() => scrollToMessage(message.messageid), 100);
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium mr-2">
                      {message.sender?.name?.charAt(0) || message.sender?.username?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {message.sender?.name || message.sender?.username}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                {/* Message content preview */}
                <div className="ml-10">
                  {message.messageType !== 'text' ? (
                    // Media message preview
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {message.messageType === 'image' && (
                        <>
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Photo</span>
                        </>
                      )}
                      {message.messageType === 'video' && (
                        <>
                          <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Video</span>
                        </>
                      )}
                      {message.messageType === 'voice' && (
                        <>
                          <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          <span>Voice message</span>
                        </>
                      )}
                      {message.messageType === 'gif' && (
                        <>
                          <svg className="w-4 h-4 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>GIF</span>
                        </>
                      )}
                      {message.messageType === 'sticker' && (
                        <>
                          <svg className="w-4 h-4 mr-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Sticker</span>
                        </>
                      )}
                      {message.messageType === 'file' && (
                        <>
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>{message.filename || 'File'}</span>
                        </>
                      )}
                      {message.attachments && message.attachments.length > 1 && (
                        <span className="ml-2 text-xs text-gray-500">+{message.attachments.length - 1} more</span>
                      )}
                    </div>
                  ) : (
                    // Text message preview with highlighted search term
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {message.content}
                    </p>
                  )}
                  
                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                    Jump to message
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* No search results */}
        {searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No results found</h3>
          </div>
        )}
        
        {/* All messages (when not searching) */}
        {!searchQuery && (
          <VirtualMessageList
            messages={allMessages}
            user={user}
            chat={selectedChat}
            onReply={handleReplyToMessage}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
            onRetryMessage={retrySendMessage}
            selectedMessages={selectedMessages}
            isMultiSelectMode={isMultiSelectMode}
            onSelectionToggle={toggleMessageSelection}
            isLoadingMore={isLoadingMore}
            hasMoreMessages={hasMoreMessages}
            onLoadMore={loadMoreMessages}
            onScroll={handleScroll}
            // 🔧 PERFORMANCE FIX #35: Optimize virtual list parameters
            itemHeight={100} // More accurate average message height
            buffer={15} // Increased buffer for smoother scrolling
          />
        )}
        
        {/* Scroll anchor for new messages */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTypingStart}
          placeholder="Type a message..."
          chatid={selectedChat?.chatid}
          socket={socket}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
      
      {/* Typing indicator */}
      {Object.values(typingUsers).length > 0 && (
        <TypingIndicator typingUsers={typingUsers} />
      )}
      

      
      {/* Edit Message Modal */}
      {showEditModal && editingMessage && (
        <EditMessageModal
          message={editingMessage}
          isOpen={showEditModal}
          onSave={handleSaveEdit}
          onCancel={() => {
            setShowEditModal(false);
            setEditingMessage(null);
          }}
        />
      )}
      
      {/* Delete Message Modal */}
      {showDeleteModal && messageToDelete && (
        <DeleteMessageModal
          message={{ ...messageToDelete, currentUserProfileId: user?.profileid }}
          onClose={() => {
            setShowDeleteModal(false);
            setMessageToDelete(null);
          }}
          onDeleteForMe={handleDeleteForMe}
          onDeleteForEveryone={handleDeleteForEveryone}
        />
      )}

      {/* Chat Info Modal */}
      <ChatInfoModal
        isOpen={showChatInfo}
        onClose={() => setShowChatInfo(false)}
        chat={selectedChat}
        user={user}
        onChatUpdate={(updatedChat) => {
          // Update the chat in the UI
          console.log('Chat updated:', updatedChat);
        }}
        onChatDelete={(chatId) => {
          // Handle chat deletion
          console.log('Chat deleted:', chatId);
        }}
      />
      
      {/* Call History Panel */}
      {showCallHistory && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Call History</h3>
              <button 
                onClick={() => setShowCallHistory(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CallHistory 
                currentUser={user}
                onCallBack={(chatId, callType, targetUserId) => {
                  console.log('Call back requested:', { chatId, callType, targetUserId });
                  // Close the call history panel
                  setShowCallHistory(false);
                  // Initiate the call based on type
                  if (callType === 'video') {
                    handleVideoCall();
                  } else {
                    handleVoiceCall();
                  }
                }}
                onDeleteCall={(callId) => {
                  console.log('Delete call requested:', callId);
                  // You can implement delete functionality here
                }}
                onCallInfo={(call) => {
                  console.log('Call info requested:', call);
                  // You can implement call info functionality here
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Voice Call Modal */}
      <VoiceCallModal
        isOpen={showVoiceCall}
        onClose={() => {
          setShowVoiceCall(false);
          setIsInCall(false);
          setCallType(null);
          setCallQuality('unknown');
          setCallStats({});
        }}
        chat={selectedChat}
        user={user}
        socket={socket}
        // Pass enhanced call state information
        callQuality={callQuality}
        callStats={callStats}
        onCallQualityUpdate={(quality) => setCallQuality(quality)}
        onCallStatsUpdate={(stats) => setCallStats(stats)}
      />
      
      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={showVideoCall}
        onClose={() => {
          setShowVideoCall(false);
          setIsInCall(false);
          setCallType(null);
          setCallQuality('unknown');
          setCallStats({});
        }}
        chat={selectedChat}
        user={user}
        socket={socket}
        // Pass enhanced call state information
        callQuality={callQuality}
        callStats={callStats}
        onCallQualityUpdate={(quality) => setCallQuality(quality)}
        onCallStatsUpdate={(stats) => setCallStats(stats)}
      />
    </div>
  );
}

export default function MessageArea(props) {
  return (
    <ErrorBoundary>
      <MessageAreaContent {...props} />
    </ErrorBoundary>
  );
}

