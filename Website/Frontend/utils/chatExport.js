'use client';

/**
 * Utility functions for exporting chat conversations
 */

/**
 * Export chat as JSON format
 * @param {Object} chat - Chat object with messages
 * @param {Array} messages - Array of message objects
 * @param {Object} currentUser - Current user object
 * @returns {string} JSON string representation of the chat
 */
export const exportChatAsJSON = (chat, messages, currentUser) => {
  const exportData = {
    chat: {
      chatid: chat.chatid,
      chatName: chat.chatName,
      chatType: chat.chatType,
      participants: chat.participants,
      createdAt: chat.createdAt,
      lastMessageAt: chat.lastMessageAt
    },
    messages: messages.map(message => ({
      messageid: message.messageid,
      messageType: message.messageType,
      content: message.content,
      sender: {
        profileid: message.sender?.profileid,
        username: message.sender?.username,
        name: message.sender?.name,
        profilePic: message.sender?.profilePic
      },
      attachments: message.attachments,
      replyTo: message.replyTo,
      reactions: message.reactions,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      isEdited: message.isEdited,
      isDeleted: message.isDeleted
    })),
    exportedBy: {
      profileid: currentUser?.profileid,
      username: currentUser?.username,
      name: currentUser?.name
    },
    exportedAt: new Date().toISOString(),
    exportFormat: 'swaggo-chat-export-v1.0'
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Export chat as plain text format
 * @param {Object} chat - Chat object with messages
 * @param {Array} messages - Array of message objects
 * @param {Object} currentUser - Current user object
 * @returns {string} Plain text representation of the chat
 */
export const exportChatAsText = (chat, messages, currentUser) => {
  let text = `Chat Export\n`;
  text += `==========\n\n`;
  
  text += `Chat Information:\n`;
  text += `----------------\n`;
  text += `Chat ID: ${chat.chatid}\n`;
  text += `Chat Name: ${chat.chatName || 'N/A'}\n`;
  text += `Chat Type: ${chat.chatType}\n`;
  text += `Participants: ${chat.participants?.length || 0}\n`;
  text += `Created: ${chat.createdAt ? new Date(chat.createdAt).toLocaleString() : 'N/A'}\n`;
  text += `Last Message: ${chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleString() : 'N/A'}\n\n`;
  
  text += `Messages:\n`;
  text += `---------\n\n`;
  
  // Sort messages by timestamp
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );
  
  sortedMessages.forEach(message => {
    const senderName = message.sender?.name || message.sender?.username || 'Unknown';
    const timestamp = message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Unknown time';
    
    text += `[${timestamp}] ${senderName}:\n`;
    
    if (message.content) {
      text += `${message.content}\n`;
    }
    
    if (message.attachments && message.attachments.length > 0) {
      text += `Attachments (${message.attachments.length}):\n`;
      message.attachments.forEach((attachment, index) => {
        text += `  ${index + 1}. ${attachment.filename || attachment.type} (${attachment.size ? (attachment.size / 1024).toFixed(2) + ' KB' : 'N/A'})\n`;
        if (attachment.url) {
          text += `     URL: ${attachment.url}\n`;
        }
      });
    }
    
    if (message.reactions && message.reactions.length > 0) {
      const reactionSummary = message.reactions.map(r => `${r.emoji}`).join(' ');
      text += `Reactions: ${reactionSummary}\n`;
    }
    
    if (message.isEdited) {
      text += `(edited)\n`;
    }
    
    if (message.isDeleted) {
      text += `(deleted)\n`;
    }
    
    text += `\n`;
  });
  
  text += `\nExported by: ${currentUser?.name || currentUser?.username || 'Unknown user'}\n`;
  text += `Exported at: ${new Date().toLocaleString()}\n`;
  text += `Export format: swaggo-chat-export-v1.0\n`;
  
  return text;
};

/**
 * Export chat as HTML format
 * @param {Object} chat - Chat object with messages
 * @param {Array} messages - Array of message objects
 * @param {Object} currentUser - Current user object
 * @returns {string} HTML representation of the chat
 */
export const exportChatAsHTML = (chat, messages, currentUser) => {
  let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Chat Export - ${chat.chatName || 'Swaggo Chat'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .chat-export { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .chat-header { border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
        .chat-title { font-size: 24px; color: #333; margin: 0 0 10px 0; }
        .chat-info { color: #666; margin: 5px 0; }
        .message { margin-bottom: 15px; padding: 10px; border-radius: 8px; background: #f9f9f9; }
        .message.own { background: #e3f2fd; }
        .message-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .sender { font-weight: bold; color: #333; }
        .timestamp { color: #999; font-size: 0.85em; }
        .content { margin: 5px 0; white-space: pre-wrap; }
        .attachments { margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 4px; }
        .attachment { margin: 5px 0; }
        .reactions { margin: 5px 0; color: #666; }
        .metadata { margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; color: #999; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="chat-export">
        <div class="chat-header">
            <h1 class="chat-title">Chat Export</h1>
            <div class="chat-info"><strong>Chat Name:</strong> ${chat.chatName || 'N/A'}</div>
            <div class="chat-info"><strong>Chat Type:</strong> ${chat.chatType}</div>
            <div class="chat-info"><strong>Participants:</strong> ${chat.participants?.length || 0}</div>
            <div class="chat-info"><strong>Last Message:</strong> ${chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleString() : 'N/A'}</div>
        </div>
`;

  // Sort messages by timestamp
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  sortedMessages.forEach(message => {
    const senderName = message.sender?.name || message.sender?.username || 'Unknown';
    const timestamp = message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Unknown time';
    const isOwnMessage = message.sender?.profileid === currentUser?.profileid;
    
    html += `        <div class="message${isOwnMessage ? ' own' : ''}">\n`;
    html += `            <div class="message-header">\n`;
    html += `                <span class="sender">${senderName}</span>\n`;
    html += `                <span class="timestamp">${timestamp}</span>\n`;
    html += `            </div>\n`;
    
    if (message.content) {
      html += `            <div class="content">${message.content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>\n`;
    }
    
    if (message.attachments && message.attachments.length > 0) {
      html += `            <div class="attachments">\n`;
      html += `                <strong>Attachments (${message.attachments.length}):</strong>\n`;
      message.attachments.forEach((attachment, index) => {
        html += `                <div class="attachment">${index + 1}. ${attachment.filename || attachment.type} (${attachment.size ? (attachment.size / 1024).toFixed(2) + ' KB' : 'N/A'})</div>\n`;
        if (attachment.url) {
          html += `                <div class="attachment"><a href="${attachment.url}" target="_blank">View Attachment</a></div>\n`;
        }
      });
      html += `            </div>\n`;
    }
    
    if (message.reactions && message.reactions.length > 0) {
      const reactionSummary = message.reactions.map(r => `${r.emoji}`).join(' ');
      html += `            <div class="reactions"><strong>Reactions:</strong> ${reactionSummary}</div>\n`;
    }
    
    if (message.isEdited) {
      html += `            <div class="reactions"><em>(edited)</em></div>\n`;
    }
    
    html += `        </div>\n`;
  });

  html += `        <div class="metadata">\n`;
  html += `            Exported by: ${currentUser?.name || currentUser?.username || 'Unknown user'}<br>\n`;
  html += `            Exported at: ${new Date().toLocaleString()}<br>\n`;
  html += `            Export format: swaggo-chat-export-v1.0\n`;
  html += `        </div>\n`;
  html += `    </div>\n`;
  html += `</body>\n`;
  html += `</html>`;

  return html;
};

/**
 * Trigger download of exported chat data
 * @param {string} data - Exported chat data
 * @param {string} filename - Filename for the export
 * @param {string} mimeType - MIME type for the export
 */
export const downloadExport = (data, filename, mimeType) => {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export chat conversation in specified format
 * @param {Object} chat - Chat object
 * @param {Array} messages - Array of messages
 * @param {Object} currentUser - Current user object
 * @param {string} format - Export format ('json', 'txt', 'html')
 */
export const exportChatConversation = (chat, messages, currentUser, format = 'json') => {
  let data, filename, mimeType;
  
  switch (format) {
    case 'json':
      data = exportChatAsJSON(chat, messages, currentUser);
      filename = `chat-export-${chat.chatid}-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
      break;
    case 'txt':
      data = exportChatAsText(chat, messages, currentUser);
      filename = `chat-export-${chat.chatid}-${new Date().toISOString().split('T')[0]}.txt`;
      mimeType = 'text/plain';
      break;
    case 'html':
      data = exportChatAsHTML(chat, messages, currentUser);
      filename = `chat-export-${chat.chatid}-${new Date().toISOString().split('T')[0]}.html`;
      mimeType = 'text/html';
      break;
    default:
      throw new Error('Unsupported export format');
  }
  
  downloadExport(data, filename, mimeType);
};
