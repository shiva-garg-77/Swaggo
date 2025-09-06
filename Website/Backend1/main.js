import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import cookieParser from 'cookie-parser';
import LoginRoutes from './Routes/LoginRoutes.js';
import { Connectdb } from './db/Connectdb.js';
import { expressMiddleware } from '@apollo/server/express4';
import TypeDef from './Controller/TypeDefs.js';
import Resolvers from './Controller/Resolver.js';
import auth from './Middleware/Auth.js';
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
app.use(cors(
  {
  origin: 'http://localhost:3000',
  credentials: true, // <- this is important for cookies
}
));
app.use(express.json());
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
  res.json({ url: fileUrl });
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

const authWrapper = (req, res) =>
  new Promise((resolve) => {
    auth(req, res, () => resolve());
  });

// Graphql With auth
app.use('/graphql', async (req, res, next) => {
  await authWrapper(req, res);
  expressMiddleware(server, {
    context: async () => {
      return {
        user: req.user,
        req,
        res
      }
    }
  })(req, res, next);
});

// Graphql Without auth

// app.use('/graphql', 
//   expressMiddleware(server)
// );

// === Start Server ===
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
  console.log(`📦 File uploads at http://localhost:${port}/upload`);
});
