# 🏆 Swaggo Chess Backend

Production-ready multiplayer chess game backend with 10/10 security and performance.

## 🚀 Features

- **Real-time Multiplayer:** Socket.IO for instant game updates
- **ELO Rating System:** Chess.com-style ranking (400-3000+)
- **Matchmaking:** Intelligent rank-based pairing
- **Voice Chat:** WebRTC peer-to-peer voice communication
- **Friend System:** Invite friends and recent players
- **Anti-Cheat:** Advanced detection algorithms
- **Rate Limiting:** Comprehensive protection against abuse
- **Caching:** Redis for optimal performance

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your configuration
nano .env.local

# Start development server
npm run dev

# Start production server
npm start
```

## 🏗️ Project Structure

```
Backend/
├── Models/           # MongoDB schemas
├── Services/         # Business logic
├── Controllers/      # Socket.IO & REST handlers
├── Middleware/       # Auth, rate limiting, validation
├── Utils/            # Helper functions
├── GraphQL/          # GraphQL schemas & resolvers
└── main.js           # Entry point
```

## 🔌 Socket.IO Events

### Client → Server
- `chess:authenticate` - Authenticate player
- `chess:joinQueue` - Join matchmaking queue
- `chess:makeMove` - Make a chess move
- `chess:sendInvite` - Send game invite
- `chess:gameChat` - Send chat message

### Server → Client
- `chess:authenticated` - Authentication success
- `chess:matchFound` - Match found
- `chess:moveMade` - Move broadcast
- `chess:gameOver` - Game ended
- `chess:inviteReceived` - Invite received

## 🔒 Security

- JWT authentication
- Rate limiting on all endpoints
- Input validation & sanitization
- Anti-cheat detection
- Audit logging

## ⚡ Performance

- Redis caching
- Connection pooling
- Database indexing
- Message batching
- Optimized queries

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📊 Monitoring

- Winston logging
- Performance metrics
- Error tracking
- Security audit logs

## 🚀 Deployment

See `COMPREHENSIVE_CHESS_IMPLEMENTATION_PROMPT.md` for detailed deployment instructions.

## 📝 License

MIT License - Swaggo Team
