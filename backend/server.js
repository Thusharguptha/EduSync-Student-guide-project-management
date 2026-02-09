import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import templateRoutes from './routes/templateRoutes.js'; // NEW
import ChatMessage from './models/ChatMessage.js';
import Allocation from './models/Allocation.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enhanced CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

// Static hosting for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', templateRoutes); // NEW: Template routes

// Socket.io setup
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('No token'));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    next(err);
  }
});

io.on('connection', async (socket) => {
  const { id, role } = socket.user;
  // personal room
  socket.join(`user:${id}`);

  if (role === 'teacher') {
    const allocs = await Allocation.find({ teacherId: id }).select('studentId');
    allocs.forEach(a => {
      const roomId = `direct:${id}:${a.studentId.toString()}`;
      socket.join(roomId);
    });
    socket.join(`broadcast:${id}`);
  }

  socket.on('chat:send', async (payload) => {
    const { toUserId, text, mode } = payload || {};
    if (!text || !mode) return;
    let roomType = mode === 'broadcast' ? 'broadcast' : 'direct';
    let roomId;
    let receiverId = null;

    if (roomType === 'direct') {
      if (!toUserId) return;
      const a = id;
      const b = toUserId;
      roomId = `direct:${a}:${b}`;
      receiverId = toUserId;
    } else {
      if (role !== 'teacher') return; // only teacher broadcasts
      roomId = `broadcast:${id}`;
    }

    const msg = await ChatMessage.create({
      roomType,
      roomId,
      senderId: id,
      receiverId,
      text,
    });

    const enriched = {
      _id: msg._id,
      roomType,
      roomId,
      senderId: id,
      receiverId,
      text,
      createdAt: msg.createdAt,
    };

    if (roomType === 'direct') {
      io.to(`user:${id}`).emit('chat:message', enriched);
      io.to(`user:${toUserId}`).emit('chat:message', enriched);
    } else {
      io.to(`broadcast:${id}`).emit('chat:message', enriched);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
