import React, { useState, useRef, useEffect } from 'react';
import EnhancedVirtualScroll from './EnhancedVirtualScroll';
import useProgressiveLoading from '../../hooks/useProgressiveLoading';
import { MessageCircle, Image, Video, File, Loader, Wifi, WifiOff, Zap } from 'lucide-react';

/**
 * 🚀 Progressive Loading Demo Component
 * 
 * Demonstrates enhanced progressive loading in a chat interface
 * 
 * Features:
 * - Virtual scrolling with progressive loading
 * - Performance monitoring
 * - Network condition simulation
 * - Loading state visualization
 */

export default function ProgressiveLoadingDemo({ theme = 'light' }) {
  const [messages, setMessages] = useState([]);
  const [messageCount, setMessageCount] = useState(1000);
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef(null);
  
  const {
    loadingStatus,
    networkConditions,
    performanceStats,
    addItem,
    isItemLoaded,
    isItemLoading,
    getItemData
  } = useProgressiveLoading({
    maxConcurrent: 10,
    adaptiveLoading: true
  });

  // Generate sample messages
  const generateMessages = useCallback((count) => {
    setIsGenerating(true);
    
    const newMessages = [];
    const messageTypes = ['text', 'image', 'video', 'file'];
    const senders = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
    
    for (let i = 0; i < count; i++) {
      const type = messageTypes[Math.floor(Math.random() * messageTypes.length)];
      const sender = senders[Math.floor(Math.random() * senders.length)];
      
      newMessages.push({
        id: `msg_${i}`,
        type,
        sender,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        content: type === 'text' 
          ? `This is message #${i} from ${sender}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`
          : type === 'image'
          ? `https://picsum.photos/300/200?random=${i}`
          : type === 'video'
          ? `https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4`
          : `document_${i}.pdf`,
        read: Math.random() > 0.3,
        reactions: Math.random() > 0.7 ? ['👍', '❤️'] : []
      });
    }
    
    setMessages(newMessages);
    setIsGenerating(false);
  }, []);

  // Generate initial messages
  useEffect(() => {
    generateMessages(messageCount);
  }, [messageCount, generateMessages]);

  // Simulate loading different types of content
  const simulateLoadItem = useCallback(async (item) => {
    // Simulate different load times based on content type
    let loadTime = 100;
    
    switch (item.type) {
      case 'image':
        loadTime = 500 + Math.random() * 1000;
        break;
      case 'video':
        loadTime = 1000 + Math.random() * 2000;
        break;
      case 'file':
        loadTime = 300 + Math.random() * 700;
        break;
      default:
        loadTime = 50 + Math.random() * 200;
    }
    
    // Simulate network conditions
    switch (networkConditions) {
      case 'slow':
        loadTime *= 3;
        break;
      case 'fast':
        loadTime *= 0.5;
        break;
    }
    
    // Simulate random failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Failed to load resource');
    }
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, loadTime));
    
    // Return loaded data
    return {
      ...item,
      loadedAt: Date.now(),
      loadTime
    };
  }, [networkConditions]);

  // Render a chat message
  const renderMessage = useCallback((item, index, loadedData, fromCache) => {
    const isOwn = item.sender === 'You';
    
    return (
      <div 
        key={item.id}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
          isOwn 
            ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white' 
            : theme === 'dark' 
              ? 'bg-gray-700 text-white' 
              : 'bg-gray-100 text-gray-900'
        } rounded-2xl px-4 py-2 shadow-sm`}>
          <div className="flex items-center mb-1">
            {!isOwn && (
              <span className="text-xs font-medium mr-2">
                {item.sender}
              </span>
            )}
            <span className={`text-xs ${isOwn ? 'text-white/70' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {fromCache && (
              <span className="ml-2 text-xs opacity-70">
                (cached)
              </span>
            )}
          </div>
          
          <div className="flex items-start">
            {item.type === 'text' && (
              <p className="text-sm">{item.content}</p>
            )}
            
            {item.type === 'image' && (
              <div className="relative">
                <img 
                  src={item.content} 
                  alt={`Image from ${item.sender}`}
                  className="rounded-lg max-w-full h-auto"
                  loading="lazy"
                />
                {loadedData && loadedData.loadTime && (
                  <div className={`absolute bottom-1 right-1 text-xs px-1 rounded ${
                    theme === 'dark' ? 'bg-black/50 text-white' : 'bg-white/70 text-gray-900'
                  }`}>
                    {loadedData.loadTime}ms
                  </div>
                )}
              </div>
            )}
            
            {item.type === 'video' && (
              <div className="relative">
                <video 
                  src={item.content} 
                  controls
                  className="rounded-lg max-w-full h-auto"
                />
                {loadedData && loadedData.loadTime && (
                  <div className={`absolute bottom-1 right-1 text-xs px-1 rounded ${
                    theme === 'dark' ? 'bg-black/50 text-white' : 'bg-white/70 text-gray-900'
                  }`}>
                    {loadedData.loadTime}ms
                  </div>
                )}
              </div>
            )}
            
            {item.type === 'file' && (
              <div className="flex items-center p-2 bg-white/20 rounded-lg">
                <File className="w-5 h-5 mr-2" />
                <div>
                  <div className="text-sm font-medium">{item.content}</div>
                  <div className="text-xs opacity-75">Click to download</div>
                </div>
              </div>
            )}
          </div>
          
          {item.reactions && item.reactions.length > 0 && (
            <div className="flex mt-2 space-x-1">
              {item.reactions.map((reaction, idx) => (
                <span 
                  key={idx}
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isOwn 
                      ? 'bg-white/20 text-white' 
                      : theme === 'dark' 
                        ? 'bg-gray-600 text-gray-200' 
                        : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {reaction}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }, [theme]);

  // Get message icon based on type
  const getMessageIcon = (type) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'file': return <File className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className={`flex flex-col h-full ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${
        theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Progressive Loading Demo
          </h2>
          
          <div className="flex items-center space-x-2">
            {/* Network indicator */}
            <div className={`flex items-center px-2 py-1 rounded-full text-xs ${
              networkConditions === 'slow' 
                ? 'bg-yellow-100 text-yellow-800' 
                : networkConditions === 'fast' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
            }`}>
              {networkConditions === 'slow' ? (
                <WifiOff className="w-3 h-3 mr-1" />
              ) : (
                <Wifi className="w-3 h-3 mr-1" />
              )}
              {networkConditions}
            </div>
            
            {/* Performance indicator */}
            {performanceStats.averageLoadTime > 0 && (
              <div className={`flex items-center px-2 py-1 rounded-full text-xs ${
                performanceStats.averageLoadTime > 1000
                  ? 'bg-red-100 text-red-800'
                  : performanceStats.averageLoadTime > 500
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
              }`}>
                <Zap className="w-3 h-3 mr-1" />
                {performanceStats.averageLoadTime}ms
              </div>
            )}
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center mt-4 space-x-4">
          <div className="flex items-center">
            <label className={`text-sm font-medium mr-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Messages:
            </label>
            <input
              type="number"
              value={messageCount}
              onChange={(e) => setMessageCount(Math.max(10, Math.min(10000, parseInt(e.target.value) || 1000)))}
              className={`w-24 px-2 py-1 text-sm border rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          
          <button
            onClick={() => generateMessages(messageCount)}
            disabled={isGenerating}
            className={`px-3 py-1 text-sm rounded ${
              isGenerating
                ? theme === 'dark' 
                  ? 'bg-gray-600 text-gray-400' 
                  : 'bg-gray-200 text-gray-500'
                : theme === 'dark' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className={`p-2 text-xs border-b ${
        theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Loaded: {loadingStatus.loadedItems}
            </span>
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Loading: {loadingStatus.loadingQueue}
            </span>
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Queue: {loadingStatus.priorityQueue}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Total: {performanceStats.totalLoaded}
            </span>
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Failed: {performanceStats.totalFailed}
            </span>
          </div>
        </div>
      </div>
      
      {/* Chat messages with virtual scrolling */}
      <div className="flex-1 overflow-hidden">
        {messages.length > 0 ? (
          <EnhancedVirtualScroll
            items={messages}
            itemHeight={80} // Approximate height of a message
            containerRef={containerRef}
            renderItem={renderMessage}
            buffer={15}
            overscan={10}
            theme={theme}
          />
        ) : (
          <div className={`flex items-center justify-center h-full ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <div className="text-center">
              <Loader className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p>Generating messages...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className={`p-2 text-xs border-t ${
        theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'
      }`}>
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center">
            <MessageCircle className="w-3 h-3 mr-1" />
            <span>Text</span>
          </div>
          <div className="flex items-center">
            <Image className="w-3 h-3 mr-1" />
            <span>Image</span>
          </div>
          <div className="flex items-center">
            <Video className="w-3 h-3 mr-1" />
            <span>Video</span>
          </div>
          <div className="flex items-center">
            <File className="w-3 h-3 mr-1" />
            <span>File</span>
          </div>
        </div>
      </div>
    </div>
  );
}