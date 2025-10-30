# 🚀 QUICK START - Chess Game Implementation

## 📋 Pre-Implementation Checklist

### ✅ Requirements
- [ ] Node.js 18+ installed
- [ ] MongoDB running
- [ ] Redis running  
- [ ] Unity 2021.3 LTS or newer installed
- [ ] Git repository initialized

## 🎯 PHASE 1: Backend Setup (Start Here)

### Step 1: Create Project Structure
```bash
# Navigate to chess backend folder
cd C:\swaggo-testing\Swaggo\games\Chess\Backend

# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express socket.io mongoose redis ioredis chess.js
npm install jsonwebtoken argon2 joi helmet cors cookie-parser compression
npm install dotenv winston

# Install dev dependencies
npm install --save-dev nodemon jest supertest @types/node
```

### Step 2: Create Folder Structure
```bash
# Create all required folders
mkdir config controllers services models middleware routes utils

# Create service subfolders
mkdir services/chess services/matchmaking services/social services/voice

# Create model files
mkdir models/chess
```

### Step 3: Environment Setup
Create `.env.local` file:
```env
# Server
PORT=4001
NODE_ENV=development

# Database (use existing Swaggo MongoDB)
MONGODB_URI=mongodb://localhost:27017/swaggo

# Redis (use existing Swaggo Redis)
REDIS_URL=redis://localhost:6379

# Authentication (from main Swaggo backend)
ACCESS_TOKEN_SECRET=<copy from main backend>
REFRESH_TOKEN_SECRET=<copy from main backend>
JWT_EXPIRES_IN=15m

# Chess specific
MATCHMAKING_TIMEOUT=60000
GAME_TIMEOUT=3600000
RATING_K_FACTOR_NEW=40
RATING_K_FACTOR_INTERMEDIATE=32
RATING_K_FACTOR_EXPERIENCED=24

# WebRTC
ICE_SERVERS=stun:stun.l.google.com:19302

# Rate Limiting
RATE_LIMIT_MATCHMAKING=10
RATE_LIMIT_CHAT=10
RATE_LIMIT_FRIENDS=10
```

### Step 4: Create Main Server File
Create `server.js`:
```javascript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Redis from 'ioredis';

dotenv.config({ path: '.env.local' });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Connect to Redis
const redis = new Redis(process.env.REDIS_URL);
redis.on('connect', () => console.log('✅ Redis connected'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'chess-backend' });
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('authenticate', async (data) => {
    // TODO: Implement authentication
    console.log('Authenticate request:', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Chess backend running on port ${PORT}`);
});
```

### Step 5: Test Backend
```bash
# Start the server
npm run dev

# In another terminal, test the health endpoint
curl http://localhost:4001/health
```

---

## 🎮 PHASE 2: Unity Setup

### Step 1: Create Unity Project
1. Open Unity Hub
2. Create new project:
   - Name: `SwaggoChess`
   - Template: `2D` or `3D` (your choice)
   - Location: `C:\swaggo-testing\Swaggo\games\Chess\Frontend\UnityProject`

### Step 2: Install Required Packages
1. Open Package Manager (Window → Package Manager)
2. Install:
   - TextMeshPro
   - Universal RP (optional for better graphics)

### Step 3: Install Socket.IO Unity Client
```bash
# In Unity project folder
cd Assets
mkdir Plugins
cd Plugins

# Download SocketIOUnity from:
# https://github.com/itisnajim/SocketIOUnity
```

### Step 4: Configure WebGL Build Settings
1. File → Build Settings
2. Switch Platform to WebGL
3. Player Settings:
   - Compression Format: Brotli
   - Code Optimization: Runtime Speed
   - Enable Exceptions: None
   - Strip Engine Code: Enabled

### Step 5: Create Basic Scene
1. Create Scene: `Assets/Scenes/MainMenu.unity`
2. Add Canvas with UI elements
3. Add EventSystem
4. Create basic "Connect to Server" button

---

## 🌐 PHASE 3: Website Integration

### Step 1: Create Games Page
```bash
cd C:\swaggo-testing\Swaggo\Website\Frontend\app
mkdir games
cd games
```

Create `page.jsx`:
```jsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function GamesPage() {
  const games = [
    {
      id: 'chess',
      title: 'Chess',
      thumbnail: '/images/games/chess.jpg',
      players: '0 online',
      description: 'Strategic chess game with ranking',
      path: '/games/chess'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-8">Swaggo Games</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <motion.div
              key={game.id}
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
            >
              <div className="aspect-video bg-gray-800 rounded-lg mb-4">
                {/* Game thumbnail */}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{game.title}</h2>
              <p className="text-gray-300 mb-4">{game.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-green-400">{game.players}</span>
                <Link 
                  href={game.path}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                >
                  Play Now
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Step 2: Create Chess Game Page
```bash
mkdir chess
cd chess
```

Create `page.jsx`:
```jsx
'use client';

import { useEffect, useState } from 'react';

export default function ChessPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Load Unity WebGL build
    setTimeout(() => setLoading(false), 2000);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Chess Game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900">
      {/* Unity WebGL container will go here */}
      <div id="unity-container" className="w-full h-full">
        <p className="text-white text-center p-8">Unity game will load here</p>
      </div>
    </div>
  );
}
```

---

## 📝 NEXT STEPS - IMPLEMENTATION ORDER

### Week 1-2: Backend Foundation
- [ ] Create all MongoDB models (ChessGame, ChessPlayer, etc.)
- [ ] Implement ChessEngine service (chess.js integration)
- [ ] Implement MatchmakingService
- [ ] Implement RankingService (ELO calculations)
- [ ] Setup Socket.IO event handlers
- [ ] Integrate with existing Swaggo auth
- [ ] Add rate limiting middleware
- [ ] Write unit tests

### Week 3-4: Unity Core Game
- [ ] Create chess board UI
- [ ] Implement piece movement logic
- [ ] Add Socket.IO connection manager
- [ ] Implement authentication flow
- [ ] Create matchmaking UI
- [ ] Add game state synchronization
- [ ] Implement timer system

### Week 5: Unity Polish & Features
- [ ] Add voice chat (WebRTC)
- [ ] Implement chat system
- [ ] Create lobby system
- [ ] Add sound effects
- [ ] Implement settings panel
- [ ] Add animations and transitions
- [ ] Build WebGL version

### Week 6: Website Integration
- [ ] Complete /games page design
- [ ] Integrate Unity WebGL build
- [ ] Test authentication flow
- [ ] Add loading states
- [ ] Implement error handling
- [ ] Test responsive design

### Week 7: Testing & QA
- [ ] Unit tests (backend)
- [ ] Integration tests
- [ ] Load testing (Socket.IO)
- [ ] Security testing
- [ ] Browser compatibility testing
- [ ] Mobile testing

### Week 8: Deployment
- [ ] Production environment setup
- [ ] Deploy backend to production
- [ ] Deploy Unity build to CDN
- [ ] Configure nginx/load balancer
- [ ] Setup monitoring (Grafana)
- [ ] Soft launch & feedback
- [ ] Public launch

---

## 🔧 DEVELOPMENT COMMANDS

### Backend Commands
```bash
# Development
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run type-check
```

### Unity Commands
```bash
# Build WebGL (in Unity)
File → Build Settings → Build

# Test locally
# Use Unity's built-in WebGL test server
```

### Website Commands
```bash
cd C:\swaggo-testing\Swaggo\Website\Frontend

# Development
npm run dev:3000

# Build
npm run build

# Start production
npm start
```

---

## 📚 RESOURCES

### Documentation
- **Main Prompt**: `COMPREHENSIVE_CHESS_PROMPT.md` (full specifications)
- **Backend API**: Will be documented as you build
- **Socket Events**: See main prompt for complete list

### Libraries
- **Backend**: express, socket.io, mongoose, chess.js, redis
- **Unity**: SocketIOUnity, TextMeshPro
- **Website**: Next.js, React, Tailwind CSS, Framer Motion

### References
- Chess.com (for UI inspiration)
- Lichess.org (open source chess platform)
- Socket.IO docs: https://socket.io/docs/
- Chess.js docs: https://github.com/jhlywa/chess.js

---

## ⚠️ IMPORTANT NOTES

1. **Authentication**: Reuse existing Swaggo authentication system
2. **Database**: Use existing MongoDB connection from main backend
3. **Redis**: Share Redis instance with main backend (different key prefixes)
4. **Socket.IO Port**: Use 4001 to avoid conflicts with main backend (4000)
5. **CORS**: Configure CORS to allow website origin
6. **Security**: Follow all security guidelines from main prompt

---

## 🎯 MVP CHECKLIST (Minimum Viable Product)

Focus on these features first:

- [ ] User authentication (reuse Swaggo auth)
- [ ] Matchmaking (basic queue system)
- [ ] Chess board UI (clickable pieces)
- [ ] Move validation (chess.js server-side)
- [ ] Timer system (countdown)
- [ ] Win/loss/draw detection
- [ ] Basic ELO rating updates
- [ ] Simple chat system
- [ ] WebGL build working on website

**Once MVP is done, add advanced features from main prompt!**

---

## 🤝 TEAM COLLABORATION

### Recommended Team Structure
- **1 Backend Developer**: Node.js, Socket.IO, MongoDB
- **1 Unity Developer**: C#, Unity, WebGL
- **1 Frontend Developer**: React, Next.js, integration
- **1 QA/DevOps**: Testing, deployment, monitoring

### Git Workflow
```bash
# Create feature branches
git checkout -b feature/matchmaking
git checkout -b feature/chess-board-ui

# Commit frequently
git add .
git commit -m "feat: implement matchmaking service"

# Push and create PR
git push origin feature/matchmaking
```

---

**Ready to build? Start with Phase 1 (Backend Setup) and work through each phase systematically!** 🚀

Good luck! 🎮♟️
