'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bookmark, Star, Search, Filter, Trash2, Share2, Copy, 
  Download, Archive, Calendar, Clock, User, MessageSquare,
  Gamepad2, Trophy, Target, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6,
  X, Plus, MoreHorizontal, Tag, Hash, Eye, EyeOff, Pin,
  Play, Pause, RotateCcw, Award, Medal, Crown, Zap, Hash as HashIcon,
  Sparkles, Gift, Heart, ThumbsUp, Laugh, Frown, Angry, ChevronDown, ChevronUp
} from 'lucide-react';

const GAME_TYPES = [
  { 
    id: 'rock-paper-scissors', 
    name: 'Rock Paper Scissors', 
    icon: '✂️', 
    description: 'Classic hand game',
    color: 'bg-blue-100 text-blue-800'
  },
  { 
    id: 'dice-roll', 
    name: 'Dice Roll', 
    icon: '🎲', 
    description: 'Roll the dice',
    color: 'bg-green-100 text-green-800'
  },
  { 
    id: 'coin-flip', 
    name: 'Coin Flip', 
    icon: '🪙', 
    description: 'Heads or tails',
    color: 'bg-yellow-100 text-yellow-800'
  },
  { 
    id: '8ball', 
    name: 'Magic 8-Ball', 
    icon: '🎱', 
    description: 'Ask the magic 8-ball',
    color: 'bg-purple-100 text-purple-800'
  },
  { 
    id: 'trivia', 
    name: 'Quick Trivia', 
    icon: '🧠', 
    description: 'Test your knowledge',
    color: 'bg-red-100 text-red-800'
  },
  { 
    id: 'word-game', 
    name: 'Word Challenge', 
    icon: '📝', 
    description: 'Word-based challenges',
    color: 'bg-indigo-100 text-indigo-800'
  }
];

const RPS_CHOICES = [
  { id: 'rock', name: 'Rock', icon: '🪨', beats: 'scissors' },
  { id: 'paper', name: 'Paper', icon: '📄', beats: 'rock' },
  { id: 'scissors', name: 'Scissors', icon: '✂️', beats: 'paper' }
];

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const TRIVIA_QUESTIONS = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correct: 2
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correct: 1
  },
  {
    question: "What is 7 × 8?",
    options: ["54", "56", "48", "63"],
    correct: 1
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Leonardo da Vinci", "Michelangelo"],
    correct: 2
  }
];

const EIGHT_BALL_RESPONSES = [
  "Yes, definitely", "No way", "Ask again later", "Very likely",
  "Don't count on it", "Absolutely", "Maybe", "Signs point to yes",
  "Reply hazy, try again", "Without a doubt", "My sources say no",
  "Yes, in due time", "Concentrate and ask again", "Outlook not so good"
];

const BookmarksGamesSystem = ({ 
  chatId, 
  user, 
  messages = [],
  isVisible, 
  onClose, 
  onSendGameMessage,
  onBookmarkMessage 
}) => {
  const [activeTab, setActiveTab] = useState('bookmarks');
  const [bookmarks, setBookmarks] = useState([]);
  const [gameResults, setGameResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  
  // Game states
  const [activeGame, setActiveGame] = useState(null);
  const [gameState, setGameState] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerStats, setPlayerStats] = useState({});
  
  // UI states
  const [showGameDetails, setShowGameDetails] = useState({});
  const [selectedBookmark, setSelectedBookmark] = useState(null);
  const [showBookmarkActions, setShowBookmarkActions] = useState({});

  // Load data from localStorage
  useEffect(() => {
    const savedBookmarks = localStorage.getItem(`bookmarks_${chatId}`);
    const savedGameResults = localStorage.getItem(`gameResults_${chatId}`);
    const savedPlayerStats = localStorage.getItem(`playerStats_${chatId}`);
    
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
    
    if (savedGameResults) {
      setGameResults(JSON.parse(savedGameResults));
    }
    
    if (savedPlayerStats) {
      setPlayerStats(JSON.parse(savedPlayerStats));
    }
  }, [chatId]);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem(`bookmarks_${chatId}`, JSON.stringify(bookmarks));
  }, [bookmarks, chatId]);

  useEffect(() => {
    localStorage.setItem(`gameResults_${chatId}`, JSON.stringify(gameResults));
  }, [gameResults, chatId]);

  useEffect(() => {
    localStorage.setItem(`playerStats_${chatId}`, JSON.stringify(playerStats));
  }, [playerStats, chatId]);

  // Helper functions
  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  const addBookmark = (messageId, messageContent, messageType = 'text') => {
    const newBookmark = {
      id: generateId(),
      messageId,
      content: messageContent,
      type: messageType,
      createdAt: new Date().toISOString(),
      chatId,
      userId: user?.id,
      tags: [],
      note: ''
    };
    
    setBookmarks(prev => [newBookmark, ...prev]);
    if (onBookmarkMessage) {
      onBookmarkMessage(messageId, true);
    }
  };

  const removeBookmark = (bookmarkId) => {
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    if (bookmark && onBookmarkMessage) {
      onBookmarkMessage(bookmark.messageId, false);
    }
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
  };

  const updateBookmark = (bookmarkId, updates) => {
    setBookmarks(prev => prev.map(bookmark => 
      bookmark.id === bookmarkId ? { ...bookmark, ...updates } : bookmark
    ));
  };

  const addGameResult = (gameType, result, details) => {
    const newResult = {
      id: generateId(),
      gameType,
      result,
      details,
      createdAt: new Date().toISOString(),
      chatId,
      userId: user?.id
    };
    
    setGameResults(prev => [newResult, ...prev]);
    
    // Update player stats
    setPlayerStats(prev => {
      const gameStats = prev[gameType] || { played: 0, won: 0, lost: 0, tied: 0 };
      return {
        ...prev,
        [gameType]: {
          ...gameStats,
          played: gameStats.played + 1,
          won: result === 'win' ? gameStats.won + 1 : gameStats.won,
          lost: result === 'lose' ? gameStats.lost + 1 : gameStats.lost,
          tied: result === 'tie' ? gameStats.tied + 1 : gameStats.tied
        }
      };
    });
  };

  // Game functions
  const playRockPaperScissors = (playerChoice) => {
    const computerChoice = RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)];
    let result = 'tie';
    
    if (playerChoice.beats === computerChoice.id) {
      result = 'win';
    } else if (computerChoice.beats === playerChoice.id) {
      result = 'lose';
    }
    
    const gameDetails = {
      playerChoice: playerChoice.id,
      computerChoice: computerChoice.id,
      result
    };
    
    addGameResult('rock-paper-scissors', result, gameDetails);
    
    const message = `🎮 Rock Paper Scissors\n` +
      `You: ${playerChoice.icon} ${playerChoice.name}\n` +
      `Computer: ${computerChoice.icon} ${computerChoice.name}\n` +
      `Result: ${result === 'win' ? '🎉 You win!' : result === 'lose' ? '😢 You lose!' : '🤝 It\'s a tie!'}`;
    
    if (onSendGameMessage) {
      onSendGameMessage(message, 'rock-paper-scissors', gameDetails);
    }
    
    return gameDetails;
  };

  const rollDice = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    const gameDetails = { roll };
    
    addGameResult('dice-roll', 'played', gameDetails);
    
    const message = `🎲 Dice Roll: ${DICE_FACES[roll - 1]} (${roll})`;
    
    if (onSendGameMessage) {
      onSendGameMessage(message, 'dice-roll', gameDetails);
    }
    
    return gameDetails;
  };

  const flipCoin = () => {
    const result = Math.random() > 0.5 ? 'heads' : 'tails';
    const gameDetails = { result };
    
    addGameResult('coin-flip', 'played', gameDetails);
    
    const message = `🪙 Coin Flip: ${result === 'heads' ? '👑 Heads' : '🏛️ Tails'}`;
    
    if (onSendGameMessage) {
      onSendGameMessage(message, 'coin-flip', gameDetails);
    }
    
    return gameDetails;
  };

  const askEightBall = (question) => {
    const response = EIGHT_BALL_RESPONSES[Math.floor(Math.random() * EIGHT_BALL_RESPONSES.length)];
    const gameDetails = { question, response };
    
    addGameResult('8ball', 'played', gameDetails);
    
    const message = `🎱 Magic 8-Ball\nQ: ${question}\nA: ${response}`;
    
    if (onSendGameMessage) {
      onSendGameMessage(message, '8ball', gameDetails);
    }
    
    return gameDetails;
  };

  const playTrivia = (questionIndex, selectedAnswer) => {
    const question = TRIVIA_QUESTIONS[questionIndex];
    const isCorrect = selectedAnswer === question.correct;
    const result = isCorrect ? 'win' : 'lose';
    
    const gameDetails = {
      question: question.question,
      selectedAnswer: question.options[selectedAnswer],
      correctAnswer: question.options[question.correct],
      isCorrect
    };
    
    addGameResult('trivia', result, gameDetails);
    
    const message = `🧠 Trivia\nQ: ${question.question}\n` +
      `Your answer: ${question.options[selectedAnswer]}\n` +
      `Correct answer: ${question.options[question.correct]}\n` +
      `Result: ${isCorrect ? '✅ Correct!' : '❌ Wrong!'}`;
    
    if (onSendGameMessage) {
      onSendGameMessage(message, 'trivia', gameDetails);
    }
    
    return gameDetails;
  };

  // Filter and sort functions
  const filteredBookmarks = bookmarks.filter(bookmark => {
    if (searchQuery && !bookmark.content.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !bookmark.note.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'tagged' && bookmark.tags.length === 0) return false;
      if (selectedFilter === 'noted' && !bookmark.note) return false;
      if (selectedFilter !== 'tagged' && selectedFilter !== 'noted' && bookmark.type !== selectedFilter) return false;
    }
    
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'recent':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  const filteredGameResults = gameResults.filter(result => {
    if (searchQuery && !result.gameType.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (selectedFilter !== 'all' && result.gameType !== selectedFilter) {
      return false;
    }
    
    return true;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
          <h2 className="text-lg font-semibold text-gray-900">Bookmarks & Games</h2>
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
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'bookmarks' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bookmark className="w-4 h-4 inline mr-2" />
            Bookmarks
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'games' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Gamepad2 className="w-4 h-4 inline mr-2" />
            Games
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
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All {activeTab}</option>
            {activeTab === 'bookmarks' && (
              <>
                <option value="text">Text Messages</option>
                <option value="image">Images</option>
                <option value="file">Files</option>
                <option value="tagged">With Tags</option>
                <option value="noted">With Notes</option>
              </>
            )}
            {activeTab === 'games' && GAME_TYPES.map(game => (
              <option key={game.id} value={game.id}>{game.name}</option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-2 px-3 border border-gray-300 rounded-lg text-sm"
          >
            <option value="recent">Recent</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'bookmarks' && (
          <div className="p-4">
            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No bookmarks yet</p>
                <p className="text-sm mt-2">Bookmark messages to save them here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookmarks.map(bookmark => (
                  <motion.div
                    key={bookmark.id}
                    layout
                    className="p-4 bg-gray-50 rounded-lg border relative group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm text-gray-900 mb-2 line-clamp-3">
                          {bookmark.content}
                        </div>
                        
                        {bookmark.note && (
                          <div className="text-xs text-gray-600 italic mb-2 p-2 bg-yellow-50 rounded">
                            📝 {bookmark.note}
                          </div>
                        )}
                        
                        {bookmark.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {bookmark.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{new Date(bookmark.createdAt).toLocaleDateString()}</span>
                          <span className={`px-2 py-1 rounded-full ${
                            bookmark.type === 'text' ? 'bg-green-100 text-green-800' :
                            bookmark.type === 'image' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {bookmark.type}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button
                          onClick={() => navigator.clipboard.writeText(bookmark.content)}
                          className="p-1 hover:bg-gray-200 rounded text-gray-500"
                          title="Copy"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        
                        <button
                          onClick={() => setShowBookmarkActions(prev => ({ 
                            ...prev, 
                            [bookmark.id]: !prev[bookmark.id] 
                          }))}
                          className="p-1 hover:bg-gray-200 rounded text-gray-500"
                          title="More Actions"
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </button>
                        
                        <button
                          onClick={() => removeBookmark(bookmark.id)}
                          className="p-1 hover:bg-red-200 rounded text-red-600"
                          title="Remove Bookmark"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Bookmark Actions */}
                    <AnimatePresence>
                      {showBookmarkActions[bookmark.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-gray-200 pt-3 mt-3"
                        >
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Add a note..."
                              value={bookmark.note || ''}
                              onChange={(e) => updateBookmark(bookmark.id, { note: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded text-sm"
                            />
                            
                            <input
                              type="text"
                              placeholder="Add tags (comma separated)..."
                              value={bookmark.tags.join(', ')}
                              onChange={(e) => updateBookmark(bookmark.id, { 
                                tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                              })}
                              className="w-full p-2 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'games' && (
          <div className="p-4">
            {/* Game Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {GAME_TYPES.map(game => (
                <motion.button
                  key={game.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveGame(game.id)}
                  className={`p-4 rounded-lg border-2 border-dashed transition-colors ${
                    activeGame === game.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <div className="text-2xl mb-2">{game.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{game.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{game.description}</div>
                  
                  {playerStats[game.id] && (
                    <div className="text-xs text-gray-600 mt-2">
                      Played: {playerStats[game.id].played}
                      {playerStats[game.id].won > 0 && ` | Won: ${playerStats[game.id].won}`}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Active Game Interface */}
            <AnimatePresence mode="wait">
              {activeGame && (
                <motion.div
                  key={activeGame}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white border rounded-lg p-4 mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">
                      {GAME_TYPES.find(g => g.id === activeGame)?.name}
                    </h3>
                    <button
                      onClick={() => setActiveGame(null)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Rock Paper Scissors */}
                  {activeGame === 'rock-paper-scissors' && (
                    <div className="space-y-4">
                      <div className="text-center text-sm text-gray-600 mb-4">
                        Choose your weapon!
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {RPS_CHOICES.map(choice => (
                          <motion.button
                            key={choice.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => playRockPaperScissors(choice)}
                            className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                          >
                            <div className="text-2xl mb-2">{choice.icon}</div>
                            <div className="text-sm font-medium">{choice.name}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dice Roll */}
                  {activeGame === 'dice-roll' && (
                    <div className="text-center space-y-4">
                      <div className="text-6xl">{gameState.lastRoll ? DICE_FACES[gameState.lastRoll - 1] : '🎲'}</div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const result = rollDice();
                          setGameState({ lastRoll: result.roll });
                        }}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Roll the Dice
                      </motion.button>
                    </div>
                  )}

                  {/* Coin Flip */}
                  {activeGame === 'coin-flip' && (
                    <div className="text-center space-y-4">
                      <div className="text-6xl">
                        {gameState.lastFlip ? 
                          (gameState.lastFlip === 'heads' ? '👑' : '🏛️') : 
                          '🪙'
                        }
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const result = flipCoin();
                          setGameState({ lastFlip: result.result });
                        }}
                        className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Flip Coin
                      </motion.button>
                    </div>
                  )}

                  {/* Magic 8-Ball */}
                  {activeGame === '8ball' && (
                    <div className="space-y-4">
                      <div className="text-center text-4xl mb-4">🎱</div>
                      <input
                        type="text"
                        placeholder="Ask the magic 8-ball a question..."
                        value={gameState.question || ''}
                        onChange={(e) => setGameState(prev => ({ ...prev, question: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (gameState.question?.trim()) {
                            askEightBall(gameState.question);
                            setGameState({ question: '' });
                          }
                        }}
                        disabled={!gameState.question?.trim()}
                        className="w-full py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Ask the 8-Ball
                      </motion.button>
                    </div>
                  )}

                  {/* Trivia */}
                  {activeGame === 'trivia' && (
                    <div className="space-y-4">
                      {gameState.currentQuestion !== undefined ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-4">
                            {TRIVIA_QUESTIONS[gameState.currentQuestion].question}
                          </div>
                          <div className="space-y-2">
                            {TRIVIA_QUESTIONS[gameState.currentQuestion].options.map((option, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  playTrivia(gameState.currentQuestion, index);
                                  setGameState({ currentQuestion: undefined });
                                }}
                                className="w-full p-3 text-left border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-4xl mb-4">🧠</div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const questionIndex = Math.floor(Math.random() * TRIVIA_QUESTIONS.length);
                              setGameState({ currentQuestion: questionIndex });
                            }}
                            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Start Trivia
                          </motion.button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Results */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Recent Games
              </h3>
              
              {filteredGameResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No games played yet</p>
                  <p className="text-sm mt-2">Play some games to see results here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredGameResults.slice(0, 20).map(result => (
                    <motion.div
                      key={result.id}
                      layout
                      className="p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {GAME_TYPES.find(g => g.id === result.gameType)?.icon}
                          </span>
                          <span className="font-medium text-sm">
                            {GAME_TYPES.find(g => g.id === result.gameType)?.name}
                          </span>
                          {result.result === 'win' && <Trophy className="w-4 h-4 text-yellow-500" />}
                          {result.result === 'lose' && <span className="text-red-500 text-sm">Lost</span>}
                          {result.result === 'tie' && <span className="text-gray-500 text-sm">Tie</span>}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(result.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        {result.gameType === 'rock-paper-scissors' && (
                          `You: ${result.details.playerChoice}, Computer: ${result.details.computerChoice}`
                        )}
                        {result.gameType === 'dice-roll' && (
                          `Rolled: ${result.details.roll}`
                        )}
                        {result.gameType === 'coin-flip' && (
                          `Result: ${result.details.result}`
                        )}
                        {result.gameType === '8ball' && (
                          `"${result.details.question}" - ${result.details.response}`
                        )}
                        {result.gameType === 'trivia' && (
                          `${result.details.isCorrect ? 'Correct' : 'Wrong'} - ${result.details.question.slice(0, 50)}...`
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BookmarksGamesSystem;
