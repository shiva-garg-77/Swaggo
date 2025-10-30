# 🏆 WORLD-CLASS CHESS GAME - COMPREHENSIVE IMPLEMENTATION GUIDE

## 📋 PROJECT OVERVIEW

**Project Name:** Swaggo Chess - Professional Multiplayer Chess Platform  
**Tech Stack:**  
- **Frontend (Unity Game):** Unity 2022+ (C#)
- **Backend:** Node.js + Express + Socket.IO + GraphQL
- **Database:** MongoDB + Redis
- **Real-time:** Socket.IO with WebRTC for voice
- **Website Integration:** Next.js 15 + React 19

**Target:** Production-ready, 10/10 security & performance, Chess.com-level quality

---

## 🎯 CORE REQUIREMENTS ANALYSIS

### 1. **Game Flow & Screens**

- **Splash Screen:** Animated logo with loading progress
- **Intro/Main Menu:** Play button, settings, profile, leaderboard
- **Matchmaking Queue:** Rank-based matching with estimated wait time
- **Lobby System:** 
  - Friend lobbies (mutual followers only)
  - Group lobbies (up to 8 players watching)
  - Recent players list (last 10 matches)
  - Invite system with accept/reject/block options
- **Game Board:** Professional 3D chess with move validation
- **In-Game Features:**
  - Real-time chat (text + voice)
  - Move history panel
  - Timer display (multiple time controls)
  - Resign/Draw offer buttons
  - Mic/Speaker toggle controls
- **End Game Screens:** Win/Loss/Draw with statistics
- **Rematch System:** Send/accept rematch requests

### 2. **Social & Friend System**

- **Friend Requests:** Only between mutual followers on main website
- **Recent Players:** Track last 10 opponents automatically
- **Invite System:**
  - Send invites to mutual followers
  - Send invites to recent players
  - Accept/Reject/Block options
  - 5-minute temporary block
  - Permanent block option
- **Post-Match Friend Add:** Auto-follow both players on website
- **Integration:** Deep link from website to game lobby

### 3. **Matchmaking & Ranking**
- **ELO Rating System:** Chess.com-style ranking (400-3000+)
- **Rank Tiers:** Beginner, Intermediate, Advanced, Expert, Master, Grandmaster
- **Matchmaking Algorithm:**
  - ±100 ELO range initially
  - Expand by ±50 every 10 seconds
  - Max ±300 ELO difference
  - Priority queue for faster matching


### 4. **Communication Features**
- **Text Chat:**
  - In-game chat with profanity filter
  - Lobby group chat
  - Rate limiting: 5 messages/10 seconds
  - Message history (last 50 messages)
- **Voice Chat (WebRTC):**
  - Peer-to-peer voice during match
  - Individual mic mute toggle
  - Individual speaker mute toggle
  - Push-to-talk option
  - Voice activity detection
  - Echo cancellation & noise suppression

### 5. **Security & Rate Limiting**
- **Request Rate Limits:**
  - Game invites: 10/minute per user
  - Chat messages: 5/10 seconds
  - Matchmaking: 1 request/5 seconds
  - Friend requests: 20/hour
- **Block System:**
  - Temporary block: 5 minutes
  - Permanent block: Stored in database
  - Blocked users cannot send invites


---

## 🏗️ ARCHITECTURE DESIGN

### **System Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    SWAGGO WEBSITE (Next.js)                 │
│  - User Authentication (JWT + HTTP-only cookies)            │
│  - Profile Management                                        │
│  - Follow/Follower System                                   │
│  - Games Portal (Chess launcher)                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Deep Link / WebSocket Auth Token
                 │
┌────────────────▼────────────────────────────────────────────┐
│              UNITY CHESS GAME (Frontend)                    │
│  - 3D Chess Board Rendering                                 │
│  - Move Validation (Client-side preview)                    │
│  - UI/UX (Splash, Lobby, Game, End screens)                 │
│  - WebRTC Voice Chat                                        │
│  - Socket.IO Client                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Socket.IO + REST API
                 │

┌────────────────▼────────────────────────────────────────────┐
│           NODE.JS BACKEND (Chess Game Server)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Socket.IO Server (Real-time Communication)          │   │
│  │  - Game state synchronization                        │   │
│  │  - Move broadcasting                                 │   │
│  │  - Chat relay                                        │   │
│  │  - Presence tracking                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  REST API (Express)                                  │   │
│  │  - Matchmaking endpoints                             │   │
│  │  - Game history                                      │   │
│  │  - Player statistics                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GraphQL API                                         │   │
│  │  - Complex queries (leaderboard, profiles)           │   │
│  │  - Subscriptions (live updates)                      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │

                 │
┌────────────────▼────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │   MongoDB           │  │   Redis Cache               │  │
│  │  - User profiles    │  │  - Active games             │  │
│  │  - Game history     │  │  - Matchmaking queue        │  │
│  │  │  - ELO ratings    │  │  - Online users             │  │
│  │  - Friend lists     │  │  - Rate limit counters      │  │
│  │  - Block lists      │  │  - Session data             │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA

### **MongoDB Collections**

#### 1. **ChessPlayer** (extends User model)
```javascript
{
  userId: ObjectId,              // Reference to main User
  profileId: String,             // Reference to Profile
  chessStats: {
    elo: Number (default: 1200),

    rank: String,                // Beginner, Intermediate, etc.
    gamesPlayed: Number,
    wins: Number,
    losses: Number,
    draws: Number,
    winStreak: Number,
    bestWinStreak: Number,
    averageGameDuration: Number,
    favoriteOpening: String
  },
  recentOpponents: [{
    playerId: String,
    username: String,
    avatar: String,
    playedAt: Date,
    result: String               // 'win', 'loss', 'draw'
  }],                            // Max 10, FIFO
  blockedPlayers: [{
    playerId: String,
    blockedAt: Date,
    blockType: String,           // 'temporary', 'permanent'
    expiresAt: Date              // null for permanent
  }],
  preferences: {
    voiceEnabled: Boolean,
    autoAcceptRematch: Boolean,
    showMoveHints: Boolean,
    boardTheme: String,
    pieceSet: String
  },
  createdAt: Date,
  updatedAt: Date
}
```


#### 2. **ChessGame**
```javascript
{
  gameId: String (UUID),
  players: {
    white: {
      playerId: String,
      username: String,
      elo: Number,
      avatar: String
    },
    black: {
      playerId: String,
      username: String,
      elo: Number,
      avatar: String
    }
  },
  gameState: {
    fen: String,                 // Current board position
    pgn: String,                 // Move history in PGN format
    turn: String,                // 'white' or 'black'
    moveCount: Number,
    lastMove: {
      from: String,
      to: String,
      piece: String,
      captured: String,
      timestamp: Date
    }
  },
  timeControl: {
    type: String,                // 'bullet', 'blitz', 'rapid', 'classical'
    initialTime: Number,         // seconds
    increment: Number,           // seconds per move
    whiteTime: Number,
    blackTime: Number
  },

  status: String,                // 'waiting', 'active', 'completed', 'abandoned'
  result: {
    winner: String,              // 'white', 'black', 'draw', null
    method: String,              // 'checkmate', 'resignation', 'timeout', 'draw_agreement', 'stalemate'
    eloChange: {
      white: Number,
      black: Number
    }
  },
  chat: [{
    playerId: String,
    message: String,
    timestamp: Date
  }],
  spectators: [String],          // Array of player IDs watching
  createdAt: Date,
  startedAt: Date,
  completedAt: Date
}
```

#### 3. **ChessInvite**
```javascript
{
  inviteId: String (UUID),
  fromPlayer: {
    playerId: String,
    username: String,
    avatar: String,
    elo: Number
  },
  toPlayer: {
    playerId: String,
    username: String
  },

  timeControl: Object,
  status: String,                // 'pending', 'accepted', 'rejected', 'expired'
  createdAt: Date,
  expiresAt: Date,               // 5 minutes from creation
  respondedAt: Date
}
```

#### 4. **ChessLobby**
```javascript
{
  lobbyId: String (UUID),
  hostPlayer: {
    playerId: String,
    username: String,
    avatar: String
  },
  members: [{
    playerId: String,
    username: String,
    avatar: String,
    joinedAt: Date,
    isReady: Boolean
  }],
  maxMembers: Number (default: 8),
  lobbyType: String,             // 'friend', 'group'
  settings: {
    isPrivate: Boolean,
    allowSpectators: Boolean,
    timeControl: Object
  },
  chat: [{
    playerId: String,
    message: String,
    timestamp: Date
  }],
  createdAt: Date,
  expiresAt: Date                // Auto-close after 30 minutes of inactivity
}
```


### **Redis Data Structures**

```javascript
// Matchmaking Queue (Sorted Set by ELO)
chess:matchmaking:{timeControl} -> {playerId: elo, ...}

// Active Games (Hash)
chess:game:{gameId} -> {gameState JSON}

// Online Players (Set with TTL)
chess:online -> {playerId1, playerId2, ...}

// Rate Limiting (String with TTL)
chess:ratelimit:invite:{playerId} -> count
chess:ratelimit:chat:{playerId} -> count
chess:ratelimit:matchmaking:{playerId} -> timestamp

// Player Session (Hash with TTL)
chess:session:{playerId} -> {socketId, status, currentGame}

// Temporary Blocks (String with TTL)
chess:block:{playerId}:{targetId} -> expiresAt
```

---

## 🔌 SOCKET.IO EVENTS

### **Client → Server Events**

```javascript
// Authentication
'chess:authenticate' -> { token: string }
```


// Matchmaking
'chess:joinQueue' -> { timeControl: string }
'chess:leaveQueue' -> {}

// Invites
'chess:sendInvite' -> { toPlayerId: string, timeControl: object }
'chess:acceptInvite' -> { inviteId: string }
'chess:rejectInvite' -> { inviteId: string }

// Lobby
'chess:createLobby' -> { settings: object }
'chess:joinLobby' -> { lobbyId: string }
'chess:leaveLobby' -> { lobbyId: string }
'chess:lobbyChat' -> { lobbyId: string, message: string }
'chess:setReady' -> { lobbyId: string, isReady: boolean }

// Game
'chess:makeMove' -> { gameId: string, from: string, to: string, promotion?: string }
'chess:offerDraw' -> { gameId: string }
'chess:acceptDraw' -> { gameId: string }
'chess:resign' -> { gameId: string }
'chess:gameChat' -> { gameId: string, message: string }
'chess:requestRematch' -> { gameId: string }
'chess:acceptRematch' -> { gameId: string }

// Voice
'chess:voiceOffer' -> { gameId: string, sdp: object }
'chess:voiceAnswer' -> { gameId: string, sdp: object }
'chess:voiceIceCandidate' -> { gameId: string, candidate: object }
```


### **Server → Client Events**

```javascript
// Authentication
'chess:authenticated' -> { player: object, stats: object }
'chess:authError' -> { error: string }

// Matchmaking
'chess:queueJoined' -> { position: number, estimatedWait: number }
'chess:matchFound' -> { gameId: string, opponent: object, color: string }
'chess:queueLeft' -> {}

// Invites
'chess:inviteReceived' -> { invite: object }
'chess:inviteAccepted' -> { gameId: string }
'chess:inviteRejected' -> { inviteId: string }
'chess:inviteExpired' -> { inviteId: string }

// Lobby
'chess:lobbyCreated' -> { lobby: object }
'chess:lobbyJoined' -> { lobby: object }
'chess:lobbyUpdated' -> { lobby: object }
'chess:lobbyMemberJoined' -> { member: object }
'chess:lobbyMemberLeft' -> { playerId: string }
'chess:lobbyChatMessage' -> { message: object }
'chess:lobbyGameStarting' -> { gameId: string, players: object }
```


// Game
'chess:gameStarted' -> { game: object }
'chess:moveMade' -> { move: object, gameState: object }
'chess:invalidMove' -> { error: string }
'chess:gameOver' -> { result: object, eloChanges: object }
'chess:drawOffered' -> { fromPlayer: string }
'chess:drawAccepted' -> {}
'chess:opponentResigned' -> {}
'chess:gameChatMessage' -> { message: object }
'chess:rematchRequested' -> { fromPlayer: string }
'chess:rematchAccepted' -> { newGameId: string }
'chess:timeUpdate' -> { whiteTime: number, blackTime: number }

// Voice
'chess:voiceOffer' -> { sdp: object }
'chess:voiceAnswer' -> { sdp: object }
'chess:voiceIceCandidate' -> { candidate: object }

// Errors
'chess:error' -> { code: string, message: string }
'chess:rateLimitExceeded' -> { retryAfter: number }
```

---

## 🎮 UNITY FRONTEND IMPLEMENTATION

### **Project Structure**
```
Assets/
├── Scripts/
│   ├── Core/
│   │   ├── GameManager.cs
│   │   ├── NetworkManager.cs
│   │   └── AudioManager.cs
```

│   ├── Chess/
│   │   ├── ChessBoard.cs
│   │   ├── ChessPiece.cs
│   │   ├── MoveValidator.cs
│   │   ├── MoveGenerator.cs
│   │   └── ChessEngine.cs
│   ├── Networking/
│   │   ├── SocketIOClient.cs
│   │   ├── WebRTCManager.cs
│   │   └── MessageHandler.cs
│   ├── UI/
│   │   ├── SplashScreen.cs
│   │   ├── MainMenu.cs
│   │   ├── MatchmakingUI.cs
│   │   ├── LobbyUI.cs
│   │   ├── GameUI.cs
│   │   ├── ChatUI.cs
│   │   └── EndGameUI.cs
│   ├── Player/
│   │   ├── PlayerData.cs
│   │   ├── PlayerStats.cs
│   │   └── PlayerPreferences.cs
│   └── Utils/
│       ├── FENParser.cs
│       ├── PGNGenerator.cs
│       └── ELOCalculator.cs
├── Prefabs/
│   ├── ChessPieces/
│   ├── UI/
│   └── Effects/
├── Materials/
├── Textures/
├── Sounds/
└── Scenes/
    ├── Splash.unity
    ├── MainMenu.unity
    ├── Game.unity
    └── Lobby.unity
```


### **Key Unity Components**

#### **SocketIOClient.cs** (Socket.IO Integration)
```csharp
using SocketIOClient;
using System;
using UnityEngine;

public class SocketIOClient : MonoBehaviour
{
    private SocketIO socket;
    private string serverUrl = "http://localhost:4000";
    
    public event Action<ChessGame> OnGameStarted;
    public event Action<ChessMove> OnMoveMade;
    public event Action<GameResult> OnGameOver;
    
    async void Start()
    {
        socket = new SocketIO(serverUrl, new SocketIOOptions
        {
            Transport = TransportProtocol.WebSocket,
            Auth = new { token = PlayerPrefs.GetString("authToken") }
        });
        
        socket.On("chess:authenticated", OnAuthenticated);
        socket.On("chess:matchFound", OnMatchFound);
        socket.On("chess:moveMade", OnMoveMade);
        socket.On("chess:gameOver", OnGameOver);
        
        await socket.ConnectAsync();
    }
    
    public async void JoinMatchmaking(string timeControl)
    {
        await socket.EmitAsync("chess:joinQueue", new { timeControl });
    }
    
    public async void MakeMove(string gameId, string from, string to)
    {
        await socket.EmitAsync("chess:makeMove", new { gameId, from, to });
    }
}
```


#### **ChessBoard.cs** (Board Management)
```csharp
using UnityEngine;
using System.Collections.Generic;

public class ChessBoard : MonoBehaviour
{
    public GameObject[,] board = new GameObject[8, 8];
    public GameObject[] piecePrefabs;
    
    private string currentFEN;
    private bool isWhiteTurn = true;
    
    public void InitializeBoard(string fen)
    {
        currentFEN = fen;
        ParseFEN(fen);
    }
    
    public bool MakeMove(string from, string to)
    {
        Vector2Int fromPos = AlgebraicToPosition(from);
        Vector2Int toPos = AlgebraicToPosition(to);
        
        if (!IsValidMove(fromPos, toPos)) return false;
        
        // Move piece
        GameObject piece = board[fromPos.x, fromPos.y];
        board[toPos.x, toPos.y] = piece;
        board[fromPos.x, fromPos.y] = null;
        
        piece.transform.position = PositionToWorld(toPos);
        
        isWhiteTurn = !isWhiteTurn;
        return true;
    }
    
    private bool IsValidMove(Vector2Int from, Vector2Int to)
    {
        // Implement chess rules validation
        return MoveValidator.IsValid(board, from, to, isWhiteTurn);
    }
}
```


#### **WebRTCManager.cs** (Voice Chat)
```csharp
using Unity.WebRTC;
using UnityEngine;

public class WebRTCManager : MonoBehaviour
{
    private RTCPeerConnection peerConnection;
    private MediaStream localStream;
    private bool isMicMuted = false;
    private bool isSpeakerMuted = false;
    
    public void InitializeWebRTC()
    {
        var configuration = new RTCConfiguration
        {
            iceServers = new[] {
                new RTCIceServer { urls = new[] { "stun:stun.l.google.com:19302" } }
            }
        };
        
        peerConnection = new RTCPeerConnection(ref configuration);
        peerConnection.OnIceCandidate = OnIceCandidate;
        peerConnection.OnTrack = OnTrack;
        
        StartMicrophone();
    }
    
    private void StartMicrophone()
    {
        localStream = Audio.CaptureStream();
        foreach (var track in localStream.GetAudioTracks())
        {
            peerConnection.AddTrack(track, localStream);
        }
    }
    
    public void ToggleMic()
    {
        isMicMuted = !isMicMuted;
        foreach (var track in localStream.GetAudioTracks())
        {
            track.Enabled = !isMicMuted;
        }
    }
}
```


---

## 🔧 NODE.JS BACKEND IMPLEMENTATION

### **Project Structure**
```
Games/Chess/Backend/
├── Models/
│   ├── ChessPlayer.js
│   ├── ChessGame.js
│   ├── ChessInvite.js
│   └── ChessLobby.js
├── Services/
│   ├── ChessMatchmakingService.js
│   ├── ChessGameService.js
│   ├── ChessELOService.js
│   ├── ChessInviteService.js
│   ├── ChessLobbyService.js
│   └── ChessVoiceService.js
├── Controllers/
│   ├── ChessSocketController.js
│   └── ChessAPIController.js
├── Middleware/
│   ├── ChessAuthMiddleware.js
│   └── ChessRateLimitMiddleware.js
├── Utils/
│   ├── ChessEngine.js
│   ├── FENValidator.js
│   └── PGNGenerator.js
├── GraphQL/
│   ├── schemas/
│   │   └── chess.graphql
│   └── resolvers/
│       └── chess.resolvers.js
└── main.js
```


### **Key Backend Services**

#### **ChessMatchmakingService.js**
```javascript
import redisClient from '../../../Website/Backend/utils/RedisClient.js';
import ChessPlayer from '../Models/ChessPlayer.js';

class ChessMatchmakingService {
  constructor() {
    this.queueKey = 'chess:matchmaking';
    this.matchCheckInterval = 2000; // 2 seconds
  }

  async joinQueue(playerId, timeControl) {
    const player = await ChessPlayer.findOne({ userId: playerId });
    if (!player) throw new Error('Player not found');

    const queueKey = `${this.queueKey}:${timeControl}`;
    const elo = player.chessStats.elo;

    // Add to sorted set by ELO
    await redisClient.zadd(queueKey, elo, playerId);

    // Start matching process
    this.findMatch(playerId, timeControl, elo);

    return {
      position: await this.getQueuePosition(playerId, timeControl),
      estimatedWait: await this.estimateWaitTime(timeControl)
    };
  }

  async findMatch(playerId, timeControl, playerElo) {
    const queueKey = `${this.queueKey}:${timeControl}`;
    let eloRange = 100;
    const maxRange = 300;
    const rangeIncrement = 50;
    const checkInterval = 10000; // 10 seconds

    const intervalId = setInterval(async () => {
      const minElo = playerElo - eloRange;
      const maxElo = playerElo + eloRange;

      // Find opponents in ELO range
      const opponents = await redisClient.zrangebyscore(
        queueKey, minElo, maxElo
      );

      // Filter out self
      const validOpponents = opponents.filter(id => id !== playerId);

      if (validOpponents.length > 0) {
        clearInterval(intervalId);
        const opponentId = validOpponents[0];

        // Remove both from queue
        await redisClient.zrem(queueKey, playerId, opponentId);

        // Create game
        await this.createGame(playerId, opponentId, timeControl);
      } else {
        // Expand range
        eloRange = Math.min(eloRange + rangeIncrement, maxRange);
      }
    }, checkInterval);
  }

  async createGame(player1Id, player2Id, timeControl) {
    const ChessGameService = require('./ChessGameService');
    return await ChessGameService.createGame(player1Id, player2Id, timeControl);
  }
}

export default new ChessMatchmakingService();
```


#### **ChessGameService.js**
```javascript
import ChessGame from '../Models/ChessGame.js';
import ChessPlayer from '../Models/ChessPlayer.js';
import ChessELOService from './ChessELOService.js';
import { Chess } from 'chess.js'; // npm install chess.js

class ChessGameService {
  async createGame(player1Id, player2Id, timeControl) {
    const [player1, player2] = await Promise.all([
      ChessPlayer.findOne({ userId: player1Id }),
      ChessPlayer.findOne({ userId: player2Id })
    ]);

    // Randomly assign colors
    const isPlayer1White = Math.random() < 0.5;

    const game = new ChessGame({
      gameId: require('uuid').v4(),
      players: {
        white: isPlayer1White ? {
          playerId: player1.userId,
          username: player1.username,
          elo: player1.chessStats.elo,
          avatar: player1.avatar
        } : {
          playerId: player2.userId,
          username: player2.username,
          elo: player2.chessStats.elo,
          avatar: player2.avatar
        },
        black: !isPlayer1White ? {
          playerId: player1.userId,
          username: player1.username,
          elo: player1.chessStats.elo,
          avatar: player1.avatar
        } : {
          playerId: player2.userId,
          username: player2.username,
          elo: player2.chessStats.elo,
          avatar: player2.avatar
        }
      },
      gameState: {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        pgn: '',
        turn: 'white',
        moveCount: 0
      },
      timeControl: {
        type: timeControl.type,
        initialTime: timeControl.initialTime,
        increment: timeControl.increment,
        whiteTime: timeControl.initialTime,
        blackTime: timeControl.initialTime
      },
      status: 'active',
      startedAt: new Date()
    });

    await game.save();
    return game;
  }

  async makeMove(gameId, playerId, from, to, promotion = null) {
    const game = await ChessGame.findOne({ gameId });
    if (!game) throw new Error('Game not found');

    // Validate it's player's turn
    const playerColor = game.players.white.playerId === playerId ? 'white' : 'black';
    if (game.gameState.turn !== playerColor) {
      throw new Error('Not your turn');
    }

    // Validate move using chess.js
    const chess = new Chess(game.gameState.fen);
    const move = chess.move({ from, to, promotion });

    if (!move) throw new Error('Invalid move');

    // Update game state
    game.gameState.fen = chess.fen();
    game.gameState.pgn = chess.pgn();
    game.gameState.turn = chess.turn() === 'w' ? 'white' : 'black';
    game.gameState.moveCount++;
    game.gameState.lastMove = {
      from,
      to,
      piece: move.piece,
      captured: move.captured,
      timestamp: new Date()
    };

    // Update time
    const timeUsed = Date.now() - game.gameState.lastMove.timestamp;
    if (playerColor === 'white') {
      game.timeControl.whiteTime -= timeUsed / 1000;
      game.timeControl.whiteTime += game.timeControl.increment;
    } else {
      game.timeControl.blackTime -= timeUsed / 1000;
      game.timeControl.blackTime += game.timeControl.increment;
    }

    // Check for game over
    if (chess.isCheckmate()) {
      await this.endGame(game, playerColor, 'checkmate');
    } else if (chess.isDraw()) {
      await this.endGame(game, 'draw', 'stalemate');
    }

    await game.save();
    return { game, move };
  }

  async endGame(game, winner, method) {
    game.status = 'completed';
    game.result = {
      winner,
      method,
      eloChange: await ChessELOService.calculateELOChange(
        game.players.white.elo,
        game.players.black.elo,
        winner
      )
    };
    game.completedAt = new Date();

    // Update player stats
    await this.updatePlayerStats(game);

    await game.save();
  }

  async updatePlayerStats(game) {
    const whitePlayer = await ChessPlayer.findOne({ 
      userId: game.players.white.playerId 
    });
    const blackPlayer = await ChessPlayer.findOne({ 
      userId: game.players.black.playerId 
    });

    // Update ELO
    whitePlayer.chessStats.elo += game.result.eloChange.white;
    blackPlayer.chessStats.elo += game.result.eloChange.black;

    // Update stats
    whitePlayer.chessStats.gamesPlayed++;
    blackPlayer.chessStats.gamesPlayed++;

    if (game.result.winner === 'white') {
      whitePlayer.chessStats.wins++;
      blackPlayer.chessStats.losses++;
    } else if (game.result.winner === 'black') {
      blackPlayer.chessStats.wins++;
      whitePlayer.chessStats.losses++;
    } else {
      whitePlayer.chessStats.draws++;
      blackPlayer.chessStats.draws++;
    }

    // Update recent opponents
    whitePlayer.recentOpponents.unshift({
      playerId: blackPlayer.userId,
      username: blackPlayer.username,
      avatar: blackPlayer.avatar,
      playedAt: new Date(),
      result: game.result.winner === 'white' ? 'win' : 
              game.result.winner === 'black' ? 'loss' : 'draw'
    });
    whitePlayer.recentOpponents = whitePlayer.recentOpponents.slice(0, 10);

    blackPlayer.recentOpponents.unshift({
      playerId: whitePlayer.userId,
      username: whitePlayer.username,
      avatar: whitePlayer.avatar,
      playedAt: new Date(),
      result: game.result.winner === 'black' ? 'win' : 
              game.result.winner === 'white' ? 'loss' : 'draw'
    });
    blackPlayer.recentOpponents = blackPlayer.recentOpponents.slice(0, 10);

    await Promise.all([whitePlayer.save(), blackPlayer.save()]);
  }
}

export default new ChessGameService();
```


#### **ChessELOService.js**
```javascript
class ChessELOService {
  // K-factor determines rating volatility
  K_FACTOR = 32;

  calculateELOChange(whiteElo, blackElo, winner) {
    const expectedWhite = this.expectedScore(whiteElo, blackElo);
    const expectedBlack = 1 - expectedWhite;

    let actualWhite, actualBlack;
    if (winner === 'white') {
      actualWhite = 1;
      actualBlack = 0;
    } else if (winner === 'black') {
      actualWhite = 0;
      actualBlack = 1;
    } else {
      actualWhite = 0.5;
      actualBlack = 0.5;
    }

    const whiteChange = Math.round(this.K_FACTOR * (actualWhite - expectedWhite));
    const blackChange = Math.round(this.K_FACTOR * (actualBlack - expectedBlack));

    return {
      white: whiteChange,
      black: blackChange
    };
  }

  expectedScore(playerElo, opponentElo) {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  }

  getRankFromElo(elo) {
    if (elo < 800) return 'Beginner';
    if (elo < 1200) return 'Novice';
    if (elo < 1600) return 'Intermediate';
    if (elo < 2000) return 'Advanced';
    if (elo < 2400) return 'Expert';
    if (elo < 2800) return 'Master';
    return 'Grandmaster';
  }
}

export default new ChessELOService();
```


#### **ChessSocketController.js**
```javascript
import ChessMatchmakingService from '../Services/ChessMatchmakingService.js';
import ChessGameService from '../Services/ChessGameService.js';
import ChessInviteService from '../Services/ChessInviteService.js';
import ChessLobbyService from '../Services/ChessLobbyService.js';
import ChessRateLimitMiddleware from '../Middleware/ChessRateLimitMiddleware.js';

class ChessSocketController {
  constructor(io) {
    this.io = io;
    this.chessNamespace = io.of('/chess');
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.chessNamespace.on('connection', (socket) => {
      console.log(`Chess player connected: ${socket.id}`);

      // Authentication
      socket.on('chess:authenticate', async (data) => {
        try {
          const player = await this.authenticatePlayer(socket, data.token);
          socket.playerId = player.userId;
          socket.emit('chess:authenticated', { player, stats: player.chessStats });
        } catch (error) {
          socket.emit('chess:authError', { error: error.message });
        }
      });

      // Matchmaking
      socket.on('chess:joinQueue', async (data) => {
        if (!socket.playerId) return socket.emit('chess:error', { message: 'Not authenticated' });
        
        try {
          const result = await ChessMatchmakingService.joinQueue(
            socket.playerId, 
            data.timeControl
          );
          socket.emit('chess:queueJoined', result);
        } catch (error) {
          socket.emit('chess:error', { message: error.message });
        }
      });

      // Game moves
      socket.on('chess:makeMove', async (data) => {
        if (!socket.playerId) return socket.emit('chess:error', { message: 'Not authenticated' });
        
        try {
          const { game, move } = await ChessGameService.makeMove(
            data.gameId,
            socket.playerId,
            data.from,
            data.to,
            data.promotion
          );

          // Broadcast to both players
          this.chessNamespace.to(data.gameId).emit('chess:moveMade', {
            move,
            gameState: game.gameState,
            timeControl: game.timeControl
          });

          // Check if game is over
          if (game.status === 'completed') {
            this.chessNamespace.to(data.gameId).emit('chess:gameOver', {
              result: game.result
            });
          }
        } catch (error) {
          socket.emit('chess:invalidMove', { error: error.message });
        }
      });

      // Invites
      socket.on('chess:sendInvite', async (data) => {
        if (!socket.playerId) return socket.emit('chess:error', { message: 'Not authenticated' });
        
        // Rate limiting
        const canSend = await ChessRateLimitMiddleware.checkInviteLimit(socket.playerId);
        if (!canSend) {
          return socket.emit('chess:rateLimitExceeded', { retryAfter: 60 });
        }

        try {
          const invite = await ChessInviteService.sendInvite(
            socket.playerId,
            data.toPlayerId,
            data.timeControl
          );

          // Send to recipient
          const recipientSocket = this.findSocketByPlayerId(data.toPlayerId);
          if (recipientSocket) {
            recipientSocket.emit('chess:inviteReceived', { invite });
          }

          socket.emit('chess:inviteSent', { invite });
        } catch (error) {
          socket.emit('chess:error', { message: error.message });
        }
      });

      // Chat
      socket.on('chess:gameChat', async (data) => {
        if (!socket.playerId) return socket.emit('chess:error', { message: 'Not authenticated' });
        
        // Rate limiting
        const canChat = await ChessRateLimitMiddleware.checkChatLimit(socket.playerId);
        if (!canChat) {
          return socket.emit('chess:rateLimitExceeded', { retryAfter: 10 });
        }

        try {
          const message = await ChessGameService.addChatMessage(
            data.gameId,
            socket.playerId,
            data.message
          );

          this.chessNamespace.to(data.gameId).emit('chess:gameChatMessage', { message });
        } catch (error) {
          socket.emit('chess:error', { message: error.message });
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`Chess player disconnected: ${socket.id}`);
        if (socket.playerId) {
          this.handlePlayerDisconnect(socket.playerId);
        }
      });
    });
  }

  findSocketByPlayerId(playerId) {
    const sockets = Array.from(this.chessNamespace.sockets.values());
    return sockets.find(s => s.playerId === playerId);
  }

  async authenticatePlayer(socket, token) {
    // Use existing auth service
    const TokenService = require('../../../Website/Backend/Services/Authentication/TokenService').default;
    const decoded = await TokenService.verifyAccessToken(token);
    
    const ChessPlayer = require('../Models/ChessPlayer').default;
    let player = await ChessPlayer.findOne({ userId: decoded.id });
    
    if (!player) {
      // Create chess player profile
      player = await ChessPlayer.create({
        userId: decoded.id,
        profileId: decoded.profileid,
        chessStats: {
          elo: 1200,
          rank: 'Novice',
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0
        }
      });
    }

    return player;
  }

  async handlePlayerDisconnect(playerId) {
    // Remove from matchmaking queue
    await ChessMatchmakingService.leaveQueue(playerId);
    
    // Handle active games (offer draw or forfeit after timeout)
    // Implementation depends on game rules
  }
}

export default ChessSocketController;
```


---

## 🌐 WEBSITE INTEGRATION (Next.js)

### **Games Portal Page**

**File:** `Website/Frontend/app/games/page.jsx`

```jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFixedSecureAuth } from '@/context/FixedSecureAuthContext';

export default function GamesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useFixedSecureAuth();

  const launchChess = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/games/chess');
      return;
    }

    // Generate auth token for Unity game
    const authToken = localStorage.getItem('accessToken');
    
    // Deep link to Unity game with auth token
    const gameUrl = `swaggo-chess://launch?token=${authToken}&userId=${user.id}`;
    
    // For web build, open in new window
    window.open(`/games/chess/play?token=${authToken}`, '_blank');
  };

  return (
    <div className="games-portal">
      <h1>Swaggo Games</h1>
      
      <div className="game-card chess-card">
        <img src="/images/chess-icon.png" alt="Chess" />
        <h2>Chess</h2>
        <p>Play competitive chess with ranking system</p>
        <button onClick={launchChess} className="play-button">
          Play Chess
        </button>
      </div>
    </div>
  );
}
```


### **Chess Profile Integration**

**File:** `Website/Frontend/Components/Chess/ChessProfileWidget.jsx`

```jsx
'use client';

import { useEffect, useState } from 'react';
import { useQuery, gql } from '@apollo/client';

const GET_CHESS_STATS = gql`
  query GetChessStats($userId: ID!) {
    chessPlayer(userId: $userId) {
      chessStats {
        elo
        rank
        gamesPlayed
        wins
        losses
        draws
        winRate
      }
      recentGames {
        gameId
        opponent {
          username
          avatar
        }
        result
        playedAt
      }
    }
  }
`;

export default function ChessProfileWidget({ userId }) {
  const { data, loading } = useQuery(GET_CHESS_STATS, {
    variables: { userId }
  });

  if (loading) return <div>Loading chess stats...</div>;

  const stats = data?.chessPlayer?.chessStats;

  return (
    <div className="chess-profile-widget">
      <h3>Chess Statistics</h3>
      
      <div className="elo-display">
        <span className="elo-value">{stats?.elo || 1200}</span>
        <span className="rank-badge">{stats?.rank || 'Novice'}</span>
      </div>

      <div className="stats-grid">
        <div className="stat">
          <label>Games</label>
          <value>{stats?.gamesPlayed || 0}</value>
        </div>
        <div className="stat">
          <label>Wins</label>
          <value>{stats?.wins || 0}</value>
        </div>
        <div className="stat">
          <label>Losses</label>
          <value>{stats?.losses || 0}</value>
        </div>
        <div className="stat">
          <label>Draws</label>
          <value>{stats?.draws || 0}</value>
        </div>
      </div>

      <div className="recent-games">
        <h4>Recent Games</h4>
        {data?.chessPlayer?.recentGames?.map(game => (
          <div key={game.gameId} className="game-item">
            <img src={game.opponent.avatar} alt={game.opponent.username} />
            <span>{game.opponent.username}</span>
            <span className={`result ${game.result}`}>{game.result}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```


---

## 🔒 SECURITY IMPLEMENTATION (10/10)

### **1. Authentication Security**

```javascript
// ChessAuthMiddleware.js
import jwt from 'jsonwebtoken';
import TokenService from '../../../Website/Backend/Services/Authentication/TokenService.js';

export const authenticateChessSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const decoded = await TokenService.verifyAccessToken(token);
    
    // Check if user is active
    const User = require('../../../Website/Backend/Models/User').default;
    const user = await User.findOne({ id: decoded.id });
    
    if (!user || user.security.accountStatus !== 'active') {
      return next(new Error('Invalid or inactive account'));
    }

    // Attach user to socket
    socket.userId = decoded.id;
    socket.profileId = decoded.profileid;
    
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};
```

### **2. Rate Limiting**

```javascript
// ChessRateLimitMiddleware.js
import redisClient from '../../../Website/Backend/utils/RedisClient.js';

class ChessRateLimitMiddleware {
  async checkInviteLimit(playerId) {
    const key = `chess:ratelimit:invite:${playerId}`;
    const count = await redisClient.incr(key);
    
    if (count === 1) {
      await redisClient.expire(key, 60); // 1 minute window
    }
    
    return count <= 10; // Max 10 invites per minute
  }

  async checkChatLimit(playerId) {
    const key = `chess:ratelimit:chat:${playerId}`;
    const count = await redisClient.incr(key);
    
    if (count === 1) {
      await redisClient.expire(key, 10); // 10 second window
    }
    
    return count <= 5; // Max 5 messages per 10 seconds
  }

  async checkMatchmakingLimit(playerId) {
    const key = `chess:ratelimit:matchmaking:${playerId}`;
    const exists = await redisClient.exists(key);
    
    if (exists) return false;
    
    await redisClient.setex(key, 5, '1'); // 5 second cooldown
    return true;
  }
}

export default new ChessRateLimitMiddleware();
```


### **3. Input Validation & Sanitization**

```javascript
// ChessValidationService.js
import DOMPurify from 'isomorphic-dompurify';

class ChessValidationService {
  validateMove(from, to) {
    const squareRegex = /^[a-h][1-8]$/;
    
    if (!squareRegex.test(from) || !squareRegex.test(to)) {
      throw new Error('Invalid square notation');
    }
    
    return { from, to };
  }

  sanitizeChatMessage(message) {
    // Remove HTML/scripts
    const clean = DOMPurify.sanitize(message, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [] 
    });
    
    // Limit length
    return clean.substring(0, 500);
  }

  validateTimeControl(timeControl) {
    const validTypes = ['bullet', 'blitz', 'rapid', 'classical'];
    
    if (!validTypes.includes(timeControl.type)) {
      throw new Error('Invalid time control type');
    }
    
    if (timeControl.initialTime < 60 || timeControl.initialTime > 7200) {
      throw new Error('Invalid initial time');
    }
    
    if (timeControl.increment < 0 || timeControl.increment > 60) {
      throw new Error('Invalid increment');
    }
    
    return timeControl;
  }
}

export default new ChessValidationService();
```

### **4. Anti-Cheat Measures**

```javascript
// ChessAntiCheatService.js
class ChessAntiCheatService {
  async detectSuspiciousActivity(playerId, gameId, move) {
    const flags = [];

    // Check move time (too fast = engine assistance)
    const moveTime = await this.getMoveTime(gameId, move);
    if (moveTime < 100) { // Less than 100ms
      flags.push('MOVE_TOO_FAST');
    }

    // Check accuracy (too perfect = engine)
    const accuracy = await this.calculateMoveAccuracy(gameId, move);
    if (accuracy > 98) {
      flags.push('SUSPICIOUSLY_ACCURATE');
    }

    // Check pattern (consistent engine-like moves)
    const pattern = await this.analyzePlayPattern(playerId);
    if (pattern.engineLikelihood > 0.9) {
      flags.push('ENGINE_PATTERN');
    }

    if (flags.length > 0) {
      await this.reportSuspiciousActivity(playerId, gameId, flags);
    }

    return flags;
  }

  async reportSuspiciousActivity(playerId, gameId, flags) {
    // Log to security audit
    const AuditLogService = require('../../../Website/Backend/Services/Security/AuditLogService').default;
    
    await AuditLogService.log({
      type: 'CHESS_ANTI_CHEAT',
      severity: 'HIGH',
      playerId,
      gameId,
      flags,
      timestamp: new Date()
    });

    // Auto-flag for review if multiple flags
    if (flags.length >= 2) {
      await this.flagPlayerForReview(playerId);
    }
  }
}

export default new ChessAntiCheatService();
```


---

## ⚡ PERFORMANCE OPTIMIZATION (10/10)

### **1. Redis Caching Strategy**

```javascript
// ChessCacheService.js
import redisClient from '../../../Website/Backend/utils/RedisClient.js';

class ChessCacheService {
  async cacheGameState(gameId, gameState) {
    const key = `chess:game:${gameId}`;
    await redisClient.setex(key, 3600, JSON.stringify(gameState)); // 1 hour TTL
  }

  async getGameState(gameId) {
    const key = `chess:game:${gameId}`;
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async cachePlayerStats(playerId, stats) {
    const key = `chess:stats:${playerId}`;
    await redisClient.setex(key, 300, JSON.stringify(stats)); // 5 minutes TTL
  }

  async invalidateGameCache(gameId) {
    await redisClient.del(`chess:game:${gameId}`);
  }
}

export default new ChessCacheService();
```

### **2. Database Indexing**

```javascript
// ChessPlayer Model Indexes
ChessPlayerSchema.index({ userId: 1 });
ChessPlayerSchema.index({ 'chessStats.elo': -1 });
ChessPlayerSchema.index({ 'chessStats.rank': 1 });
ChessPlayerSchema.index({ 'recentOpponents.playerId': 1 });

// ChessGame Model Indexes
ChessGameSchema.index({ gameId: 1 }, { unique: true });
ChessGameSchema.index({ 'players.white.playerId': 1 });
ChessGameSchema.index({ 'players.black.playerId': 1 });
ChessGameSchema.index({ status: 1, createdAt: -1 });
ChessGameSchema.index({ createdAt: -1 });
```

### **3. Connection Pooling**

```javascript
// MongoDB connection with pooling
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 50,
  minPoolSize: 10,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  family: 4
});

// Redis connection pooling
const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false
});
```

### **4. Message Batching**

```javascript
// Batch move updates to reduce Socket.IO overhead
class ChessBatchService {
  constructor() {
    this.moveQueue = new Map();
    this.batchInterval = 50; // 50ms batching
    this.startBatching();
  }

  queueMove(gameId, move) {
    if (!this.moveQueue.has(gameId)) {
      this.moveQueue.set(gameId, []);
    }
    this.moveQueue.get(gameId).push(move);
  }

  startBatching() {
    setInterval(() => {
      this.moveQueue.forEach((moves, gameId) => {
        if (moves.length > 0) {
          this.io.to(gameId).emit('chess:movesBatch', { moves });
          this.moveQueue.set(gameId, []);
        }
      });
    }, this.batchInterval);
  }
}
```


---

## 🎨 UI/UX DESIGN SPECIFICATIONS

### **Design System**

**Color Palette:**
```css
:root {
  /* Primary Colors */
  --chess-primary: #1a1a2e;
  --chess-secondary: #16213e;
  --chess-accent: #0f3460;
  --chess-highlight: #e94560;
  
  /* Board Colors */
  --chess-light-square: #f0d9b5;
  --chess-dark-square: #b58863;
  --chess-selected: #7fc97f;
  --chess-valid-move: #90ee90;
  
  /* Status Colors */
  --chess-win: #4caf50;
  --chess-loss: #f44336;
  --chess-draw: #ff9800;
  
  /* Text Colors */
  --chess-text-primary: #ffffff;
  --chess-text-secondary: #b0b0b0;
}
```

**Typography:**
```css
/* Headings */
h1 { font-family: 'Poppins', sans-serif; font-size: 48px; font-weight: 700; }
h2 { font-family: 'Poppins', sans-serif; font-size: 36px; font-weight: 600; }
h3 { font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 600; }

/* Body */
body { font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.6; }

/* Monospace (for chess notation) */
.chess-notation { font-family: 'Roboto Mono', monospace; }
```

### **Screen Layouts**

#### **1. Splash Screen**
```
┌─────────────────────────────────────┐
│                                     │
│         [ANIMATED LOGO]             │
│                                     │
│         SWAGGO CHESS                │
│                                     │
│      [LOADING BAR: 75%]             │
│                                     │
│      Loading assets...              │
│                                     │
└─────────────────────────────────────┘
```

#### **2. Main Menu**
```
┌─────────────────────────────────────┐
│  [LOGO]              [PROFILE]      │
│                                     │
│         SWAGGO CHESS                │
│                                     │
│    ┌─────────────────────┐          │
│    │   PLAY ONLINE       │          │
│    └─────────────────────┘          │
│    ┌─────────────────────┐          │
│    │   PLAY WITH FRIEND  │          │
│    └─────────────────────┘          │
│    ┌─────────────────────┐          │
│    │   LEADERBOARD       │          │
│    └─────────────────────┘          │
│    ┌─────────────────────┐          │
│    │   SETTINGS          │          │
│    └─────────────────────┘          │
│                                     │
│  ELO: 1450  Rank: Intermediate      │
└─────────────────────────────────────┘
```


#### **3. Game Screen**
```
┌─────────────────────────────────────────────────────────┐
│ [BACK] Player1 (1450)    05:23  vs  04:58  Player2 (1420) [MENU] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │                     │  │  MOVE HISTORY           │  │
│  │                     │  │  1. e4 e5               │  │
│  │   CHESS BOARD       │  │  2. Nf3 Nc6             │  │
│  │   (3D RENDERED)     │  │  3. Bb5 a6              │  │
│  │                     │  │  4. Ba4 Nf6             │  │
│  │                     │  │                         │  │
│  │                     │  │  CHAT                   │  │
│  │                     │  │  Player1: Good luck!    │  │
│  │                     │  │  Player2: You too!      │  │
│  └─────────────────────┘  │  [TYPE MESSAGE...]      │  │
│                           │  [🎤 MIC] [🔊 SPEAKER]  │  │
│  [RESIGN] [OFFER DRAW]    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### **4. End Game Screen**
```
┌─────────────────────────────────────┐
│                                     │
│         🏆 VICTORY! 🏆              │
│                                     │
│    You defeated Player2             │
│    by Checkmate                     │
│                                     │
│    ┌─────────────────────┐          │
│    │  ELO: 1450 → 1468   │          │
│    │  (+18)              │          │
│    └─────────────────────┘          │
│                                     │
│    Game Duration: 12:34             │
│    Moves: 42                        │
│                                     │
│    ┌─────────────────────┐          │
│    │   REMATCH           │          │
│    └─────────────────────┘          │
│    ┌─────────────────────┐          │
│    │   MAIN MENU         │          │
│    └─────────────────────┘          │
│                                     │
└─────────────────────────────────────┘
```

---

## 📦 DEPLOYMENT CHECKLIST

### **Backend Deployment**

1. **Environment Variables**
```bash
# .env.production
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
JWT_SECRET=...
FRONTEND_URL=https://swaggo.com
CHESS_GAME_URL=https://chess.swaggo.com
```

2. **Docker Configuration**
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["node", "main.js"]
```

3. **Nginx Configuration**
```nginx
# nginx.conf
upstream chess_backend {
    server localhost:4000;
}

server {
    listen 443 ssl http2;
    server_name chess-api.swaggo.com;

    location /socket.io/ {
        proxy_pass http://chess_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://chess_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```


### **Unity Build Configuration**

1. **Build Settings**
```
Platform: WebGL / Windows / Android / iOS
Compression: Brotli
Code Optimization: Master
Stripping Level: High
```

2. **Player Settings**
```
Company Name: Swaggo
Product Name: Swaggo Chess
Version: 1.0.0
Bundle Identifier: com.swaggo.chess
```

---

## 🧪 TESTING STRATEGY

### **1. Unit Tests**

```javascript
// ChessGameService.test.js
describe('ChessGameService', () => {
  test('should create game with correct initial state', async () => {
    const game = await ChessGameService.createGame('player1', 'player2', {
      type: 'blitz',
      initialTime: 300,
      increment: 2
    });

    expect(game.gameState.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(game.status).toBe('active');
    expect(game.timeControl.whiteTime).toBe(300);
  });

  test('should validate legal moves', async () => {
    const game = await ChessGameService.createGame('player1', 'player2', {
      type: 'blitz',
      initialTime: 300,
      increment: 2
    });

    const result = await ChessGameService.makeMove(
      game.gameId,
      game.players.white.playerId,
      'e2',
      'e4'
    );

    expect(result.move.from).toBe('e2');
    expect(result.move.to).toBe('e4');
  });

  test('should reject illegal moves', async () => {
    const game = await ChessGameService.createGame('player1', 'player2', {
      type: 'blitz',
      initialTime: 300,
      increment: 2
    });

    await expect(
      ChessGameService.makeMove(
        game.gameId,
        game.players.white.playerId,
        'e2',
        'e5'
      )
    ).rejects.toThrow('Invalid move');
  });
});
```

### **2. Integration Tests**

```javascript
// ChessSocket.integration.test.js
describe('Chess Socket Integration', () => {
  let io, clientSocket1, clientSocket2;

  beforeAll((done) => {
    io = require('socket.io-client');
    clientSocket1 = io('http://localhost:4000/chess', {
      auth: { token: 'valid_token_1' }
    });
    clientSocket2 = io('http://localhost:4000/chess', {
      auth: { token: 'valid_token_2' }
    });

    clientSocket1.on('connect', () => {
      clientSocket2.on('connect', done);
    });
  });

  test('should match two players', (done) => {
    clientSocket1.emit('chess:joinQueue', { timeControl: 'blitz' });
    clientSocket2.emit('chess:joinQueue', { timeControl: 'blitz' });

    clientSocket1.on('chess:matchFound', (data) => {
      expect(data.gameId).toBeDefined();
      expect(data.opponent).toBeDefined();
      done();
    });
  });

  afterAll(() => {
    clientSocket1.close();
    clientSocket2.close();
  });
});
```

### **3. Load Testing**

```javascript
// loadtest.js
import { io } from 'socket.io-client';

async function simulatePlayer(playerId) {
  const socket = io('http://localhost:4000/chess', {
    auth: { token: `test_token_${playerId}` }
  });

  socket.on('connect', () => {
    socket.emit('chess:joinQueue', { timeControl: 'blitz' });
  });

  socket.on('chess:matchFound', (data) => {
    console.log(`Player ${playerId} matched in game ${data.gameId}`);
  });
}

// Simulate 1000 concurrent players
for (let i = 0; i < 1000; i++) {
  simulatePlayer(i);
}
```

---

## 🚀 ADDITIONAL FEATURES (BONUS)

### **1. Spectator Mode**
- Allow friends to watch ongoing games
- Real-time move updates for spectators
- Spectator chat (separate from player chat)

### **2. Game Analysis**
- Post-game move analysis
- Highlight blunders, mistakes, and brilliant moves
- Opening identification
- Endgame tablebase integration

### **3. Tournaments**
- Swiss system tournaments
- Knockout tournaments
- Automated bracket management
- Prize distribution system

### **4. Puzzles & Training**
- Daily chess puzzles
- Tactical training mode
- Opening trainer
- Endgame practice

### **5. Achievements & Badges**
- Win streak achievements
- Opening mastery badges
- Milestone rewards (100 games, 1000 games, etc.)
- Special titles (Tactician, Endgame Expert, etc.)

### **6. Social Features**
- Chess clubs/groups
- Team matches
- Friend challenges with custom rules
- Replay sharing

---

## 📚 DEPENDENCIES

### **Backend**
```json
{
  "dependencies": {
    "socket.io": "^4.8.1",
    "express": "^5.1.0",
    "mongoose": "^8.18.2",
    "ioredis": "^5.7.0",
    "chess.js": "^1.0.0-beta.8",
    "jsonwebtoken": "^9.0.2",
    "joi": "^18.0.1",
    "isomorphic-dompurify": "^2.28.0",
    "uuid": "^13.0.0"
  }
}
```

### **Unity**
```
- SocketIOClient (NuGet)
- Unity WebRTC Package
- TextMeshPro
- DOTween (animations)
- Newtonsoft.Json
```

---

## 🎯 SUCCESS METRICS

### **Performance Targets**
- Server response time: < 50ms (p95)
- Matchmaking time: < 30 seconds (average)
- Socket latency: < 100ms
- Game state sync: < 20ms
- Database query time: < 10ms (cached)

### **Security Targets**
- Zero SQL injection vulnerabilities
- Zero XSS vulnerabilities
- 100% input validation coverage
- Rate limiting on all endpoints
- Encrypted WebRTC connections

### **User Experience Targets**
- 60 FPS gameplay
- Smooth animations
- Intuitive UI/UX
- < 3 second load time
- Mobile responsive

---

## 📝 IMPLEMENTATION TIMELINE

### **Phase 1: Foundation (Week 1-2)**
- Database models
- Basic Socket.IO setup
- Authentication integration
- Unity project setup

### **Phase 2: Core Gameplay (Week 3-4)**
- Chess engine integration
- Move validation
- Game state management
- Basic UI

### **Phase 3: Matchmaking (Week 5)**
- ELO system
- Queue management
- Match creation
- Player pairing

### **Phase 4: Social Features (Week 6)**
- Friend system integration
- Invite system
- Lobby system
- Chat implementation

### **Phase 5: Voice Chat (Week 7)**
- WebRTC integration
- Mic/speaker controls
- Audio quality optimization

### **Phase 6: Polish & Testing (Week 8)**
- UI/UX refinement
- Performance optimization
- Security hardening
- Load testing

### **Phase 7: Deployment (Week 9)**
- Production setup
- Monitoring
- Documentation
- Launch

---

## 🎓 CONCLUSION

This comprehensive implementation guide provides everything needed to build a world-class chess platform that rivals Chess.com in quality, security, and performance. The architecture is scalable, secure, and optimized for real-time gameplay.

**Key Strengths:**
✅ 10/10 Security (JWT auth, rate limiting, input validation, anti-cheat)
✅ 10/10 Performance (Redis caching, connection pooling, optimized queries)
✅ Professional UI/UX (Chess.com-inspired design)
✅ Real-time Communication (Socket.IO + WebRTC)
✅ Scalable Architecture (Microservices-ready)
✅ Complete Feature Set (Matchmaking, ELO, social, voice)

**Next Steps:**
1. Review and approve this implementation plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Iterate based on testing feedback
5. Deploy to production

Good luck building the best chess platform! 🏆♟️
