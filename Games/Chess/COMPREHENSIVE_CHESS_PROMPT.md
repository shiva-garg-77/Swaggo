# 🏆 WORLD-CLASS CHESS GAME - COMPREHENSIVE AI PROMPT

## 📋 PROJECT OVERVIEW

Build a **production-ready, enterprise-grade chess game** for the Swaggo platform with:
- **Frontend**: Unity-based game client with professional UI/UX
- **Backend**: Node.js/Express with Socket.IO for real-time multiplayer
- **Website Integration**: Next.js routes showing games list and chess entry point
- **Security**: 10/10 enterprise-grade security implementation
- **Performance**: Optimized for 100,000+ concurrent users
- **Features**: Matching chess.com quality with unique innovations

---

## 🎯 CORE REQUIREMENTS

### 1. **ARCHITECTURE**

```
Swaggo/
├── games/
│   └── Chess/
│       ├── Backend/           # Node.js + Socket.IO + Chess Logic
│       │   ├── server.js      # Main server entry
│       │   ├── config/        # Configuration
│       │   ├── controllers/   # Game controllers
│       │   ├── services/      # Business logic
│       │   │   ├── ChessEngine.js
│       │   │   ├── MatchmakingService.js
│       │   │   ├── RankingService.js
│       │   │   ├── VoiceChatService.js
│       │   │   └── FriendshipService.js
│       │   ├── models/        # MongoDB models
│       │   │   ├── ChessGame.js
│       │   │   ├── ChessPlayer.js
│       │   │   ├── ChessMatch.js
│       │   │   └── ChessFriendRequest.js
│       │   ├── middleware/    # Auth, rate limiting
│       │   ├── routes/        # API routes
│       │   └── utils/         # Helper functions
│       │
│       ├── Frontend/          # Unity WebGL Build
│       │   ├── Build/         # Compiled Unity game
│       │   ├── Assets/        # Unity project assets
│       │   ├── Scripts/       # C# game scripts
│       │   │   ├── Core/
│       │   │   ├── UI/
│       │   │   ├── Networking/
│       │   │   └── Audio/
│       │   └── UnityProject/  # Unity project files
│       │
│       └── Docs/
│           ├── API.md
│           ├── ARCHITECTURE.md
│           └── DEPLOYMENT.md
│
└── Website/
    └── Frontend/
        └── app/
            └── games/
                ├── page.jsx          # Games list page
                └── chess/
                    └── page.jsx      # Chess game launcher
```

### 2. **TECHNOLOGY STACK**

#### Backend:
- **Runtime**: Node.js v18+
- **Framework**: Express 5.x (already in use)
- **Real-time**: Socket.IO 4.8+ (already in use)
- **Database**: MongoDB with Mongoose (already in use)
- **Cache**: Redis (already in use)
- **Chess Engine**: chess.js + stockfish.js
- **Voice/Audio**: WebRTC + simple-peer
- **Authentication**: JWT (integrate with existing Swaggo auth)
- **Rate Limiting**: Express-rate-limit + Redis (already in use)
- **Security**: Helmet, CORS, XSS protection (already in use)

#### Frontend (Unity):
- **Engine**: Unity 2021.3 LTS or newer
- **Build Target**: WebGL
- **UI Framework**: Unity UI (Canvas) + TextMeshPro
- **Networking**: Socket.IO Unity Client
- **Voice**: Unity WebRTC plugin
- **State Management**: Unity Events + Reactive patterns

#### Website Integration (Next.js):
- **Framework**: Next.js 15.5+ (already in use)
- **Styling**: Tailwind CSS (already in use)
- **Components**: React 19+ (already in use)
- **API**: GraphQL + REST (already in use)

---

## 🎮 FEATURE SPECIFICATIONS

### **A. USER FLOWS**

#### 1. **Splash Screen** (Unity)
- Beautiful animated chess pieces
- Loading progress bar
- "Swaggo Chess" branding
- Version number
- Duration: 2-3 seconds

#### 2. **Intro/Welcome Page** (Unity)
- Options: "Play Now", "Tutorial", "Settings", "Leaderboard"
- Display user profile (name, avatar, rating)
- Show online friends count
- Daily challenges banner

#### 3. **Game Modes Selection**
- **Quick Match**: Auto-matchmaking by rating
- **Ranked Match**: Competitive play with ELO
- **Play with Friend**: Send/accept friend requests
- **Custom Game**: Create private lobby with code
- **AI Practice**: Play against Stockfish AI (multiple difficulties)
- **Daily Puzzle**: Chess puzzles for rewards

#### 4. **Matchmaking System**

##### **4a. Quick Match Flow**:
```
User clicks "Quick Match" 
→ Enter matchmaking queue with rating range (±100 ELO)
→ Show "Searching for opponent..." with timer
→ Match found within 30 seconds (expand range if needed)
→ Load game with opponent profile preview
→ 5-second countdown → Game starts
```

##### **4b. Friend Match Flow**:
```
Option 1: Recent Players
- Show last 10 players user matched with
- Click "Invite" → Send request
- If both follow each other on website → Request sent
- If not following → Show "Follow them first on Swaggo"

Option 2: Friend Request from Website
- User follows friend on Swaggo website
- Friend follows back
- Now both can send game requests
- Click "Invite Friend" in chess game
- Shows list of mutual followers
- Select friend → Send request
- Friend receives notification in-game and on website
- Accept: Join lobby
- Reject: Send rejection notification
- Block for 5 min: Temporary cooldown
- Block permanently: Add to blocklist
```

##### **4c. Request System**:
- **Rate Limiting**: Max 10 requests per hour
- **Cooldown**: 5 min between requests to same user
- **Notification Types**:
  - In-game toast notification
  - Website notification badge
  - Optional: Email/push (future)
- **Request Expiration**: 2 minutes, then auto-reject

#### 5. **Lobby System**
```
Lobby Screen Shows:
├── Host player info (left)
├── Guest player info (right) or "Waiting..."
├── Game settings (time control, color selection)
├── Chat box (text messages)
├── Voice chat toggle (mic on/off, speaker on/off)
├── Ready button
└── Leave lobby button
```

**Features**:
- Real-time chat with profanity filter
- Voice chat with toggle controls (like Free Fire)
- Host can set time controls (3+0, 5+0, 10+0, 15+10, etc.)
- Host can choose colors or random
- Both players must click "Ready"
- 60-second AFK timeout

#### 6. **Main Game Interface**

```
Game Screen Layout:
├── Top Bar
│   ├── Opponent Info (avatar, name, rating)
│   ├── Opponent Timer
│   └── Captured pieces (black)
├── Chess Board (center, 90% of screen)
│   ├── 8x8 board with coordinates
│   ├── Piece animations
│   ├── Move highlights
│   ├── Last move indicator
│   └── Possible moves dots
├── Bottom Bar
│   ├── Player Info (avatar, name, rating)
│   ├── Player Timer
│   └── Captured pieces (white)
├── Right Sidebar (collapsible)
│   ├── Move list (algebraic notation)
│   ├── Chat messages
│   ├── Voice controls
│   │   ├── Mic toggle (with indicator)
│   │   └── Speaker toggle (with indicator)
│   ├── Offer Draw button
│   ├── Resign button
│   └── Request Rematch (after game)
└── Settings Menu (gear icon)
    ├── Board theme
    ├── Piece set
    ├── Sound volume
    ├── Voice volume
    └── Report player
```

**Game Features**:
- **Legal Moves**: Only legal moves allowed
- **Highlights**: Show possible moves on piece selection
- **Animations**: Smooth piece movement
- **Sound Effects**: Move, capture, check, checkmate
- **Timer**: Increment-based time control
- **Chat**: Real-time in-game chat
- **Voice**: WebRTC peer-to-peer voice chat
- **Controls**:
  - Mic toggle: Mute/unmute your mic
  - Speaker toggle: Mute/unmute opponent's voice
  - Both stored per user preference

#### 7. **End Game Flow**

```
Game Ends (Checkmate/Stalemate/Draw/Timeout/Resignation)
→ Show result overlay with animation
  ├── "You Won!" / "You Lost" / "Draw"
  ├── Rating change (+15 / -15 ELO)
  ├── Match statistics
  │   ├── Accuracy score
  │   ├── Best move
  │   ├── Blunders count
  │   └── Game duration
  ├── Add Friend button (if not friends)
  │   → Following on website required
  │   → Sends follow request on Swaggo
  ├── Rematch button
  │   → Sends rematch request to opponent
  │   → 30-second expiration
  ├── Analyze Game button (future feature)
  └── Back to Menu button
```

---

### **B. VOICE & AUDIO SYSTEM**

#### **Voice Chat Implementation**:
```javascript
// WebRTC P2P connection
Features:
- Direct peer-to-peer connection via Socket.IO signaling
- Echo cancellation & noise suppression enabled
- Bitrate: 32kbps (optimized for voice)
- Latency: <150ms
- Auto-reconnect on connection drop
- Individual mic/speaker controls
- Visual indicators (mic active, talking animation)

Controls:
1. Mic Toggle:
   - Mutes YOUR microphone
   - Visual indicator on button
   - Persists across games (saved to user settings)

2. Speaker Toggle:
   - Mutes OPPONENT's voice
   - Does not affect opponent's mic
   - Independent control
   - Persists per opponent (remembers previous mute state)

Security:
- No voice recording or storage
- P2P only (no server relay unless required for NAT)
- DTLS encryption for WebRTC streams
- Voice abuse reporting triggers investigation
```

#### **Sound Effects**:
- **Move sounds**: Piece movement, captures
- **Check/Checkmate**: Distinctive audio cues
- **Timer warning**: 10-second countdown beep
- **Chat notification**: Subtle ping
- **Victory/Defeat music**: Short jingles

---

### **C. MATCHMAKING & RANKING SYSTEM**

#### **ELO Rating System** (Chess.com style):
```javascript
Initial Rating: 1200
Rating Range: 0 - 3000+

K-Factor (determines rating change):
- New players (<30 games): K = 40
- Intermediate (30-100 games): K = 32
- Experienced (>100 games): K = 24

Rating Calculation:
Expected Score (E) = 1 / (1 + 10^((OpponentRating - YourRating) / 400))
New Rating = Old Rating + K * (Actual Score - Expected Score)

Where:
- Actual Score: 1 (win), 0.5 (draw), 0 (loss)

Matchmaking:
1. Find opponent within ±100 ELO (0-15 sec)
2. Expand to ±200 ELO (15-30 sec)
3. Expand to ±300 ELO (30-60 sec)
4. Match with anyone available (>60 sec)
```

#### **Ranking Tiers**:
```
Beginner: 0-999
Novice: 1000-1199
Intermediate: 1200-1399
Advanced: 1400-1599
Expert: 1600-1799
Master: 1800-1999
Grandmaster: 2000-2199
Super Grandmaster: 2200+
```

#### **Leaderboard**:
- Global Top 100
- Friends leaderboard
- Country/region leaderboard (optional)
- Daily/Weekly/All-time rankings
- Visible on website and in-game

---

### **D. FRIENDSHIP & SOCIAL FEATURES**

#### **Friend System Integration**:

**Core Principle**: All social connections happen through Swaggo website

```javascript
Friend Request Flow:
1. In-Game Scenario:
   - User finishes match with opponent
   - Clicks "Add Friend" button
   - Check: Do they follow each other on Swaggo?
     → YES: Send game invitation directly
     → NO: Show modal "Follow [username] on Swaggo to play together"
         → Button: "Go to Profile" (opens website in new tab)
         → User follows on website
         → Friend follows back
         → Now can send game requests

2. Website Scenario:
   - Users follow each other on Swaggo
   - Both are mutual followers
   - Now they can:
     → Send chess game requests
     → See each other in "Friends" list in chess game
     → Receive game invitations

3. Recent Players:
   - Shows last 10 opponents
   - Can send requests if mutual followers
   - Otherwise shows "Follow on Swaggo first"
```

#### **Request Management**:
```javascript
Request Types:
1. Game Invitation
   - Sender: Sends request to friend
   - Receiver: Gets notification (in-game + website)
   - Actions: Accept, Reject, Block 5 min, Block permanently
   - Expiration: 2 minutes

2. Rematch Request
   - After game ends
   - Simpler flow: Accept or Reject
   - Expiration: 30 seconds

Rate Limiting:
- Max 10 requests per hour per user
- Max 3 requests to same user per day
- 5-minute cooldown after rejection
- Permanent block: Persistent across sessions

Notifications:
- In-game toast: "John123 invited you to play!"
- Website notification: Red badge on chess game icon
- Sound: Notification ping (if enabled)
```

#### **Block System**:
```javascript
Block Types:
1. Temporary Block (5 min):
   - User cannot send requests for 5 minutes
   - Automatically expires
   - Used for "busy" or "not now" situations

2. Permanent Block:
   - User added to blocklist
   - Cannot send requests ever
   - Stored in database
   - User can unblock from settings
   - Used for harassment/spam prevention

Implementation:
- Blocklist stored in MongoDB
- Checked before sending requests
- Blocked users don't see each other in "Recent Players"
```

---

### **E. CHAT SYSTEM**

#### **Text Chat**:
```javascript
Features:
- Real-time messaging via Socket.IO
- Profanity filter (bad words censored)
- Max message length: 200 characters
- Rate limit: 10 messages per minute
- Emoji support (optional)
- Chat history: Last 50 messages per game

Security:
- XSS sanitization (DOMPurify)
- HTML entity encoding
- No external links allowed
- Report abusive messages

UI:
- Chat box in right sidebar
- Collapsible/expandable
- Typing indicator: "Opponent is typing..."
- Message timestamps
```

---

### **F. SECURITY IMPLEMENTATION (10/10)**

#### **Authentication**:
```javascript
Integration with Swaggo Auth:
- Use existing JWT authentication from main website
- Verify tokens with TokenService from Backend
- Share user session across website and game
- Cross-origin authentication via secure cookies

Token Flow:
1. User logs in on Swaggo website
2. JWT token stored in httpOnly secure cookie
3. User navigates to /games/chess
4. Next.js page embeds Unity WebGL build
5. Unity requests token from backend
6. Backend validates token with existing AuthenticationMiddleware
7. Socket.IO connection authenticated with token
8. All game actions require valid authenticated session
```

#### **Rate Limiting**:
```javascript
Endpoints:
- Matchmaking: 10 requests/min per user
- Game invitations: 10 requests/hour per user
- Chat messages: 10 messages/min per user
- Voice connections: 3 connections/min per user
- Move validation: 30 moves/min per game (anti-cheat)

Implementation:
- Redis-backed rate limiter (already in use)
- Per-user and per-IP tracking
- Exponential backoff on violations
- 24-hour ban after repeated violations
```

#### **Anti-Cheat**:
```javascript
Measures:
1. Move Validation:
   - All moves validated server-side
   - Chess.js library for legal move checking
   - Client moves are requests, not commands

2. Time Enforcement:
   - Server controls all timers
   - Client timers are visual only
   - Timeout enforced server-side

3. Engine Detection:
   - Move timing analysis
   - Accuracy tracking (>95% = suspicious)
   - Centipawn loss analysis
   - Flagging system for review

4. Duplicate Account Prevention:
   - IP tracking
   - Device fingerprinting
   - Email verification required
   - Phone verification for ranked (optional)
```

#### **Data Protection**:
```javascript
Encryption:
- HTTPS/WSS only (TLS 1.3)
- Database encryption at rest
- WebRTC DTLS encryption for voice
- JWT tokens with secure signing

Privacy:
- No storage of voice data
- Chat logs anonymized after 30 days
- GDPR compliance (data export/deletion)
- User consent for analytics

Injection Prevention:
- MongoDB sanitization (already in use)
- XSS protection (DOMPurify)
- CSRF tokens for state-changing actions
- Input validation with Joi (already in use)
```

---

### **G. PERFORMANCE OPTIMIZATION**

#### **Backend Optimization**:
```javascript
Scalability:
- Horizontal scaling with Redis pub/sub
- Socket.IO sticky sessions with Redis adapter
- Database indexing on:
  - userId, gameId, matchId, rating
- Connection pooling (MongoDB)
- Query optimization with Mongoose lean()
- Caching with Redis:
  - User profiles (5 min TTL)
  - Leaderboards (1 min TTL)
  - Active games list (10 sec TTL)

Load Balancing:
- nginx reverse proxy
- Multiple Node.js instances
- Socket.IO Redis adapter for multi-server support
- Database read replicas

Monitoring:
- Winston logging (already in use)
- Performance metrics (response time, latency)
- Error tracking with Sentry
- Health check endpoints
```

#### **Frontend (Unity) Optimization**:
```javascript
Build Optimization:
- WebGL build compression (Brotli)
- Code stripping enabled
- Asset bundle compression
- Texture compression (ASTC/DXT)
- Audio compression (Vorbis)

Runtime Optimization:
- Object pooling for chess pieces
- Coroutines for animations
- Async/await for network calls
- UI Canvas optimization
- Minimal garbage collection
- 60 FPS target

Network Optimization:
- Binary protocol for moves (chess.js)
- Delta compression for game state
- Batch messages when possible
- Reconnection logic with exponential backoff
- Offline mode with local validation
```

---

### **H. WEBSITE INTEGRATION**

#### **Games List Page** (`/games/page.jsx`):
```jsx
Design Spec:
- Hero section: "Swaggo Games"
- Grid of game cards:
  - Each card: Game thumbnail, title, player count, "Play" button
  - Chess card highlighted prominently
- Featured games carousel
- Recent activity feed
- User balance display (if applicable)

Implementation:
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Games data
const games = [
  {
    id: 'chess',
    title: 'Chess',
    thumbnail: '/images/games/chess-thumbnail.jpg',
    players: '12,483 online',
    description: 'Strategic chess with ranking system',
    path: '/games/chess'
  },
  // Other games...
];

// Component with professional design
```

#### **Chess Game Page** (`/games/chess/page.jsx`):
```jsx
Design Spec:
- Full-screen Unity WebGL embed
- Loading screen with progress bar
- Responsive layout (desktop + mobile)
- Fallback for unsupported browsers
- Error boundary for crashes

Implementation:
'use client';
import { useEffect, useRef, useState } from 'react';
import { UnityContext } from 'react-unity-webgl';

// Unity WebGL integration
// Pass authentication token to Unity
// Handle Unity-to-React communication
// Graceful error handling
```

---

## 🚀 IMPLEMENTATION PLAN

### **Phase 1: Backend Foundation** (Week 1-2)

#### Tasks:
1. **Project Setup**
   - Create Chess/Backend folder structure
   - Install dependencies (chess.js, stockfish.js, simple-peer)
   - Configure environment variables
   - Setup MongoDB models

2. **Core Services**
   - ChessEngine.js (move validation, game state)
   - MatchmakingService.js (queue system, rating-based matching)
   - RankingService.js (ELO calculation, leaderboards)
   - VoiceChatService.js (WebRTC signaling)
   - FriendshipService.js (friend requests, blocklist)

3. **Socket.IO Events**
   ```javascript
   Server Events:
   - connection
   - authenticate
   - join_queue
   - leave_queue
   - match_found
   - move
   - chat_message
   - typing_start/stop
   - voice_offer/answer/candidate
   - mic_toggle
   - speaker_toggle
   - draw_offer/accept/reject
   - resign
   - request_rematch
   - send_friend_request
   - accept/reject_request
   - block_user
   - disconnect
   ```

4. **API Routes**
   - POST /api/v1/chess/matchmaking/join
   - POST /api/v1/chess/matchmaking/leave
   - GET /api/v1/chess/games/:id
   - GET /api/v1/chess/leaderboard
   - GET /api/v1/chess/user/stats
   - POST /api/v1/chess/friends/request
   - POST /api/v1/chess/friends/accept
   - POST /api/v1/chess/friends/block

5. **Security Middleware**
   - Integrate with existing AuthenticationMiddleware
   - Rate limiters for all endpoints
   - Move validation middleware
   - Anti-cheat detection

### **Phase 2: Frontend (Unity)** (Week 3-5)

#### Tasks:
1. **Unity Project Setup**
   - Create new Unity project (2021.3 LTS)
   - Install Socket.IO Unity client
   - Setup WebGL build settings
   - Configure TextMeshPro

2. **UI/UX Design**
   - Splash screen with animations
   - Main menu with navigation
   - Matchmaking queue UI
   - Lobby system UI
   - Game board UI (responsive)
   - End game overlay
   - Settings panel
   - Leaderboard UI

3. **Core Game Logic**
   - ChessBoardController.cs (board representation)
   - PieceController.cs (piece movement, animations)
   - MoveValidator.cs (client-side pre-validation)
   - GameStateManager.cs (game state sync)
   - TimerController.cs (visual timer display)

4. **Networking**
   - SocketManager.cs (Socket.IO connection)
   - AuthManager.cs (JWT token management)
   - MatchmakingManager.cs (queue handling)
   - VoiceChatManager.cs (WebRTC integration)
   - ChatManager.cs (text chat UI + logic)

5. **Audio**
   - AudioManager.cs (SFX + music)
   - VoiceController.cs (mic/speaker controls)
   - Sound effects library (move, capture, check, etc.)

6. **Polish**
   - Piece animations (smooth movement)
   - Board themes (3+ themes)
   - Particle effects (captures, checkmate)
   - Transition animations
   - Haptic feedback (mobile)

### **Phase 3: Website Integration** (Week 6)

#### Tasks:
1. **Games List Page**
   - Create /games/page.jsx
   - Design game cards grid
   - Implement navigation
   - Add animations (Framer Motion)

2. **Chess Game Page**
   - Create /games/chess/page.jsx
   - Embed Unity WebGL build
   - Implement loading screen
   - Handle authentication token passing
   - Add error boundaries

3. **Integration Testing**
   - Test auth flow (website → Unity)
   - Test navigation (games list → chess → back)
   - Test cross-tab communication
   - Test responsive design

### **Phase 4: Testing & QA** (Week 7)

#### Tasks:
1. **Unit Tests**
   - Backend: Chess engine, matchmaking, ELO calculation
   - Frontend: Move validation, UI components

2. **Integration Tests**
   - Full game flow (matchmaking → game → end)
   - Friend request flow
   - Voice chat connectivity
   - Chat system

3. **Load Testing**
   - 1,000 concurrent connections
   - 10,000 concurrent connections
   - 100,000 concurrent connections (target)
   - Database query performance

4. **Security Testing**
   - Penetration testing
   - Anti-cheat validation
   - Rate limiter effectiveness
   - XSS/CSRF prevention

5. **Browser Testing**
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers (iOS Safari, Chrome Android)
   - Different screen sizes

### **Phase 5: Deployment & Monitoring** (Week 8)

#### Tasks:
1. **Production Setup**
   - Configure production environment
   - Setup Redis cluster
   - Configure nginx load balancer
   - SSL/TLS certificates

2. **CI/CD Pipeline**
   - Automated tests on push
   - Build Unity WebGL
   - Deploy backend to production
   - Deploy frontend build

3. **Monitoring**
   - Setup Grafana dashboards
   - Configure alerts (Slack/Email)
   - Error tracking (Sentry)
   - Performance monitoring (New Relic)

4. **Launch**
   - Soft launch (beta testers)
   - Collect feedback
   - Fix critical bugs
   - Public launch

---

## 📚 DETAILED TECHNICAL SPECIFICATIONS

### **A. Database Schemas**

#### **ChessGame Model**:
```javascript
{
  _id: ObjectId,
  gameId: String (unique, indexed),
  players: {
    white: {
      userId: String (ref: User),
      username: String,
      rating: Number,
      avatar: String
    },
    black: {
      userId: String (ref: User),
      username: String,
      rating: Number,
      avatar: String
    }
  },
  timeControl: {
    initial: Number, // seconds
    increment: Number // seconds
  },
  status: String, // 'active', 'finished', 'abandoned'
  result: String, // 'white_win', 'black_win', 'draw', 'abandoned'
  resultReason: String, // 'checkmate', 'resignation', 'timeout', 'agreement', 'stalemate'
  moves: [{
    moveNumber: Number,
    notation: String, // algebraic notation
    fen: String, // board state after move
    timestamp: Date,
    timeRemaining: {
      white: Number,
      black: Number
    }
  }],
  chat: [{
    userId: String,
    username: String,
    message: String,
    timestamp: Date
  }],
  startedAt: Date,
  finishedAt: Date,
  ratingChange: {
    white: Number,
    black: Number
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
gameId: unique
players.white.userId: indexed
players.black.userId: indexed
status: indexed
startedAt: indexed (for recent games)
```

#### **ChessPlayer Model**:
```javascript
{
  _id: ObjectId,
  userId: String (ref: User, unique, indexed),
  username: String,
  stats: {
    rating: Number (default: 1200),
    gamesPlayed: Number (default: 0),
    wins: Number (default: 0),
    losses: Number (default: 0),
    draws: Number (default: 0),
    winRate: Number (calculated),
    averageAccuracy: Number,
    highestRating: Number,
    lowestRating: Number
  },
  achievements: [{
    achievementId: String,
    unlockedAt: Date
  }],
  settings: {
    boardTheme: String (default: 'classic'),
    pieceSet: String (default: 'standard'),
    soundEnabled: Boolean (default: true),
    soundVolume: Number (default: 0.7),
    voiceEnabled: Boolean (default: true),
    voiceVolume: Number (default: 1.0),
    micEnabled: Boolean (default: true),
    autoQueen: Boolean (default: false)
  },
  ratingHistory: [{
    rating: Number,
    timestamp: Date
  }],
  createdAt: Date,
  updatedAt: Date
}

// Indexes
userId: unique
stats.rating: indexed (for leaderboard)
```

#### **ChessFriendRequest Model**:
```javascript
{
  _id: ObjectId,
  requestId: String (unique, indexed),
  senderId: String (ref: User, indexed),
  receiverId: String (ref: User, indexed),
  type: String, // 'game_invite', 'rematch'
  status: String, // 'pending', 'accepted', 'rejected', 'expired'
  gameSettings: {
    timeControl: {
      initial: Number,
      increment: Number
    },
    color: String // 'white', 'black', 'random'
  },
  expiresAt: Date,
  respondedAt: Date,
  createdAt: Date
}

// Indexes
requestId: unique
senderId + receiverId: compound index
status + expiresAt: compound index (for cleanup)
```

#### **ChessBlocklist Model**:
```javascript
{
  _id: ObjectId,
  userId: String (ref: User, indexed),
  blockedUserId: String (ref: User, indexed),
  blockType: String, // 'temporary', 'permanent'
  expiresAt: Date (null for permanent),
  reason: String,
  createdAt: Date
}

// Indexes
userId + blockedUserId: compound unique index
expiresAt: indexed (for expiration cleanup)
```

---

### **B. Socket.IO Event Specifications**

#### **Client → Server Events**:

```javascript
// Authentication
socket.emit('authenticate', { token: JWT_TOKEN })

// Matchmaking
socket.emit('join_queue', { 
  timeControl: { initial: 300, increment: 0 }, 
  ratingRange: 100 
})
socket.emit('leave_queue')

// Game Actions
socket.emit('move', { 
  gameId: String, 
  from: String, // e.g., 'e2'
  to: String,   // e.g., 'e4'
  promotion: String // 'q', 'r', 'b', 'n' (optional)
})
socket.emit('resign', { gameId: String })
socket.emit('offer_draw', { gameId: String })
socket.emit('accept_draw', { gameId: String })
socket.emit('reject_draw', { gameId: String })
socket.emit('request_rematch', { gameId: String })
socket.emit('accept_rematch', { gameId: String })
socket.emit('reject_rematch', { gameId: String })

// Chat
socket.emit('chat_message', { gameId: String, message: String })
socket.emit('typing_start', { gameId: String })
socket.emit('typing_stop', { gameId: String })

// Voice
socket.emit('voice_offer', { gameId: String, offer: RTCSessionDescription })
socket.emit('voice_answer', { gameId: String, answer: RTCSessionDescription })
socket.emit('voice_candidate', { gameId: String, candidate: RTCIceCandidate })
socket.emit('mic_toggle', { gameId: String, enabled: Boolean })

// Friends
socket.emit('send_friend_request', { receiverId: String, gameSettings: Object })
socket.emit('accept_friend_request', { requestId: String })
socket.emit('reject_friend_request', { requestId: String })
socket.emit('block_user', { userId: String, blockType: String, duration: Number })

// Lobby
socket.emit('join_lobby', { lobbyId: String })
socket.emit('leave_lobby', { lobbyId: String })
socket.emit('lobby_ready', { lobbyId: String })
socket.emit('lobby_chat', { lobbyId: String, message: String })
```

#### **Server → Client Events**:

```javascript
// Authentication
socket.on('authenticated', { success: Boolean, user: Object })
socket.on('auth_error', { error: String })

// Matchmaking
socket.on('queue_joined', { position: Number, estimatedWait: Number })
socket.on('match_found', { 
  gameId: String, 
  opponent: Object, 
  color: String, 
  timeControl: Object 
})
socket.on('match_cancelled', { reason: String })

// Game State
socket.on('game_started', { 
  gameId: String, 
  fen: String, 
  players: Object, 
  timeControl: Object 
})
socket.on('move_made', { 
  gameId: String, 
  move: Object, 
  fen: String, 
  timeRemaining: Object 
})
socket.on('move_invalid', { reason: String })
socket.on('game_over', { 
  gameId: String, 
  result: String, 
  reason: String, 
  ratingChange: Object,
  stats: Object
})
socket.on('opponent_disconnected', { gameId: String })
socket.on('opponent_reconnected', { gameId: String })

// Draw Offers
socket.on('draw_offered', { gameId: String, offeredBy: String })
socket.on('draw_accepted', { gameId: String })
socket.on('draw_rejected', { gameId: String })

// Rematch
socket.on('rematch_requested', { gameId: String, requestedBy: String })
socket.on('rematch_accepted', { newGameId: String })
socket.on('rematch_rejected', { gameId: String })

// Chat
socket.on('chat_message', { 
  gameId: String, 
  userId: String, 
  username: String, 
  message: String, 
  timestamp: Date 
})
socket.on('typing_indicator', { 
  gameId: String, 
  userId: String, 
  isTyping: Boolean 
})

// Voice
socket.on('voice_offer', { gameId: String, offer: RTCSessionDescription })
socket.on('voice_answer', { gameId: String, answer: RTCSessionDescription })
socket.on('voice_candidate', { gameId: String, candidate: RTCIceCandidate })
socket.on('mic_toggled', { gameId: String, userId: String, enabled: Boolean })

// Friends
socket.on('friend_request_received', { 
  requestId: String, 
  sender: Object, 
  gameSettings: Object, 
  expiresAt: Date 
})
socket.on('friend_request_accepted', { requestId: String, lobbyId: String })
socket.on('friend_request_rejected', { requestId: String })
socket.on('user_blocked', { userId: String, expiresAt: Date })

// Lobby
socket.on('lobby_joined', { 
  lobbyId: String, 
  host: Object, 
  guest: Object, 
  settings: Object 
})
socket.on('lobby_player_joined', { lobbyId: String, player: Object })
socket.on('lobby_player_left', { lobbyId: String, playerId: String })
socket.on('lobby_ready_changed', { lobbyId: String, playerId: String, ready: Boolean })
socket.on('lobby_settings_changed', { lobbyId: String, settings: Object })
socket.on('lobby_chat_message', { 
  lobbyId: String, 
  userId: String, 
  username: String, 
  message: String 
})

// Errors
socket.on('error', { code: String, message: String })
socket.on('rate_limit_exceeded', { retryAfter: Number })
```

---

### **C. Unity-to-Backend Communication**

#### **Unity C# Socket Manager Example**:

```csharp
using System;
using System.Collections.Generic;
using UnityEngine;
using SocketIOClient;
using Newtonsoft.Json;

public class SocketManager : MonoBehaviour
{
    private static SocketManager _instance;
    public static SocketManager Instance => _instance;

    private SocketIOUnity socket;
    private string serverUrl = "wss://api.swaggo.com"; // Production
    private string jwtToken;

    void Awake()
    {
        if (_instance != null && _instance != this)
        {
            Destroy(gameObject);
            return;
        }
        _instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public void Initialize(string token)
    {
        jwtToken = token;
        
        var uri = new Uri(serverUrl);
        socket = new SocketIOUnity(uri, new SocketIOOptions
        {
            Transport = SocketIOClient.Transport.TransportProtocol.WebSocket,
            Auth = new Dictionary<string, string> { { "token", jwtToken } }
        });

        RegisterEvents();
        socket.Connect();
    }

    private void RegisterEvents()
    {
        // Connection events
        socket.OnConnected += OnConnected;
        socket.OnDisconnected += OnDisconnected;
        socket.OnError += OnError;

        // Game events
        socket.On("authenticated", OnAuthenticated);
        socket.On("match_found", OnMatchFound);
        socket.On("game_started", OnGameStarted);
        socket.On("move_made", OnMoveMade);
        socket.On("game_over", OnGameOver);
        socket.On("chat_message", OnChatMessage);
        socket.On("voice_offer", OnVoiceOffer);
        socket.On("voice_answer", OnVoiceAnswer);
        socket.On("voice_candidate", OnVoiceCandidate);
        socket.On("friend_request_received", OnFriendRequestReceived);
        // ... more events
    }

    private void OnConnected(object sender, EventArgs e)
    {
        Debug.Log("Socket connected!");
        socket.Emit("authenticate", new { token = jwtToken });
    }

    private void OnAuthenticated(SocketIOResponse response)
    {
        var data = response.GetValue<AuthResponse>();
        if (data.success)
        {
            Debug.Log($"Authenticated as {data.user.username}");
            // Load main menu
            UIManager.Instance.LoadMainMenu(data.user);
        }
    }

    // Public API for game actions
    public void JoinQueue(int initial, int increment, int ratingRange = 100)
    {
        socket.Emit("join_queue", new
        {
            timeControl = new { initial, increment },
            ratingRange
        });
    }

    public void SendMove(string gameId, string from, string to, string promotion = null)
    {
        socket.Emit("move", new
        {
            gameId,
            from,
            to,
            promotion
        });
    }

    public void SendChatMessage(string gameId, string message)
    {
        socket.Emit("chat_message", new
        {
            gameId,
            message
        });
    }

    // ... more public API methods
}
```

---

## 🎨 UI/UX DESIGN GUIDELINES

### **Design Principles**:
1. **Clarity**: Clear visual hierarchy, easy to understand at a glance
2. **Responsiveness**: Instant feedback for all user actions
3. **Consistency**: Uniform design language across all screens
4. **Accessibility**: High contrast, readable fonts, colorblind modes
5. **Performance**: 60 FPS animations, smooth transitions

### **Color Palette**:
```
Primary: #1E40AF (Blue)
Secondary: #DC2626 (Red)
Success: #059669 (Green)
Warning: #D97706 (Orange)
Background Dark: #0F172A
Background Light: #F8FAFC
Text Primary: #F8FAFC
Text Secondary: #94A3B8
Board Light: #F0D9B5
Board Dark: #B58863
```

### **Typography**:
```
Headings: Inter Bold, 24-48px
Body: Inter Regular, 14-18px
UI Elements: Inter Medium, 12-16px
Timers: Roboto Mono, 18-24px
Move List: Roboto Mono, 12px
```

### **Animations**:
- Piece movement: 0.3s ease-out
- UI transitions: 0.2s ease-in-out
- Button hover: 0.1s ease
- Toast notifications: Slide in from top, 3s duration
- Loading spinner: Continuous rotation

---

## 🔐 SECURITY CHECKLIST

### **Backend Security**:
- [x] JWT authentication with httpOnly cookies
- [x] Rate limiting on all endpoints (Redis-backed)
- [x] Input validation with Joi
- [x] MongoDB query sanitization
- [x] XSS protection with DOMPurify
- [x] CSRF tokens for state-changing actions
- [x] Helmet.js security headers
- [x] CORS with strict origin whitelist
- [x] HTTPS/WSS only (TLS 1.3)
- [x] Environment variables for secrets
- [x] SQL injection prevention (NoSQL context)
- [x] Server-side move validation
- [x] Anti-cheat detection system
- [x] Voice data encryption (DTLS)
- [x] Logging and audit trails

### **Frontend Security**:
- [x] Content Security Policy (CSP)
- [x] Subresource Integrity (SRI) for CDN assets
- [x] No sensitive data in client-side storage
- [x] Token refresh mechanism
- [x] Logout on inactivity timeout
- [x] Error messages without sensitive info
- [x] Input sanitization before sending to server

---

## 📊 PERFORMANCE BENCHMARKS

### **Target Metrics**:
```
Response Time:
- API endpoints: <100ms (p95)
- Socket.IO latency: <50ms (p95)
- Database queries: <20ms (p95)
- WebRTC latency: <150ms (p95)

Throughput:
- Concurrent connections: 100,000+
- Messages per second: 10,000+
- Games per second: 100+

Uptime:
- 99.9% availability (43 minutes downtime/month)
- Zero-downtime deployments
- Auto-scaling on demand

Resource Usage:
- Memory: <512MB per Node.js instance
- CPU: <70% under normal load
- Database: <1000 connections
```

---

## 🧪 TESTING STRATEGY

### **Unit Tests**:
- Backend services (100% coverage target)
- Frontend components (80% coverage target)
- Chess engine logic (100% coverage)
- ELO calculation (100% coverage)

### **Integration Tests**:
- Full game flow (matchmaking → game → end)
- Friend request flow
- Voice chat connectivity
- Database operations

### **E2E Tests**:
- Selenium/Playwright for website
- Unity Test Framework for game
- Multiple browsers/devices

### **Load Tests**:
- Artillery.io for Socket.IO
- k6 for HTTP APIs
- Simulate 100,000 concurrent users

### **Security Tests**:
- OWASP Top 10 checks
- Penetration testing
- Dependency scanning (npm audit)

---

## 📦 DEPLOYMENT ARCHITECTURE

### **Production Setup**:

```
                      Internet
                         |
                   [CloudFlare CDN]
                         |
                    [Load Balancer]
                   (nginx / HAProxy)
                         |
        +----------------+----------------+
        |                                 |
   [Node.js 1]                      [Node.js 2]
   (Socket.IO)                      (Socket.IO)
        |                                 |
        +----------------+----------------+
                         |
                   [Redis Cluster]
                (Pub/Sub + Cache)
                         |
        +----------------+----------------+
        |                                 |
  [MongoDB Primary]              [MongoDB Replica]
                         |
                   [Backup Storage]
                    (S3 / Azure)
```

### **Environment Variables**:
```bash
# Server
PORT=4001
NODE_ENV=production

# Database
MONGODB_URI=mongodb://...
REDIS_URL=redis://...

# Authentication (shared with main Swaggo)
ACCESS_TOKEN_SECRET=***
REFRESH_TOKEN_SECRET=***
JWT_EXPIRES_IN=15m

# Chess Config
MATCHMAKING_TIMEOUT=60000
GAME_TIMEOUT=3600000
RATING_K_FACTOR_NEW=40
RATING_K_FACTOR_INTERMEDIATE=32
RATING_K_FACTOR_EXPERIENCED=24

# WebRTC
ICE_SERVERS=[{"urls":"stun:stun.l.google.com:19302"}]

# Rate Limiting
RATE_LIMIT_MATCHMAKING=10
RATE_LIMIT_CHAT=10
RATE_LIMIT_FRIENDS=10

# Monitoring
SENTRY_DSN=https://...
NEW_RELIC_LICENSE_KEY=***
```

---

## 📝 API DOCUMENTATION

### **REST API Endpoints**:

#### **GET /api/v1/chess/user/profile**
```
Description: Get user's chess profile and stats
Auth: Required (JWT)
Response:
{
  "success": true,
  "data": {
    "userId": "123",
    "username": "john_doe",
    "rating": 1450,
    "gamesPlayed": 245,
    "wins": 120,
    "losses": 95,
    "draws": 30,
    "winRate": 0.49,
    "achievements": [...]
  }
}
```

#### **GET /api/v1/chess/leaderboard**
```
Description: Get top 100 players
Auth: Optional
Query Params:
- type: 'global' | 'friends' | 'country' (default: 'global')
- limit: Number (default: 100, max: 1000)
- offset: Number (default: 0)

Response:
{
  "success": true,
  "data": {
    "players": [
      {
        "rank": 1,
        "username": "chess_master",
        "rating": 2450,
        "gamesPlayed": 1200,
        "winRate": 0.65
      },
      ...
    ],
    "total": 15230,
    "userRank": 1542
  }
}
```

#### **GET /api/v1/chess/games/:gameId**
```
Description: Get game details and move history
Auth: Required (JWT, must be player or spectator)
Response:
{
  "success": true,
  "data": {
    "gameId": "abc123",
    "players": {...},
    "moves": [...],
    "status": "finished",
    "result": "white_win",
    "startedAt": "2025-10-30T10:00:00Z",
    "finishedAt": "2025-10-30T10:45:32Z"
  }
}
```

#### **GET /api/v1/chess/user/recent-players**
```
Description: Get last 10 players user matched with
Auth: Required (JWT)
Response:
{
  "success": true,
  "data": {
    "recentPlayers": [
      {
        "userId": "456",
        "username": "opponent123",
        "rating": 1430,
        "lastPlayedAt": "2025-10-30T09:30:00Z",
        "result": "win",
        "canInvite": true, // Both follow each other
        "isBlocked": false
      },
      ...
    ]
  }
}
```

#### **POST /api/v1/chess/friends/request**
```
Description: Send game invitation to friend
Auth: Required (JWT)
Body:
{
  "receiverId": "456",
  "timeControl": {
    "initial": 300,
    "increment": 0
  },
  "color": "random"
}
Response:
{
  "success": true,
  "data": {
    "requestId": "req_abc123",
    "expiresAt": "2025-10-30T10:05:00Z"
  }
}
```

#### **POST /api/v1/chess/friends/block**
```
Description: Block user from sending requests
Auth: Required (JWT)
Body:
{
  "userId": "789",
  "blockType": "temporary", // or "permanent"
  "duration": 300 // seconds (if temporary)
}
Response:
{
  "success": true,
  "data": {
    "blockedUntil": "2025-10-30T10:10:00Z"
  }
}
```

---

## 🚨 ERROR CODES

```javascript
// Authentication Errors
AUTH_001: "Invalid or expired token"
AUTH_002: "Authentication required"
AUTH_003: "Insufficient permissions"

// Matchmaking Errors
MATCH_001: "Already in queue"
MATCH_002: "Matchmaking timeout"
MATCH_003: "Invalid time control"

// Game Errors
GAME_001: "Game not found"
GAME_002: "Not your turn"
GAME_003: "Illegal move"
GAME_004: "Game already finished"
GAME_005: "Player disconnected"

// Friend Errors
FRIEND_001: "User not found"
FRIEND_002: "Not following each other"
FRIEND_003: "Request expired"
FRIEND_004: "User blocked you"
FRIEND_005: "Rate limit exceeded"

// Voice Errors
VOICE_001: "WebRTC not supported"
VOICE_002: "Connection failed"
VOICE_003: "Peer disconnected"

// General Errors
ERR_001: "Internal server error"
ERR_002: "Invalid input"
ERR_003: "Rate limit exceeded"
ERR_004: "Service unavailable"
```

---

## 🎯 SUCCESS CRITERIA

### **MVP (Minimum Viable Product)**:
- [x] User can matchmake and play chess
- [x] Legal move validation
- [x] Time controls working
- [x] Rating system (ELO)
- [x] Text chat
- [x] Win/loss/draw detection
- [x] Basic UI (playable)

### **Launch Ready**:
- [x] Professional UI/UX design
- [x] Voice chat with controls
- [x] Friend system integrated with website
- [x] Leaderboard
- [x] Multiple board themes
- [x] Sound effects
- [x] Recent players list
- [x] Block system
- [x] Rematch functionality
- [x] Security: 10/10 implementation
- [x] Performance: 100,000 concurrent users
- [x] Mobile responsive
- [x] Load tested
- [x] Documentation complete

### **Post-Launch Features**:
- [ ] AI opponent (Stockfish integration)
- [ ] Daily puzzles
- [ ] Tournaments
- [ ] Spectator mode
- [ ] Game analysis (post-game review)
- [ ] Opening book
- [ ] Achievements/badges
- [ ] Seasons/leagues
- [ ] Mobile apps (iOS/Android)
- [ ] Twitch integration
- [ ] Chess variants (960, 3-check, etc.)

---

## 📚 ADDITIONAL RESOURCES

### **Libraries & Tools**:
- **chess.js**: Chess move validation and game logic
- **stockfish.js**: Chess AI engine (for practice mode)
- **simple-peer**: WebRTC wrapper for voice chat
- **socket.io-client-unity**: Socket.IO for Unity
- **react-unity-webgl**: Unity WebGL in React

### **References**:
- Chess.com API documentation
- Lichess.org open source code
- FIDE chess rules
- ELO rating system (Arpad Elo)
- WebRTC documentation
- Unity WebGL best practices

### **Design Inspiration**:
- Chess.com UI/UX
- Lichess.org clean design
- Free Fire voice chat controls
- Discord friend request system
- Fortnite matchmaking UI

---

## 🏁 CONCLUSION

This comprehensive prompt provides **everything needed** to build a world-class chess game:

✅ **Complete architecture** (backend + Unity frontend + website)  
✅ **Detailed feature specifications** (every screen, flow, interaction)  
✅ **Security implementation** (10/10 enterprise-grade)  
✅ **Performance optimization** (100,000 concurrent users)  
✅ **Professional UI/UX design** (chess.com quality)  
✅ **Integration with Swaggo** (auth, friends, social features)  
✅ **Voice chat system** (WebRTC with full controls)  
✅ **Matchmaking & ranking** (ELO-based, like chess.com)  
✅ **Friend system** (website integration, recent players, blocking)  
✅ **8-week implementation plan** (phased approach)  
✅ **Production deployment** (scalable, monitored, CI/CD)  

---

## 🚀 NEXT STEPS

1. **Review this document** with your development team
2. **Set up project structure** (create folders, initialize repos)
3. **Install dependencies** (backend packages, Unity project)
4. **Start with Phase 1** (backend foundation)
5. **Follow the 8-week plan** (deliver incrementally)
6. **Test thoroughly** (security, performance, UX)
7. **Deploy to production** (soft launch → public)
8. **Iterate based on feedback** (continuous improvement)

---

**This is your blueprint for a production-ready, world-class chess game. Every detail has been specified. Now it's time to build!** 🚀♟️
