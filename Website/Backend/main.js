import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import cookieParser from 'cookie-parser';
import LoginRoutes from './Routes/LoginRoutes.js';
import { Connectdb } from './db/Connectdb.js';
import { expressMiddleware } from '@apollo/server/express4';
import TypeDef from './Controllers/TypeDefs.js';
import Resolvers from './Controllers/Resolver.js';
import auth from './Middleware/Auth.js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Chat from './models/FeedModels/Chat.js';
import Message from './models/FeedModels/Message.js';
import Profile from './models/FeedModels/Profile.js';
import { v4 as uuidv4 } from 'uuid';
dotenv.config({ path: '.env.local' });

const app = express();
const port = process.env.PORT;

// Helpers for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Middlewares ===
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true, // <- this is important for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Custom video and file streaming endpoint with better control
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  
  // Set proper MIME type based on extension
  const ext = path.extname(filename).toLowerCase();
  let contentType = 'application/octet-stream';
  let isVideo = false;
  
  switch (ext) {
    case '.mp4':
      contentType = 'video/mp4';
      isVideo = true;
      break;
    case '.webm':
      contentType = 'video/webm';
      isVideo = true;
      break;
    case '.ogg':
      contentType = 'video/ogg';
      isVideo = true;
      break;
    case '.avi':
      contentType = 'video/x-msvideo';
      isVideo = true;
      break;
    case '.mov':
      contentType = 'video/quicktime';
      isVideo = true;
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.gif':
      contentType = 'image/gif';
      break;
    case '.webp':
      contentType = 'image/webp';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    default:
      contentType = 'application/octet-stream';
  }
  
  if (range) {
    // Handle range requests for video streaming
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true'
    });
    
    file.pipe(res);
  } else {
    // Send full file
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Cache-Control': 'public, max-age=31536000' // 1 year cache
    });
    
    fs.createReadStream(filePath).pipe(res);
  }
});

// === Multer Setup ===

const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// === REST Endpoint for Upload ===

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `${req.protocol}://${req.hostname}:${port}/uploads/${req.file.filename}`;
  res.json({ 
    success: true,
    fileUrl: fileUrl,
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size
  });
});

// === Connect to DB ===
await Connectdb();

// === Apollo Server Setup ===
const apolloServer = new ApolloServer({
  typeDefs: TypeDef,
  resolvers: Resolvers
});
await apolloServer.start();

// === Routes ===
app.use('/api', LoginRoutes);
app.get('/', (req, res) => {
  res.send('hello');
});

// Debug endpoint to check file existence
app.get('/debug/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  const exists = fs.existsSync(filePath);
  
  res.json({
    filename,
    exists,
    fullPath: filePath,
    uploadDir: path.join(__dirname, 'uploads')
  });
});


// GraphQL with Auth

const authWrapper = (req, res) =>
  new Promise((resolve) => {
    auth(req, res, () => resolve());
  });



// GraphQL with optional authentication (let resolvers handle auth checks)
app.use(
  '/graphql',
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }),
  expressMiddleware(apolloServer, {
    context: async ({ req, res }) => {
      // Try to extract user from token without failing the request
      let user = null;
      
      console.log('\n🔍 GraphQL Context Debug:');
      console.log('Request headers:', {
        authorization: req.headers['authorization'] ? 'Present' : 'Missing',
        'user-agent': req.headers['user-agent'],
        origin: req.headers['origin']
      });
      
      try {
        const authHeader = req.headers['authorization'];
        console.log('Auth header:', authHeader ? `Bearer ${authHeader.split(' ')[1]?.substring(0, 20)}...` : 'Not found');
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          console.log('Attempting to verify token...');
          const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
          user = decoded;
          console.log('✅ Token verified successfully for user:', user.username);
        } else {
          console.log('❌ No valid Authorization header found');
        }
      } catch (err) {
        // Don't fail here - let individual resolvers handle authentication
        console.log('❌ Token verification failed:', err.message);
      }
      
      console.log('Final user context:', user ? `User: ${user.username}` : 'No user');
      
      return {
        user,
        req,
        res
      }
    }
  })
);


// === Create HTTP server for Socket.io ===
const server = http.createServer(app);

// === Socket.io Setup ===
const io = new SocketIOServer(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const profile = await Profile.findOne({ profileid: decoded.profileid });
    
    if (!profile) {
      throw new Error('User not found');
    }
    
    socket.user = {
      profileid: profile.profileid,
      username: profile.username
    };
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error('Authentication failed'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.user.username} (${socket.user.profileid})`);
  
  // Join user to their personal room for notifications
  socket.join(`user_${socket.user.profileid}`);
  
  // Handle joining chat rooms
  socket.on('join_chat', async (chatid) => {
    try {
      // Verify user has access to this chat
      const chat = await Chat.findOne({ 
        chatid, 
        participants: socket.user.profileid,
        isActive: true 
      });
      
      if (chat) {
        socket.join(chatid);
        console.log(`📨 ${socket.user.username} joined chat: ${chatid}`);
        
        // Notify other participants that user is online
        socket.to(chatid).emit('user_joined', {
          profileid: socket.user.profileid,
          username: socket.user.username
        });
      } else {
        socket.emit('error', 'Unauthorized to join this chat');
      }
    } catch (error) {
      console.error('Error joining chat:', error);
      socket.emit('error', 'Failed to join chat');
    }
  });
  
  // Handle leaving chat rooms
  socket.on('leave_chat', (chatid) => {
    socket.leave(chatid);
    socket.to(chatid).emit('user_left', {
      profileid: socket.user.profileid,
      username: socket.user.username
    });
    console.log(`📤 ${socket.user.username} left chat: ${chatid}`);
  });
  
  // Handle sending messages
  socket.on('send_message', async (data, callback) => {
    try {
      const { chatid, messageType, content, attachments, replyTo, mentions, clientMessageId } = data;
      
      // Verify user has access to this chat
      const chat = await Chat.findOne({ 
        chatid, 
        participants: socket.user.profileid,
        isActive: true 
      });
      
      if (!chat) {
        socket.emit('error', 'Unauthorized to send message to this chat');
        return;
      }
      
      // Create new message
      const newMessage = new Message({
        messageid: uuidv4(),
        chatid,
        senderid: socket.user.profileid,
        messageType: messageType || 'text',
        content,
        attachments: attachments || [],
        replyTo,
        mentions: mentions || [],
        messageStatus: 'sent'
      });
      
      await newMessage.save();
      
      // Update chat's last message
      chat.lastMessage = newMessage.messageid;
      chat.lastMessageAt = new Date();
      await chat.save();
      
      // Populate message data for real-time broadcast
      const populatedMessage = await Message.findOne({ messageid: newMessage.messageid })
        .populate('senderid', 'username profilePic')
        .populate('mentions', 'username profilePic');
      
      // Broadcast message to all participants in the chat
      io.to(chatid).emit('new_message', {
        message: populatedMessage,
        chat: {
          chatid: chat.chatid,
          lastMessageAt: chat.lastMessageAt
        }
      });
      
      // Send notification to offline users
      const offlineParticipants = chat.participants.filter(pid => pid !== socket.user.profileid);
      offlineParticipants.forEach(participantId => {
        io.to(`user_${participantId}`).emit('message_notification', {
          chatid,
          message: populatedMessage,
          sender: {
            profileid: socket.user.profileid,
            username: socket.user.username
          }
        });
      });
      
      console.log(`💬 Message sent in ${chatid} by ${socket.user.username}`);
      
      // Send acknowledgment to sender
      if (callback) {
        callback({ 
          success: true, 
          messageId: clientMessageId,
          serverMessageId: newMessage.messageid,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Send error acknowledgment
      if (callback) {
        callback({ 
          success: false, 
          messageId: clientMessageId,
          error: error.message 
        });
      } else {
        socket.emit('error', 'Failed to send message');
      }
    }
  });
  
  // Handle typing indicators
  socket.on('typing_start', (chatid) => {
    socket.to(chatid).emit('user_typing', {
      profileid: socket.user.profileid,
      username: socket.user.username,
      isTyping: true
    });
  });
  
  socket.on('typing_stop', (chatid) => {
    socket.to(chatid).emit('user_typing', {
      profileid: socket.user.profileid,
      username: socket.user.username,
      isTyping: false
    });
  });
  
  // Handle message read status
  socket.on('mark_message_read', async (data) => {
    try {
      const { messageid, chatid } = data;
      
      const message = await Message.findOne({ messageid, isDeleted: false });
      if (!message) {
        socket.emit('error', 'Message not found');
        return;
      }
      
      // Check if already marked as read
      const existingRead = message.readBy.find(
        read => read.profileid === socket.user.profileid
      );
      
      if (!existingRead) {
        message.readBy.push({
          profileid: socket.user.profileid,
          readAt: new Date()
        });
        await message.save();
        
        // Broadcast read status to other participants
        socket.to(chatid).emit('message_read', {
          messageid,
          readBy: {
            profileid: socket.user.profileid,
            username: socket.user.username,
            readAt: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      socket.emit('error', 'Failed to mark message as read');
    }
  });
  
  // Handle message reactions
  socket.on('react_to_message', async (data) => {
    try {
      const { messageid, emoji, chatid } = data;
      
      const message = await Message.findOne({ messageid, isDeleted: false });
      if (!message) {
        socket.emit('error', 'Message not found');
        return;
      }
      
      // Remove existing reaction from this user
      message.reactions = message.reactions.filter(
        reaction => reaction.profileid !== socket.user.profileid
      );
      
      // Add new reaction
      message.reactions.push({
        profileid: socket.user.profileid,
        emoji,
        createdAt: new Date()
      });
      
      await message.save();
      
      // Broadcast reaction to other participants
      socket.to(chatid).emit('message_reaction', {
        messageid,
        reaction: {
          profileid: socket.user.profileid,
          username: socket.user.username,
          emoji,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error reacting to message:', error);
      socket.emit('error', 'Failed to react to message');
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`👋 User disconnected: ${socket.user.username}`);
  });
});

// === Start Server ===
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
  console.log(`📦 File uploads at http://localhost:${port}/upload`);
  console.log(`💬 Socket.io ready for real-time chat`);
});
