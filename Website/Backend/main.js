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

// Static folder for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
const server = new ApolloServer({
  typeDefs: TypeDef,
  resolvers: Resolvers
});
await server.start();

// === Routes ===
app.use('/api', LoginRoutes);
app.get('/', (req, res) => {
  res.send('hello');
});

// Debug endpoint to check file existence
app.get('/debug/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  const fs = require('fs');
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
  expressMiddleware(server, {
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


// === Start Server ===
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
  console.log(`📦 File uploads at http://localhost:${port}/upload`);
});
