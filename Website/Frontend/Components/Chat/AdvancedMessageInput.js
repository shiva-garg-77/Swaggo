'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Smile, Paperclip, Mic, MicOff, Image, Camera, FileText, 
  Plus, X, Settings, Palette, Type, Clock, Bookmark, Star, 
  Edit3, Volume2, VolumeX, RotateCcw, Play, Pause, Square, 
  Scissors, PaintBucket, Layers, Monitor, Filter, AlertTriangle, 
  Calendar, Bell, MessageSquare, Gamepad2, Timer, Trash2, 
  Eye, EyeOff, Screenshot, Zap, Bot, Hash, AtSign, Quote,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Code, Link, Strikethrough, Subscript,
  Superscript, FontStyle, Paintbrush, PenTool, Eraser, Move,
  MoreHorizontal, ChevronUp, ChevronDown, Maximize2, Minimize2
} from 'lucide-react';

// Font options
const FONT_FAMILIES = [
  { name: 'Default', value: 'system-ui, -apple-system, sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Monaco', value: 'Monaco, monospace' },
  { name: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
  { name: 'Impact', value: 'Impact, sans-serif' },
  { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' }
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48];

const MESSAGE_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A',
  '#808080', '#000080', '#008000', '#800000'
];

const QUICK_GAMES = [
  { id: 'rps', name: 'Rock Paper Scissors', icon: '✂️' },
  { id: 'dice', name: 'Roll Dice', icon: '🎲' },
  { id: '8ball', name: '8-Ball', icon: '🎱' },
  { id: 'coin', name: 'Coin Flip', icon: '🪙' },
  { id: 'quiz', name: 'Quick Quiz', icon: '🧠' },
  { id: 'riddle', name: 'Riddle', icon: '🤔' }
];

const AUTO_DELETE_OPTIONS = [
  { value: '5min', label: '5 minutes', ms: 5 * 60 * 1000 },
  { value: '30min', label: '30 minutes', ms: 30 * 60 * 1000 },
  { value: '1hour', label: '1 hour', ms: 60 * 60 * 1000 },
  { value: '1day', label: '1 day', ms: 24 * 60 * 60 * 1000 },
  { value: '1week', label: '1 week', ms: 7 * 24 * 60 * 60 * 1000 }
];

const AdvancedMessageInput = ({ 
  onSendMessage, 
  placeholder = "Type a message...", 
  chatid,
  socket,
  replyingTo,
  onCancelReply,
  isTyping,
  onStartTyping,
  onStopTyping
}) => {
  // Basic message state
  const [message, setMessage] = useState('');
  const [selectedFont, setSelectedFont] = useState(FONT_FAMILIES[0]);
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState('left');

  // Panel states
  const [showFontPanel, setShowFontPanel] = useState(false);
  const [showDrawingPanel, setShowDrawingPanel] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showRemindersPanel, setShowRemindersPanel] = useState(false);
  const [showBookmarksPanel, setShowBookmarksPanel] = useState(false);
  const [showGamesPanel, setShowGamesPanel] = useState(false);
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);
  const [showAutoDeletePanel, setShowAutoDeletePanel] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showAttachmentPanel, setShowAttachmentPanel] = useState(false);
  
  // Voice features
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceToTextSupported, setVoiceToTextSupported] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingCanvas, setDrawingCanvas] = useState(null);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  // Notes and reminders
  const [notes, setNotes] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  
  // Message options
  const [scheduledTime, setScheduledTime] = useState('');
  const [autoDeleteTime, setAutoDeleteTime] = useState(null);
  const [isExpandedInput, setIsExpandedInput] = useState(false);

  // Refs
  const textareaRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Initialize voice recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const speechRecognition = new window.webkitSpeechRecognition();
      speechRecognition.continuous = true;
      speechRecognition.interimResults = true;
      speechRecognition.lang = 'en-US';
      
      speechRecognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setMessage(prev => prev + finalTranscript);
        }
      };
      
      speechRecognition.onerror = (event) => {
        setIsListening(false);
      };
      
      speechRecognition.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(speechRecognition);
      setVoiceToTextSupported(true);
      
      // CRITICAL FIX: Memory leak prevention - cleanup on unmount
      return () => {
        if (speechRecognition) {
          speechRecognition.stop();
          speechRecognition.onresult = null;
          speechRecognition.onerror = null;
          speechRecognition.onend = null;
        }
      };
    }
  }, []);

  // Handle voice-to-text toggle
  const toggleVoiceToText = useCallback(() => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  }, [recognition, isListening]);

  // Drawing functions
  const startDrawing = (e) => {
    if (!canvasRef.current) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const saveDrawing = () => {
    if (!canvasRef.current) return;
    const dataURL = canvasRef.current.toDataURL();
    onSendMessage('', [], 'drawing', { drawingData: dataURL });
    clearCanvas();
    setShowDrawingPanel(false);
  };

  // Screenshot detection
  const detectScreenshot = useCallback(() => {
    if ('getDisplayMedia' in navigator.mediaDevices) {
      navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(stream => {
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          
          video.addEventListener('loadedmetadata', () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            
            canvas.toBlob(blob => {
              const file = new File([blob], 'screenshot.png', { type: 'image/png' });
              onSendMessage('', [file], 'screenshot');
            });
            
            stream.getTracks().forEach(track => track.stop());
          });
        })
        .catch(err => console.error('Screenshot failed:', err));
    }
  }, [onSendMessage]);

  // Handle message send
  const handleSendMessage = () => {
    if (!message.trim() && !drawingCanvas) return;
    
    const messageData = {
      content: message,
      formatting: {
        fontFamily: selectedFont.value,
        fontSize,
        color: textColor,
        backgroundColor,
        bold: isBold,
        italic: isItalic,
        underline: isUnderline,
        align: textAlign
      },
      scheduled: scheduledTime ? new Date(scheduledTime).getTime() : null,
      autoDelete: autoDeleteTime,
      replyTo: replyingTo
    };

    onSendMessage(message, [], 'formatted', messageData);
    
    // Reset form
    setMessage('');
    setScheduledTime('');
    setAutoDeleteTime(null);
    if (onCancelReply) onCancelReply();
  };

  // Handle game actions
  const playGame = (gameId) => {
    const games = {
      rps: () => {
        const choices = ['rock', 'paper', 'scissors'];
        const playerChoice = prompt('Choose: rock, paper, or scissors');
        const botChoice = choices[Math.floor(Math.random() * choices.length)];
        onSendMessage(`🎮 Rock Paper Scissors: You chose ${playerChoice}, I chose ${botChoice}`, [], 'game');
      },
      dice: () => {
        const roll = Math.floor(Math.random() * 6) + 1;
        onSendMessage(`🎲 Dice roll: ${roll}`, [], 'game');
      },
      coin: () => {
        const result = Math.random() > 0.5 ? 'Heads' : 'Tails';
        onSendMessage(`🪙 Coin flip: ${result}`, [], 'game');
      },
      '8ball': () => {
        const answers = [
          'Yes', 'No', 'Maybe', 'Ask again later', 'Definitely',
          'Absolutely not', 'Signs point to yes', 'Don\'t count on it'
        ];
        const answer = answers[Math.floor(Math.random() * answers.length)];
        onSendMessage(`🎱 Magic 8-Ball says: ${answer}`, [], 'game');
      }
    };
    
    if (games[gameId]) {
      games[gameId]();
      setShowGamesPanel(false);
    }
  };

  // Add note
  const addNote = (noteText) => {
    const newNote = {
      id: Date.now(),
      text: noteText,
      timestamp: new Date().toISOString(),
      chatId: chatid
    };
    setNotes(prev => [...prev, newNote]);
  };

  // Add reminder
  const addReminder = (reminderText, time) => {
    const newReminder = {
      id: Date.now(),
      text: reminderText,
      time: new Date(time).getTime(),
      chatId: chatid,
      active: true
    };
    setReminders(prev => [...prev, newReminder]);
    
    // Set timeout for reminder
    const now = Date.now();
    const delay = newReminder.time - now;
    if (delay > 0) {
      setTimeout(() => {
        alert(`Reminder: ${reminderText}`);
      }, delay);
    }
  };

  const getMessageStyle = () => ({
    fontFamily: selectedFont.value,
    fontSize: `${fontSize}px`,
    color: textColor,
    backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
    fontWeight: isBold ? 'bold' : 'normal',
    fontStyle: isItalic ? 'italic' : 'normal',
    textDecoration: isUnderline ? 'underline' : 'none',
    textAlign: textAlign
  });

  return (
    <div className="relative">
      {/* Main Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        {/* Reply Preview */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-blue-600 mb-1">Replying to</div>
                  <div className="text-sm text-blue-800">{replyingTo.content}</div>
                </div>
                <button onClick={onCancelReply} className="text-blue-400 hover:text-blue-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced Toolbar */}
        <div className="flex flex-wrap gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
          <button
            onClick={() => setShowFontPanel(!showFontPanel)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Font Options"
          >
            <Type className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowDrawingPanel(!showDrawingPanel)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Drawing Tool"
          >
            <PenTool className="w-4 h-4" />
          </button>
          
          <button
            onClick={detectScreenshot}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Take Screenshot"
          >
            <Monitor className="w-4 h-4" />
          </button>
          
          {voiceToTextSupported && (
            <button
              onClick={toggleVoiceToText}
              className={`p-2 rounded-lg transition-colors ${
                isListening ? 'bg-red-200 text-red-700' : 'hover:bg-gray-200'
              }`}
              title="Voice to Text"
            >
              {isListening ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
          
          <button
            onClick={() => setShowNotesPanel(!showNotesPanel)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Notes"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowRemindersPanel(!showRemindersPanel)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Reminders"
          >
            <Bell className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowBookmarksPanel(!showBookmarksPanel)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Bookmarks"
          >
            <Bookmark className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowGamesPanel(!showGamesPanel)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Quick Games"
          >
            <Gamepad2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowSchedulePanel(!showSchedulePanel)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Schedule Message"
          >
            <Calendar className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowAutoDeletePanel(!showAutoDeletePanel)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Auto Delete"
          >
            <Timer className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsExpandedInput(!isExpandedInput)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Expand Input"
          >
            {isExpandedInput ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Text Input Area */}
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={placeholder}
              style={getMessageStyle()}
              className={`w-full px-4 py-3 bg-white border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isExpandedInput ? 'min-h-[120px]' : 'min-h-[48px]'
              }`}
              rows={isExpandedInput ? 6 : 1}
            />
            
            {/* Voice listening indicator */}
            {isListening && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Listening...
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowEmojiPanel(!showEmojiPanel)}
            className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowAttachmentPanel(!showAttachmentPanel)}
            className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className={`p-3 rounded-lg transition-colors ${
              message.trim() 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Status indicators */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            {autoDeleteTime && (
              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                Auto-delete: {AUTO_DELETE_OPTIONS.find(opt => opt.value === autoDeleteTime)?.label}
              </span>
            )}
            {scheduledTime && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                Scheduled: {new Date(scheduledTime).toLocaleString()}
              </span>
            )}
          </div>
          
          <div className="text-right">
            {isListening && <span className="text-red-500">🎤 Listening</span>}
            {isTyping && <span className="text-blue-500">Typing...</span>}
          </div>
        </div>
      </div>

      {/* Feature Panels */}
      
      {/* Font Panel */}
      <AnimatePresence>
        {showFontPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-t-lg shadow-lg p-4 z-50"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Font Options</h3>
              <button onClick={() => setShowFontPanel(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Font Family</label>
                <select
                  value={selectedFont.name}
                  onChange={(e) => setSelectedFont(FONT_FAMILIES.find(f => f.name === e.target.value))}
                  className="w-full p-2 border rounded"
                >
                  {FONT_FAMILIES.map(font => (
                    <option key={font.name} value={font.name}>{font.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Font Size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full p-2 border rounded"
                >
                  {FONT_SIZES.map(size => (
                    <option key={size} value={size}>{size}px</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Text Color</label>
                <div className="grid grid-cols-8 gap-1">
                  {MESSAGE_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setTextColor(color)}
                      className={`w-6 h-6 rounded border-2 ${textColor === color ? 'border-black' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Background</label>
                <div className="grid grid-cols-8 gap-1">
                  <button
                    onClick={() => setBackgroundColor('transparent')}
                    className={`w-6 h-6 rounded border-2 bg-white ${backgroundColor === 'transparent' ? 'border-black' : 'border-gray-300'}`}
                  >
                    ∅
                  </button>
                  {MESSAGE_COLORS.slice(1).map(color => (
                    <button
                      key={color}
                      onClick={() => setBackgroundColor(color)}
                      className={`w-6 h-6 rounded border-2 ${backgroundColor === color ? 'border-black' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setIsBold(!isBold)}
                  className={`p-2 rounded ${isBold ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsItalic(!isItalic)}
                  className={`p-2 rounded ${isItalic ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsUnderline(!isUnderline)}
                  className={`p-2 rounded ${isUnderline ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  <Underline className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setTextAlign('left')}
                  className={`p-2 rounded ${textAlign === 'left' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTextAlign('center')}
                  className={`p-2 rounded ${textAlign === 'center' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTextAlign('right')}
                  className={`p-2 rounded ${textAlign === 'right' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawing Panel */}
      <AnimatePresence>
        {showDrawingPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-t-lg shadow-lg p-4 z-50"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Drawing Tool</h3>
              <button onClick={() => setShowDrawingPanel(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-4">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="border border-gray-300 rounded cursor-crosshair w-full"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-8 h-8 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Size</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-20"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={clearCanvas}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Clear
                </button>
                <button
                  onClick={saveDrawing}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Send Drawing
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Games Panel */}
      <AnimatePresence>
        {showGamesPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-t-lg shadow-lg p-4 z-50"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Quick Games</h3>
              <button onClick={() => setShowGamesPanel(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {QUICK_GAMES.map(game => (
                <button
                  key={game.id}
                  onClick={() => playGame(game.id)}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">{game.icon}</span>
                  <span className="font-medium">{game.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto Delete Panel */}
      <AnimatePresence>
        {showAutoDeletePanel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-t-lg shadow-lg p-4 z-50"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Auto Delete Timer</h3>
              <button onClick={() => setShowAutoDeletePanel(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => setAutoDeleteTime(null)}
                className={`w-full text-left p-2 rounded ${!autoDeleteTime ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
              >
                No auto-delete
              </button>
              {AUTO_DELETE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setAutoDeleteTime(option.value)}
                  className={`w-full text-left p-2 rounded ${autoDeleteTime === option.value ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Panel */}
      <AnimatePresence>
        {showSchedulePanel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-t-lg shadow-lg p-4 z-50"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Schedule Message</h3>
              <button onClick={() => setShowSchedulePanel(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Send at</label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setScheduledTime('');
                    setShowSchedulePanel(false);
                  }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowSchedulePanel(false)}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Set Schedule
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*/*"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files);
          onSendMessage('', files, 'file');
        }}
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files);
          onSendMessage('', files, 'camera');
        }}
      />
    </div>
  );
};

export default AdvancedMessageInput;
